import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
from app.models.user import User
from sqlalchemy import select, func, cast, Date
from app.core.redis import get_redis
from app.db.session import get_db
from app.core.dependencies import get_current_superuser
from app.models.user import User
from app.schemas.recipe import (
    RecipeAdminSchema, RecipeCreate, RecipeUpdate,
    RecipeCardSchema
)
from app.services.recipe import (
    get_all_recipes_admin, get_recipe_admin,
    create_recipe, update_recipe, delete_recipe,
    publish_recipe, unpublish_recipe,
)

router = APIRouter()


@router.get("/recipes", response_model=dict)
async def admin_list_recipes(
    search: str | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    recipes, total = await get_all_recipes_admin(
        db, search=search, category=category,
        status=status, page=page, page_size=page_size,
    )
    return {
        "items": [RecipeCardSchema.model_validate(r) for r in recipes],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@router.post("/recipes", response_model=RecipeAdminSchema, status_code=201)
async def admin_create_recipe(
    data: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await create_recipe(data, db)


@router.get("/recipes/{recipe_id}", response_model=RecipeAdminSchema)
async def admin_get_recipe(
    recipe_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await get_recipe_admin(recipe_id, db)


@router.put("/recipes/{recipe_id}", response_model=RecipeAdminSchema)
async def admin_update_recipe(
    recipe_id: uuid.UUID,
    data: RecipeUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await update_recipe(recipe_id, data, db)


@router.delete("/recipes/{recipe_id}", status_code=204)
async def admin_delete_recipe(
    recipe_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    await delete_recipe(recipe_id, db)


@router.post("/recipes/{recipe_id}/publish", response_model=RecipeAdminSchema)
async def admin_publish_recipe(
    recipe_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await publish_recipe(recipe_id, db)


@router.post("/recipes/{recipe_id}/unpublish", response_model=RecipeAdminSchema)
async def admin_unpublish_recipe(
    recipe_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await unpublish_recipe(recipe_id, db)

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    now = datetime.now(timezone.utc)
    today = now.date()

    # Всего пользователей
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()

    # Зарегалось сегодня
    today_users = (await db.execute(
        select(func.count()).select_from(User)
        .where(cast(User.created_at, Date) == today)
    )).scalar_one()

    # Premium пользователей
    premium_users = (await db.execute(
        select(func.count()).select_from(User).where(User.is_premium == True)
    )).scalar_one()

    # Всего рецептов по статусам
    from app.models.recipe import Recipe, RecipeStatus
    published = (await db.execute(
        select(func.count()).select_from(Recipe)
        .where(Recipe.status == RecipeStatus.published)
    )).scalar_one()
    draft = (await db.execute(
        select(func.count()).select_from(Recipe)
        .where(Recipe.status == RecipeStatus.draft)
    )).scalar_one()
    suggested = (await db.execute(
        select(func.count()).select_from(Recipe)
        .where(Recipe.status == "suggested")
    )).scalar_one()

    # Запросы в секунду из Redis
    redis = await get_redis()
    rps = 0
    if redis:
        current = await redis.get("rps:current")
        rps = float(current) if current else 0

    return {
        "total_users": total_users,
        "today_users": today_users,
        "premium_users": premium_users,
        "published_recipes": published,
        "draft_recipes": draft,
        "suggested_recipes": suggested,
        "rps": rps,
    }