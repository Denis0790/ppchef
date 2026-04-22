import uuid
import hashlib
import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.recipe import (
    RecipeCardSchema, RecipeDetailSchema,
    RecipeFilterParams, RecipeCategory, RecipeCreate
)
from app.services.recipe import get_recipes, get_recipe_by_id, get_popular_recipes, create_recipe
from app.models.recipe import Recipe
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.cache import cache_get, cache_set, cache_invalidate

router = APIRouter()


def recipe_to_card(r: Recipe) -> dict:
    data = RecipeCardSchema.model_validate(r).model_dump()
    data["ingredient_names"] = [i.name.lower() for i in (r.ingredients or [])]
    return data


@router.get("", response_model=dict)
async def list_recipes(
    category: RecipeCategory | None = Query(default=None),
    calories_min: float | None = Query(default=None),
    calories_max: float | None = Query(default=None),
    protein_min: float | None = Query(default=None),
    cook_time_max: int | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    # ── Ключ кеша на основе параметров запроса ─────────────────
    cache_key = f"recipes:list:{category}:{calories_min}:{calories_max}:{protein_min}:{cook_time_max}:{search}:{page}:{page_size}"

    cached = await cache_get(cache_key)
    if cached:
        return cached

    filters = RecipeFilterParams(
        category=category,
        calories_min=calories_min,
        calories_max=calories_max,
        protein_min=protein_min,
        cook_time_max=cook_time_max,
        search=search,
        page=page,
        page_size=page_size,
    )
    recipes, total = await get_recipes(filters, db)

    result = {
        "items": [recipe_to_card(r) for r in recipes],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }

    # ── Кешируем на 5 минут ────────────────────────────────────
    await cache_set(cache_key, result, ttl=300)

    return result


@router.get("/popular", response_model=list[dict])
async def popular_recipes(
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"recipes:popular:{limit}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    recipes = await get_popular_recipes(limit, db)
    result = [recipe_to_card(r) for r in recipes]

    # ── Кешируем на 10 минут ───────────────────────────────────
    await cache_set(cache_key, result, ttl=600)

    return result


@router.get("/search", response_model=list[dict])
async def search_recipes(
    q: str = Query(..., min_length=1),
    mode: str = Query(default="title"),
    db: AsyncSession = Depends(get_db),
):
    # ── Поиск кешируем на 2 минуты ────────────────────────────
    cache_key = f"recipes:search:{mode}:{q}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    from app.services.recipe import search_by_title, search_by_ingredients

    if mode == "ingredients":
        ingredients = [i.strip() for i in q.split(",") if i.strip()]
        if not ingredients:
            return []
        rows = await search_by_ingredients(ingredients, db)
        result = []
        for recipe, matches, total in rows:
            r = recipe_to_card(recipe)
            r["match_count"] = matches
            r["total_ingredients"] = total
            r["match_percent"] = round(matches * 100 / total) if total else 0
            result.append(r)
    else:
        recipes = await search_by_title(q, db)
        result = [recipe_to_card(r) for r in recipes]

    await cache_set(cache_key, result, ttl=120)
    return result


@router.get("/{recipe_id}", response_model=RecipeDetailSchema)
async def get_recipe(
    recipe_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    # ── Отдельный рецепт кешируем на 30 минут ─────────────────
    cache_key = f"recipes:detail:{recipe_id}"
    cached = await cache_get(cache_key)
    if cached:
        from app.schemas.recipe import RecipeDetailSchema as RDS
        return RDS(**cached)

    recipe = await get_recipe_by_id(recipe_id, db)

    # Кешируем сериализованную версию
    await cache_set(
        cache_key,
        RecipeDetailSchema.model_validate(recipe).model_dump(mode="json"),
        ttl=1800
    )

    return recipe


@router.post("/suggest", status_code=201)
async def suggest_recipe(
    data: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.recipe import RecipeStatus
    from app.schemas.recipe import RecipeCreate as RC
    data_dict = data.model_dump()
    data_dict["status"] = "suggested"
    if not data_dict.get("author_credit"):
        data_dict["author_credit"] = current_user.email

    result = await create_recipe(RC(**data_dict), db)

    # ── Инвалидируем кеш списков после добавления рецепта ─────
    await cache_invalidate("recipes:list:")
    await cache_invalidate("recipes:popular:")

    return result