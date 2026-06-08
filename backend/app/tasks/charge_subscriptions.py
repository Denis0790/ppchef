import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy import select

from app.db.session import SyncSessionLocal
from app.models.user import User
from app.core.config import settings
from app.tasks.celery_app import celery_app

PLANS = {
    "monthly": {"amount": "90.00", "description": "Подписка ПП Шеф — 1 месяц", "days": 30},
    "yearly":  {"amount": "790.00", "description": "Подписка ПП Шеф — 1 год",   "days": 365},
}


@celery_app.task(name="app.tasks.charge_subscriptions.run")
def run():
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)

    with SyncSessionLocal() as db:
        result = db.execute(
            select(User).where(
                User.subscription_expires_at <= tomorrow,
                User.subscription_expires_at > now,
                User.payment_method_id.isnot(None),
                User.is_premium == True,
            )
        )
        users = result.scalars().all()
        print(f"[autopay] найдено пользователей: {len(users)}")

        for user in users:
            plan = user.subscription_plan or "monthly"
            plan_data = PLANS.get(plan, PLANS["monthly"])

            try:
                resp = httpx.post(
                    "https://api.yookassa.ru/v3/payments",
                    auth=(settings.YUKASSA_SHOP_ID, settings.YUKASSA_SECRET_KEY),
                    headers={
                        "Idempotence-Key": str(uuid.uuid4()),
                        "Content-Type": "application/json",
                    },
                    json={
                        "amount": {"value": plan_data["amount"], "currency": "RUB"},
                        "capture": True,
                        "payment_method_id": user.payment_method_id,
                        "description": f"Автопродление: {plan_data['description']}",
                        "metadata": {"user_id": str(user.id), "plan": plan},
                    },
                    timeout=10,
                )

                if resp.status_code in (200, 201):
                    print(f"[autopay] OK user={user.id}")
                else:
                    print(f"[autopay] FAIL user={user.id} status={resp.status_code} {resp.text}")
                    user.payment_method_id = None

            except Exception as e:
                print(f"[autopay] ERROR user={user.id} {e}")
                user.payment_method_id = None

        db.commit()


if __name__ == "__main__":
    run()