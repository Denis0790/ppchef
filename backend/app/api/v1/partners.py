import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.recipe import PartnerProduct
from app.core.dependencies import get_current_superuser
from app.models.user import User

router = APIRouter()


class PartnerProductOut(BaseModel):
    id: uuid.UUID
    title: str
    url: str
    store_name: str | None
    store_logo_url: str | None
    product_type: str

    model_config = {"from_attributes": True}


class PartnerProductCreate(BaseModel):
    keywords: str
    title: str
    url: str
    store_name: str | None = None
    store_logo_url: str | None = None
    product_type: str = "ingredient"
    is_active: bool = True


@router.get("/match")
async def match_ingredients(
    ingredients: str,  # через запятую
    db: AsyncSession = Depends(get_db),
):
    """Матчим ингредиенты рецепта с партнёрскими продуктами."""
    ing_list = [i.strip().lower() for i in ingredients.split(",") if i.strip()]
    if not ing_list:
        return []

    result = await db.execute(
        select(PartnerProduct).where(PartnerProduct.is_active == True)
    )
    all_products = result.scalars().all()

    matches = []
    matched_ingredient_indices = set()

    for product in all_products:
        keywords = [k.strip().lower() for k in product.keywords.split(",") if k.strip()]
        for idx, ing in enumerate(ing_list):
            if idx in matched_ingredient_indices:
                continue
            if any(kw in ing or ing in kw for kw in keywords):
                matches.append({
                    "ingredient": ing,
                    "ingredient_index": idx,
                    "product": PartnerProductOut.model_validate(product).model_dump(),
                })
                matched_ingredient_indices.add(idx)
                break

    return matches


@router.get("/kitchen")
async def kitchen_products(db: AsyncSession = Depends(get_db)):
    """Товары для кухни."""
    result = await db.execute(
        select(PartnerProduct).where(
            PartnerProduct.is_active == True,
            PartnerProduct.product_type == "kitchen"
        )
    )
    return [PartnerProductOut.model_validate(p) for p in result.scalars().all()]


# Админские эндпоинты
@router.get("/admin/list")
async def admin_list(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    result = await db.execute(select(PartnerProduct))
    return result.scalars().all()


@router.post("/admin/create", status_code=201)
async def admin_create(
    data: PartnerProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    product = PartnerProduct(**data.model_dump())
    db.add(product)
    await db.commit()
    return {"status": "ok"}


@router.delete("/admin/{product_id}", status_code=204)
async def admin_delete(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    result = await db.execute(select(PartnerProduct).where(PartnerProduct.id == product_id))
    product = result.scalar_one_or_none()
    if product:
        await db.delete(product)
        await db.commit()