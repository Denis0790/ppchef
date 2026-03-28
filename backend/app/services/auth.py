import uuid
import secrets
import string
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, RefreshToken, ConsentLog
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, hash_token
from app.core.config import settings


def generate_ref_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(8))


async def register_user(
    data: RegisterRequest,
    db: AsyncSession,
    request: Request,
    ref_code: str | None = None,
) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email уже зарегистрирован",
        )

    user = User(
    email=data.email,
    hashed_password=hash_password(data.password),
    ref_code=generate_ref_code(),
    is_active=False,
    email_verified=False,
)
    db.add(user)
    await db.flush()

    # Реферальная логика
    if ref_code:
        result = await db.execute(select(User).where(User.ref_code == ref_code))
        referrer = result.scalar_one_or_none()
        if referrer and referrer.id != user.id:
            user.referred_by = referrer.id
            referrer.referral_count = (referrer.referral_count or 0) + 1

            # Каждые 3 реферала — +1 месяц Premium
            if referrer.referral_count % 3 == 0:
                now = datetime.now(timezone.utc)
                if referrer.subscription_expires_at and referrer.subscription_expires_at > now:
                    referrer.subscription_expires_at += timedelta(days=30)
                else:
                    referrer.subscription_expires_at = now + timedelta(days=30)
                referrer.is_premium = True

    consent = ConsentLog(
        user_id=user.id,
        agreed_at=datetime.now(timezone.utc),
        ip_address=request.client.host if request.client else None,
    )
    db.add(consent)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(
    data: LoginRequest,
    db: AsyncSession,
    request: Request,
) -> tuple[TokenResponse, str]:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт заблокирован",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = secrets.token_urlsafe(64)

    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        ),
        created_at=datetime.now(timezone.utc),
    )
    db.add(rt)
    await db.commit()

    return TokenResponse(access_token=access_token), refresh_token


async def refresh_tokens(
    refresh_token: str,
    db: AsyncSession,
) -> tuple[TokenResponse, str]:
    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt = result.scalar_one_or_none()

    if not rt or rt.revoked_at or rt.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен",
        )

    rt.revoked_at = datetime.now(timezone.utc)

    new_refresh = secrets.token_urlsafe(64)
    new_rt = RefreshToken(
        user_id=rt.user_id,
        token_hash=hash_token(new_refresh),
        ip_address=rt.ip_address,
        user_agent=rt.user_agent,
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        ),
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_rt)
    await db.commit()

    access_token = create_access_token(str(rt.user_id))
    return TokenResponse(access_token=access_token), new_refresh


async def logout_user(
    refresh_token: str,
    db: AsyncSession,
) -> None:
    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt = result.scalar_one_or_none()
    if rt:
        rt.revoked_at = datetime.now(timezone.utc)
        await db.commit()


async def create_tokens_for_user(
    user: User,
    db: AsyncSession,
    request: Request,
) -> tuple[TokenResponse, str]:
    """Выдаёт токены без проверки пароля — используется после верификации кода."""
    access_token = create_access_token(str(user.id))
    refresh_token = secrets.token_urlsafe(64)

    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        ),
        created_at=datetime.now(timezone.utc),
    )
    db.add(rt)
    await db.commit()

    return TokenResponse(access_token=access_token), refresh_token