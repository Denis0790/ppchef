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

router = APIRouter()

COOKIE_NAME = "refresh_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 14  # 14 дней


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,      # True на продакшне (HTTPS)
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    data: RegisterRequest,
    request: Request,
    response: Response,
    ref: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    user = await register_user(data, db, request, ref_code=ref)
    return user


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
        from fastapi import HTTPException, status
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
    # Проверяем есть ли пользователь
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    # Всегда возвращаем success — чтобы не светить существование email
    if not user:
        return {"detail": "Если email зарегистрирован — письмо отправлено"}

    # Генерируем токен
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    # Сохраняем в Redis на 15 минут
    redis = await get_redis()
    if redis:
        await redis.setex(f"reset:{token_hash}", 900, str(user.id))

    # Отправляем письмо (пока просто логируем)
    reset_url = f"https://ppchef.ru/auth/reset?token={token}"
    print(f"[RESET PASSWORD] {user.email}: {reset_url}")

    # TODO: когда будет домен — раскомментировать
    # from app.tasks.send_email import send_email_task
    # send_email_task.delay(
    #     to=user.email,
    #     subject="Восстановление пароля — ПП Шеф",
    #     html=f"""
    #     <h2>Восстановление пароля</h2>
    #     <p>Нажмите кнопку ниже чтобы сбросить пароль:</p>
    #     <a href="{reset_url}" style="background:#4F7453;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
    #       Сбросить пароль
    #     </a>
    #     <p>Ссылка действует 15 минут.</p>
    #     """,
    # )

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

    # Удаляем токен
    await redis.delete(f"reset:{token_hash}")

    return {"detail": "Пароль успешно изменён"}