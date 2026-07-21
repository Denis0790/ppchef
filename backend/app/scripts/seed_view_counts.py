"""
Разовый скрипт: заполняет view_count стартовыми значениями 200-700
для уже существующих рецептов, с разбросом по давности, категории и избранному.

Запуск (один раз):
docker compose exec backend python -m app.scripts.seed_view_counts
"""
import asyncio
import random
from datetime import datetime, timezone

from sqlalchemy import select, func

from app.db.session import AsyncSessionLocal
from app.models.recipe import Recipe, Favorite

CATEGORY_WEIGHT = {
    "breakfast": 1.15,
    "dessert": 1.2,
    "lunch": 1.05,
    "dinner": 1.0,
    "snack": 0.9,
    "salad": 0.85,
    "soup": 0.95,
    "smoothie": 0.8,
}


async def seed():
    async with AsyncSessionLocal() as session:
        # Считаем избранное по рецептам одним запросом
        fav_result = await session.execute(
            select(Favorite.recipe_id, func.count(Favorite.id))
            .group_by(Favorite.recipe_id)
        )
        favorites_by_recipe = {row[0]: row[1] for row in fav_result.all()}

        result = await session.execute(select(Recipe))
        recipes = list(result.scalars().all())

        now = datetime.now(timezone.utc)

        for r in recipes:
            base = random.uniform(200, 700)

            created_at = r.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            days_old = (now - created_at).days
            age_factor = 1 + min(days_old / 365, 0.4)

            fav_count = favorites_by_recipe.get(r.id, 0)
            fav_factor = 1 + min(fav_count * 0.02, 0.5)

            category_key = r.category.value if hasattr(r.category, "value") else str(r.category)
            cat_factor = CATEGORY_WEIGHT.get(category_key, 1.0)

            noise = random.uniform(0.85, 1.15)

            final = int(base * age_factor * fav_factor * cat_factor * noise)
            r.view_count = max(200, min(final, 900))

        await session.commit()
        print(f"Готово: обновлено {len(recipes)} рецептов")


if __name__ == "__main__":
    asyncio.run(seed())