import uuid
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    agreed_to_terms: bool
    agreed_to_personal_data: bool

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Пароль должен быть не менее 8 символов")
        return v

    @field_validator("agreed_to_terms", "agreed_to_personal_data")
    @classmethod
    def must_be_true(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Необходимо принять условия")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_premium: bool
    is_superuser: bool
    email_verified: bool
    ref_code: str | None = None
    referral_count: int = 0

    model_config = {"from_attributes": True}

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_premium: bool
    is_superuser: bool
    email_verified: bool
    daily_calories: float | None = None
    daily_protein: float | None = None
    daily_fat: float | None = None
    daily_carbs: float | None = None
    show_daily_percent: bool = False
    stop_words: str | None = None
    subscription_plan: str | None = None
    subscription_expires_at: datetime | None = None

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    daily_calories: float | None = None
    daily_protein: float | None = None
    daily_fat: float | None = None
    daily_carbs: float | None = None
    show_daily_percent: bool | None = None
    stop_words: str | None = None