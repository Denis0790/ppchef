import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.favorite import FavoriteSchema
from app.services.favorite import get_favorites, add_favorite, remove_favorite

router = APIRouter()


@router.get("", response_model=list[FavoriteSchema])
async def list_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_favorites(current_user, db)


@router.post("/{recipe_id}", response_model=FavoriteSchema, status_code=201)
async def add_to_favorites(
    recipe_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await add_favorite(recipe_id, current_user, db)


@router.delete("/{recipe_id}", status_code=204)
async def remove_from_favorites(
    recipe_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await remove_favorite(recipe_id, current_user, db)