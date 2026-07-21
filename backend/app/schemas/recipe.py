import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.recipe import RecipeCategory, RecipeStatus


class RecipeStepSchema(BaseModel):
    id: uuid.UUID
    step_number: int
    text: str
    image_url: str | None

    model_config = {"from_attributes": True}


class RecipeIngredientSchema(BaseModel):
    id: uuid.UUID
    name: str
    amount: str | None

    model_config = {"from_attributes": True}


class RecipeTagSchema(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class RecipeCardSchema(BaseModel):
    """Для карточки в ленте — без шагов и ингредиентов."""
    id: uuid.UUID
    title: str
    category: RecipeCategory
    calories: float | None
    protein: float | None
    fat: float | None
    carbs: float | None
    cook_time_minutes: int | None
    servings: int | None
    image_url: str | None
    author_credit: str | None
    created_at: datetime
    ingredient_names: list[str] = []

    model_config = {"from_attributes": True}


class RecipeDetailSchema(RecipeCardSchema):
    """Для детальной страницы — полные данные."""
    benefit: str | None
    nutritionist_tips: str | None
    vitamins: str | None
    steps: list[RecipeStepSchema] = []
    ingredients: list[RecipeIngredientSchema] = []
    tags: list[RecipeTagSchema] = []


class RecipeFilterParams(BaseModel):
    category: RecipeCategory | None = None
    calories_min: float | None = None
    calories_max: float | None = None
    protein_min: float | None = None
    cook_time_max: int | None = None
    search: str | None = None
    page: int = 1
    page_size: int = 20

class RecipeStepCreate(BaseModel):
    step_number: int
    text: str
    image_url: str | None = None

class RecipeIngredientCreate(BaseModel):
    name: str
    amount: str | None = None

class RecipeCreate(BaseModel):
    title: str
    category: RecipeCategory
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    cook_time_minutes: int | None = None
    servings: int | None = None
    benefit: str | None = None
    nutritionist_tips: str | None = None
    vitamins: str | None = None
    image_url: str | None = None
    author_credit: str | None = None
    status: RecipeStatus = RecipeStatus.draft
    tags: list[str] = []
    ingredients: list[RecipeIngredientCreate] = []
    steps: list[RecipeStepCreate] = []

class RecipeUpdate(RecipeCreate):
    title: str | None = None
    category: RecipeCategory | None = None

class RecipeAdminSchema(RecipeDetailSchema):
    status: RecipeStatus
    is_published: bool
    external_id: str | None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}