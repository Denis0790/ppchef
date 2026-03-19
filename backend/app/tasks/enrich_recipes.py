import asyncio
import json
import logging
import re
from typing import Optional

import httpx
from sqlalchemy import select

from app.tasks.celery_app import celery_app
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.recipe import Recipe

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "meta-llama/llama-3.3-70b-instruct:free"

SYSTEM_PROMPT = """Ты эксперт по правильному питанию (ПП). 
Тебе дают рецепт и ты должен:
1. Определить является ли рецепт ПП (правильное питание)
2. Если да — заполнить поля пользы, советов и витаминов
3. Уточнить категорию

Правила ПП:
- Белок преобладает или сопоставим с жирами/углеводами
- Нет жареного в масле, майонеза, большого количества сахара
- Калории на порцию не более 700 ккал
- Десерты и смузи — разрешены если на основе творога, фруктов, ягод, без большого количества сахара

Отвечай ТОЛЬКО валидным JSON без markdown и пояснений:
{
  "is_pp": true/false,
  "category": "breakfast/lunch/dinner/snack/dessert/soup/salad/smoothie",
  "benefit": "краткое описание пользы 1-2 предложения",
  "nutritionist_tips": "совет нутрициолога 1-2 предложения",
  "vitamins": "основные витамины и минералы через запятую"
}"""


async def call_openrouter(recipe: Recipe) -> Optional[dict]:
    ingredients_text = ""
    if recipe.ingredients:
        ingredients_text = ", ".join([
            f"{ing.name} {ing.amount or ''}" for ing in recipe.ingredients
        ])

    user_message = f"""Рецепт: {recipe.title}
Калории на порцию: {recipe.calories or 'неизвестно'}
Белки: {recipe.protein or '?'}г, Жиры: {recipe.fat or '?'}г, Углеводы: {recipe.carbs or '?'}г
Категория: {recipe.category}
Ингредиенты: {ingredients_text}"""

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ppchef.ru",
                    "X-Title": "PP Chef",  # только латиница!
                },
                                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.3,
                },
            )
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            # Убираем возможные markdown блоки
            text = re.sub(r"```json|```", "", text).strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"Ошибка OpenRouter: {e}")
            return None


async def enrich_batch(batch_size: int = 10, dry_run: bool = False):
    async with AsyncSessionLocal() as db:
        # Берём рецепты без benefit в статусе draft
        result = await db.execute(
            select(Recipe)
            .where(Recipe.status == "draft")
            .where(Recipe.benefit == None)
            .limit(batch_size)
        )
        recipes = result.scalars().all()

        if not recipes:
            logger.info("Нет рецептов для обработки")
            return {"processed": 0, "approved": 0, "rejected": 0}

        # Подгружаем ингредиенты
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Recipe)
            .options(selectinload(Recipe.ingredients))
            .where(Recipe.status == "draft")
            .where(Recipe.benefit == None)
            .limit(batch_size)
        )
        recipes = result.scalars().all()

        processed = 0
        approved = 0
        rejected = 0

        for recipe in recipes:
            logger.info(f"Обрабатываем: {recipe.title}")
            data = await call_openrouter(recipe)

            if data is None:
                logger.warning(f"Нет ответа для: {recipe.title}")
                await asyncio.sleep(2)
                continue

            processed += 1

            if dry_run:
                logger.info(f"DRY RUN — {recipe.title}: {data}")
                continue

            if not data.get("is_pp", False):
                # Помечаем как rejected
                recipe.status = "rejected"
                rejected += 1
                logger.info(f"❌ Отклонён: {recipe.title}")
            else:
                # Заполняем поля
                recipe.benefit = data.get("benefit")
                recipe.nutritionist_tips = data.get("nutritionist_tips")
                recipe.vitamins = data.get("vitamins")
                if data.get("category"):
                    recipe.category = data["category"]
                approved += 1
                logger.info(f"✅ Одобрен: {recipe.title}")

            await asyncio.sleep(1.5)  # пауза между запросами

        await db.commit()
        logger.info(f"Итого: обработано {processed}, одобрено {approved}, отклонено {rejected}")
        return {"processed": processed, "approved": approved, "rejected": rejected}


@celery_app.task(name="enrich_recipes_with_ai")
def enrich_recipes_with_ai(batch_size: int = 20, dry_run: bool = False):
    """Обрабатывает рецепты через AI — проверяет ПП и заполняет поля"""
    return asyncio.run(enrich_batch(batch_size, dry_run))