import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.recipe import Favorite, Recipe, RecipeStatus
from app.models.user import User


async def get_favorites(
    user: User,
    db: AsyncSession,
) -> list[Favorite]:
    query = (
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .options(selectinload(Favorite.recipe))
        .order_by(Favorite.created_at.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def add_favorite(
    recipe_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Favorite:
    # Проверяем что рецепт существует
    recipe_result = await db.execute(
        select(Recipe).where(
            and_(
                Recipe.id == recipe_id,
                Recipe.status == RecipeStatus.published,
            )
        )
    )
    if not recipe_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Рецепт не найден",
        )

    # Проверяем что ещё не в избранном
    existing = await db.execute(
        select(Favorite).where(
            and_(
                Favorite.user_id == user.id,
                Favorite.recipe_id == recipe_id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Рецепт уже в избранном",
        )

    favorite = Favorite(user_id=user.id, recipe_id=recipe_id)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite, ["recipe"])
    return favorite


async def remove_favorite(
    recipe_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Favorite).where(
            and_(
                Favorite.user_id == user.id,
                Favorite.recipe_id == recipe_id,
            )
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Рецепт не найден в избранном",
        )
    await db.delete(favorite)
    await db.commit()