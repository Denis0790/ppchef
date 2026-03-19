import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user

from app.db.session import get_db
from app.schemas.recipe import (
    RecipeCardSchema, RecipeDetailSchema,
    RecipeFilterParams, RecipeCategory, RecipeCreate
)
from app.services.recipe import get_recipes, get_recipe_by_id, get_popular_recipes, create_recipe
from app.models.recipe import Recipe
from app.models.user import User
from app.core.dependencies import get_current_user

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

    return {
        "items": [recipe_to_card(r) for r in recipes],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@router.get("/popular", response_model=list[dict])
async def popular_recipes(
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    recipes = await get_popular_recipes(limit, db)
    return [recipe_to_card(r) for r in recipes]


@router.get("/search", response_model=list[dict])
async def search_recipes(
    q: str = Query(..., min_length=1),
    mode: str = Query(default="title"),
    db: AsyncSession = Depends(get_db),
):
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
        return result
    else:
        recipes = await search_by_title(q, db)
        return [recipe_to_card(r) for r in recipes]


@router.get("/{recipe_id}", response_model=RecipeDetailSchema)
async def get_recipe(
    recipe_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    recipe = await get_recipe_by_id(recipe_id, db)
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
    # Если автор не указан — сохраняем email как внутреннюю метку
    if not data_dict.get("author_credit"):
        data_dict["author_credit"] = current_user.email
    return await create_recipe(RC(**data_dict), db)