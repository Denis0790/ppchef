import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
import json
import hashlib
from app.core.redis import get_redis

from app.models.recipe import RecipeStep, RecipeIngredient, RecipeTag
from app.schemas.recipe import RecipeCreate, RecipeUpdate
from app.models.recipe import Recipe, RecipeStatus
from app.schemas.recipe import RecipeFilterParams

CACHE_RECIPES_TTL = 300
CACHE_POPULAR_TTL = 600


def _recipes_cache_key(filters: RecipeFilterParams) -> str:
    return f"recipes:{filters.category}:{filters.page}:{filters.page_size}:{filters.search}"


async def _invalidate_recipe_cache(recipe_id: uuid.UUID | None = None):
    redis = await get_redis()
    if not redis:
        return
    if recipe_id:
        await redis.delete(f"recipe:{recipe_id}")
    keys = await redis.keys("recipes:*")
    if keys:
        await redis.delete(*keys)
    keys2 = await redis.keys("popular_recipes:*")
    if keys2:
        await redis.delete(*keys2)


async def get_recipes(
    filters: RecipeFilterParams,
    db: AsyncSession,
) -> tuple[list[Recipe], int]:
    cache_key = _recipes_cache_key(filters)
    redis = await get_redis()

    if redis:
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            recipe_ids = data["items"]  # список строк uuid
            result = await db.execute(
                select(Recipe)
                .where(Recipe.id.in_(recipe_ids))
                .options(selectinload(Recipe.ingredients))
            )
            recipes_by_id = {str(r.id): r for r in result.scalars().all()}
            recipes = [recipes_by_id[rid] for rid in recipe_ids if rid in recipes_by_id]
            return recipes, data["total"]

    query = select(Recipe).where(Recipe.status == RecipeStatus.published)

    if filters.category:
        query = query.where(Recipe.category == filters.category)
    if filters.calories_min is not None:
        query = query.where(Recipe.calories >= filters.calories_min)
    if filters.calories_max is not None:
        query = query.where(Recipe.calories <= filters.calories_max)
    if filters.protein_min is not None:
        query = query.where(Recipe.protein >= filters.protein_min)
    if filters.cook_time_max is not None:
        query = query.where(Recipe.cook_time_minutes <= filters.cook_time_max)
    if filters.search:
        query = query.where(Recipe.title.ilike(f"%{filters.search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.options(selectinload(Recipe.ingredients))
    offset = (filters.page - 1) * filters.page_size
    query = query.order_by(Recipe.created_at.desc()).offset(offset).limit(filters.page_size)

    result = await db.execute(query)
    recipes = list(result.scalars().all())

    if redis:
        cache_data = {
            "total": total,
            "items": [str(r.id) for r in recipes],
        }
        await redis.setex(cache_key, CACHE_RECIPES_TTL, json.dumps(cache_data))

    return recipes, total


async def get_recipe_by_id(
    recipe_id: uuid.UUID,
    db: AsyncSession,
) -> Recipe:
    query = (
        select(Recipe)
        .where(and_(
            Recipe.id == recipe_id,
            Recipe.status == RecipeStatus.published,
        ))
        .options(
            selectinload(Recipe.steps),
            selectinload(Recipe.ingredients),
            selectinload(Recipe.tags),
        )
    )
    result = await db.execute(query)
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рецепт не найден")
    return recipe


async def get_popular_recipes(
    limit: int,
    db: AsyncSession,
) -> list[Recipe]:
    cache_key = f"popular_recipes:{limit}"
    redis = await get_redis()

    if redis:
        cached = await redis.get(cache_key)
        if cached:
            recipe_ids = json.loads(cached)
            result = await db.execute(
                select(Recipe)
                .where(Recipe.id.in_(recipe_ids))
                .options(selectinload(Recipe.ingredients))
            )
            recipes_by_id = {str(r.id): r for r in result.scalars().all()}
            return [recipes_by_id[rid] for rid in recipe_ids if rid in recipes_by_id]

    query = (
        select(Recipe)
        .where(Recipe.status == RecipeStatus.published)
        .options(selectinload(Recipe.ingredients))
        .order_by(func.random())
        .limit(limit)
    )
    result = await db.execute(query)
    recipes = list(result.scalars().all())

    if redis and recipes:
        await redis.setex(cache_key, CACHE_POPULAR_TTL, json.dumps([str(r.id) for r in recipes]))

    return recipes


async def get_all_recipes_admin(
    db: AsyncSession,
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Recipe], int]:
    query = select(Recipe)
    if search:
        query = query.where(Recipe.title.ilike(f"%{search}%"))
    if category:
        query = query.where(Recipe.category == category)
    if status:
        query = query.where(Recipe.status == status)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    query = query.order_by(Recipe.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_recipe_admin(recipe_id: uuid.UUID, db: AsyncSession) -> Recipe:
    query = (
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(
            selectinload(Recipe.steps),
            selectinload(Recipe.ingredients),
            selectinload(Recipe.tags),
        )
    )
    result = await db.execute(query)
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    return recipe


async def create_recipe(data: RecipeCreate, db: AsyncSession) -> Recipe:
    recipe = Recipe(
        title=data.title,
        category=data.category,
        calories=data.calories,
        protein=data.protein,
        fat=data.fat,
        carbs=data.carbs,
        cook_time_minutes=data.cook_time_minutes,
        servings=data.servings,
        benefit=data.benefit,
        nutritionist_tips=data.nutritionist_tips,
        vitamins=data.vitamins,
        image_url=data.image_url,
        author_credit=data.author_credit,
        status=data.status,
        is_published=data.status == RecipeStatus.published,
    )
    db.add(recipe)
    await db.flush()

    for ing in data.ingredients:
        db.add(RecipeIngredient(recipe_id=recipe.id, name=ing.name, amount=ing.amount))
    for step in data.steps:
        db.add(RecipeStep(recipe_id=recipe.id, step_number=step.step_number, text=step.text, image_url=step.image_url))
    for tag_name in data.tags:
        db.add(RecipeTag(recipe_id=recipe.id, name=tag_name.strip()))

    await db.commit()
    await _invalidate_recipe_cache()
    return await get_recipe_admin(recipe.id, db)


async def update_recipe(recipe_id: uuid.UUID, data: RecipeUpdate, db: AsyncSession) -> Recipe:
    recipe = await get_recipe_admin(recipe_id, db)
    update_fields = data.model_dump(exclude_unset=True, exclude={"tags", "ingredients", "steps"})
    for field, value in update_fields.items():
        setattr(recipe, field, value)
    if data.status:
        recipe.is_published = data.status == RecipeStatus.published

    if data.ingredients is not None:
        await db.execute(__import__("sqlalchemy", fromlist=["delete"]).delete(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id))
        for ing in data.ingredients:
            db.add(RecipeIngredient(recipe_id=recipe_id, name=ing.name, amount=ing.amount))

    if data.steps is not None:
        await db.execute(__import__("sqlalchemy", fromlist=["delete"]).delete(RecipeStep).where(RecipeStep.recipe_id == recipe_id))
        for step in data.steps:
            db.add(RecipeStep(recipe_id=recipe_id, step_number=step.step_number, text=step.text, image_url=step.image_url))

    if data.tags is not None:
        await db.execute(__import__("sqlalchemy", fromlist=["delete"]).delete(RecipeTag).where(RecipeTag.recipe_id == recipe_id))
        for tag_name in data.tags:
            db.add(RecipeTag(recipe_id=recipe_id, name=tag_name.strip()))

    await db.commit()
    await _invalidate_recipe_cache(recipe_id)
    return await get_recipe_admin(recipe_id, db)


async def delete_recipe(recipe_id: uuid.UUID, db: AsyncSession) -> None:
    recipe = await get_recipe_admin(recipe_id, db)
    await db.delete(recipe)
    await db.commit()
    await _invalidate_recipe_cache(recipe_id)


async def publish_recipe(recipe_id: uuid.UUID, db: AsyncSession) -> Recipe:
    recipe = await get_recipe_admin(recipe_id, db)
    recipe.status = RecipeStatus.published
    recipe.is_published = True
    await db.commit()
    await _invalidate_recipe_cache(recipe_id)
    return await get_recipe_admin(recipe_id, db)


async def unpublish_recipe(recipe_id: uuid.UUID, db: AsyncSession) -> Recipe:
    recipe = await get_recipe_admin(recipe_id, db)
    recipe.status = RecipeStatus.draft
    recipe.is_published = False
    await db.commit()
    await _invalidate_recipe_cache(recipe_id)
    return await get_recipe_admin(recipe_id, db)


async def search_by_title(
    query: str,
    db: AsyncSession,
    limit: int = 20,
) -> list[Recipe]:
    cache_key = f"search_title:{hashlib.md5(query.lower().encode()).hexdigest()}"
    redis = await get_redis()

    if redis:
        cached = await redis.get(cache_key)
        if cached:
            recipe_ids = json.loads(cached)
            result = await db.execute(
                select(Recipe)
                .where(Recipe.id.in_(recipe_ids))
                .options(selectinload(Recipe.ingredients))
            )
            recipes_by_id = {str(r.id): r for r in result.scalars().all()}
            return [recipes_by_id[rid] for rid in recipe_ids if rid in recipes_by_id]

    result = await db.execute(
        select(Recipe)
        .where(and_(
            Recipe.status == RecipeStatus.published,
            Recipe.title.ilike(f"%{query}%"),
        ))
        .options(selectinload(Recipe.ingredients))
        .order_by(Recipe.created_at.desc())
        .limit(limit)
    )
    recipes = list(result.scalars().all())

    if redis and recipes:
        await redis.setex(cache_key, 600, json.dumps([str(r.id) for r in recipes]))

    return recipes


async def search_by_ingredients(
    ingredients: list[str],
    db: AsyncSession,
    limit: int = 5,
) -> list[tuple[Recipe, int, int]]:
    cache_key = "fridge:" + hashlib.md5(",".join(sorted(ingredients)).encode()).hexdigest()
    redis = await get_redis()

    if redis:
        cached = await redis.get(cache_key)
        if cached:
            cached_data = json.loads(cached)
            recipe_ids = [d["id"] for d in cached_data]
            result = await db.execute(
                select(Recipe)
                .where(Recipe.id.in_(recipe_ids))
                .options(selectinload(Recipe.ingredients))
            )
            recipes_by_id = {str(r.id): r for r in result.scalars().all()}
            return [
                (recipes_by_id[d["id"]], d["matches"], d["total"])
                for d in cached_data
                if d["id"] in recipes_by_id
            ]

    conditions = []
    for ing in ingredients:
        ing_lower = ing.lower().strip()
        conditions.append(or_(
            RecipeIngredient.name_normalized.ilike(f"%{ing_lower}%"),
            RecipeIngredient.name.ilike(f"%{ing_lower}%"),
        ))

    match_subq = (
        select(RecipeIngredient.recipe_id, func.count(RecipeIngredient.id).label("matches"))
        .where(or_(*conditions))
        .group_by(RecipeIngredient.recipe_id)
        .subquery()
    )
    total_subq = (
        select(RecipeIngredient.recipe_id, func.count(RecipeIngredient.id).label("total"))
        .group_by(RecipeIngredient.recipe_id)
        .subquery()
    )

    result = await db.execute(
        select(Recipe, match_subq.c.matches, total_subq.c.total)
        .join(match_subq, Recipe.id == match_subq.c.recipe_id)
        .join(total_subq, Recipe.id == total_subq.c.recipe_id)
        .where(Recipe.status == RecipeStatus.published)
        .options(selectinload(Recipe.ingredients))
        .order_by(
            (match_subq.c.matches * 100 / total_subq.c.total).desc(),
            match_subq.c.matches.desc(),
        )
        .limit(limit)
    )
    rows = result.all()

    if redis and rows:
        cache_data = [{"id": str(r[0].id), "matches": r[1], "total": r[2]} for r in rows]
        await redis.setex(cache_key, 600, json.dumps(cache_data))

    return [(row[0], row[1], row[2]) for row in rows]