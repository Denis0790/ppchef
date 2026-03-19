import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

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