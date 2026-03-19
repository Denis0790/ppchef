import uuid
import hashlib
import hmac
import json
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User

import httpx

router = APIRouter()

PLANS = {
    "monthly": {"amount": "90.00", "description": "Подписка ПП Шеф — 1 месяц", "days": 30},
    "yearly": {"amount": "790.00", "description": "Подписка ПП Шеф — 1 год", "days": 365},
}


class CreatePaymentRequest(BaseModel):
    plan: str
    return_url: str = "https://ppchef.ru/subscription/success"


@router.post("/create")
async def create_payment(
    data: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Неверный тариф")

    plan = PLANS[data.plan]
    idempotence_key = str(uuid.uuid4())

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.yookassa.ru/v2/payments",
            auth=(settings.YUKASSA_SHOP_ID, settings.YUKASSA_SECRET_KEY),
            headers={"Idempotence-Key": idempotence_key, "Content-Type": "application/json"},
            json={
                "amount": {"value": plan["amount"], "currency": "RUB"},
                "confirmation": {"type": "redirect", "return_url": data.return_url},
                "capture": True,
                "description": plan["description"],
                "metadata": {"user_id": str(current_user.id), "plan": data.plan},
            }
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Ошибка создания платежа")

    payment = resp.json()
    return {
        "payment_id": payment["id"],
        "confirmation_url": payment["confirmation"]["confirmation_url"],
    }


@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    data = json.loads(body)

    if data.get("type") != "notification":
        return {"status": "ok"}

    event = data.get("object", {})
    if event.get("status") != "succeeded":
        return {"status": "ok"}

    metadata = event.get("metadata", {})
    user_id = metadata.get("user_id")
    plan = metadata.get("plan")

    if not user_id or plan not in PLANS:
        return {"status": "ok"}

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        return {"status": "ok"}

    days = PLANS[plan]["days"]
    now = datetime.now(timezone.utc)
    if user.subscription_expires_at and user.subscription_expires_at > now:
        user.subscription_expires_at = user.subscription_expires_at + timedelta(days=days)
    else:
        user.subscription_expires_at = now + timedelta(days=days)

    user.subscription_plan = plan
    user.is_premium = True
    await db.commit()

    return {"status": "ok"}