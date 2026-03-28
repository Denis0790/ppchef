from fastapi import APIRouter, Depends, Request, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth import register_user, login_user, refresh_tokens, logout_user
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UpdateProfileRequest
import secrets
import hashlib
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr
from app.core.redis import get_redis
from app.core.security import hash_password
from sqlalchemy import select
from typing import Optional
import random
from app.services.auth import create_tokens_for_user

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

router = APIRouter()

COOKIE_NAME = "refresh_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 14  # 14 дней


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,      # True на продакшне (HTTPS)
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/register", response_model=dict, status_code=201)
async def register(
    data: RegisterRequest,
    request: Request,
    response: Response,
    ref: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    # Проверяем — вдруг уже зарегистрирован
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    if existing and existing.is_active:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    # Создаём юзера неактивным (или обновляем существующего неактивного)
    if not existing:
        user = await register_user(data, db, request, ref_code=ref)
        # register_user должен создавать с is_active=False
    else:
        user = existing

    # Генерируем 4-значный код
    code = str(random.randint(1000, 9999))

    redis = await get_redis()
    if redis:
        # Ключ: email → код, TTL 10 минут
        await redis.setex(f"verify_code:{data.email}", 600, code)

    # Отправляем письмо
    from app.tasks.send_email import send_email_task
    send_email_task.delay(
        to=data.email,
        subject="Ваш код подтверждения — ПП Шеф",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#4F7453;">Добро пожаловать в ПП Шеф! 🌿</h2>
          <p>Ваш код подтверждения:</p>
          <div style="font-size:48px;font-weight:700;letter-spacing:12px;color:#4F7453;
                      text-align:center;padding:24px;background:#f5f0e8;
                      border-radius:16px;margin:16px 0;">
            {code}
          </div>
          <p style="color:#aaa;font-size:12px;">Код действует 10 минут.</p>
          <p style="color:#aaa;font-size:12px;">Если вы не регистрировались — проигнорируйте письмо.</p>
        </div>
        """,
    )

    return {"detail": "Код отправлен на email", "email": data.email}



@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token_response, refresh_token = await login_user(data, db, request)
    set_refresh_cookie(response, refresh_token)
    return token_response


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token отсутствует",
        )
    token_response, new_refresh = await refresh_tokens(refresh_token, db)
    set_refresh_cookie(response, new_refresh)
    return token_response


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        await logout_user(refresh_token, db)
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"detail": "Вышли из системы"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ── Восстановление пароля ─────────────────────────────────────────────────

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password/request")
async def request_password_reset(
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        return {"detail": "Если email зарегистрирован — письмо отправлено"}

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    redis = await get_redis()
    if redis:
        await redis.setex(f"reset:{token_hash}", 900, str(user.id))

    reset_url = f"https://ppchef.ru/auth/reset?token={token}"
    print(f"[RESET PASSWORD] {user.email}: {reset_url}")

    from app.tasks.send_email import send_email_task
    send_email_task.delay(
         to=user.email,
         subject="Восстановление пароля — ПП Шеф",
         html=f"""
         <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
           <h2 style="color:#4F7453;">Восстановление пароля</h2>
           <p>Нажмите кнопку ниже чтобы сбросить пароль:</p>
           <a href="{reset_url}" style="display:inline-block;background:#4F7453;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">
             Сбросить пароль
           </a>
           <p style="color:#aaa;font-size:12px;margin-top:16px;">Ссылка действует 15 минут.</p>
           <p style="color:#aaa;font-size:12px;">Если вы не запрашивали сброс — просто проигнорируйте письмо.</p>
         </div>
         """,
     )

    return {"detail": "Если email зарегистрирован — письмо отправлено"}


@router.post("/reset-password/confirm")
async def confirm_password_reset(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 8 символов")

    token_hash = hashlib.sha256(data.token.encode()).hexdigest()

    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=500, detail="Сервис недоступен")

    user_id = await redis.get(f"reset:{token_hash}")
    if not user_id:
        raise HTTPException(status_code=400, detail="Ссылка недействительна или истекла")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.hashed_password = hash_password(data.new_password)
    await db.commit()
    await redis.delete(f"reset:{token_hash}")

    return {"detail": "Пароль успешно изменён"}


# ── Верификация email ─────────────────────────────────────────────────────

class EmailVerifyRequest(BaseModel):
    token: str


@router.post("/verify-email/send")
async def send_verification_email(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.email_verified:
        return {"detail": "Email уже подтверждён"}

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    redis = await get_redis()
    if redis:
        await redis.setex(f"verify:{token_hash}", 86400, str(current_user.id))

    verify_url = f"https://ppchef.ru/auth/verify?token={token}"
    print(f"[VERIFY EMAIL] {current_user.email}: {verify_url}")

    from app.tasks.send_email import send_email_task
    send_email_task.delay(
        to=current_user.email,
         subject="Подтвердите email — ПП Шеф",
         html=f"""
         <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
           <h2 style="color:#4F7453;">Подтвердите ваш email</h2>
           <p>Нажмите кнопку ниже чтобы подтвердить адрес электронной почты:</p>
           <a href="{verify_url}" style="display:inline-block;background:#4F7453;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">
             Подтвердить email
           </a>
           <p style="color:#aaa;font-size:12px;margin-top:16px;">Ссылка действует 24 часа.</p>
           <p style="color:#aaa;font-size:12px;">Если вы не регистрировались — просто проигнорируйте письмо.</p>
         </div>
         """,
     )

    return {"detail": "Письмо отправлено"}


@router.post("/verify-email/confirm")
async def confirm_email(
    data: EmailVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()

    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=500, detail="Сервис недоступен")

    user_id = await redis.get(f"verify:{token_hash}")
    if not user_id:
        raise HTTPException(status_code=400, detail="Ссылка недействительна или истекла")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.email_verified = True
    await db.commit()
    await redis.delete(f"verify:{token_hash}")

    return {"detail": "Email подтверждён"}

@router.post("/verify-code", response_model=TokenResponse)
async def verify_registration_code(
    data: VerifyCodeRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=500, detail="Сервис недоступен")

    saved_code = await redis.get(f"verify_code:{data.email}")
    if not saved_code:
        raise HTTPException(status_code=400, detail="Код истёк или не был отправлен")

    if saved_code != data.code:
        raise HTTPException(status_code=400, detail="Неверный код")

    # Активируем юзера
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.is_active = True
    user.email_verified = True
    await db.commit()
    await db.refresh(user)
    await redis.delete(f"verify_code:{data.email}")

    token_response, refresh_token = await create_tokens_for_user(user, db, request)
    set_refresh_cookie(response, refresh_token)
    return token_response