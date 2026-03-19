import uuid
from datetime import datetime
from pydantic import BaseModel
from app.schemas.recipe import RecipeCardSchema


class FavoriteSchema(BaseModel):
    id: uuid.UUID
    recipe_id: uuid.UUID
    created_at: datetime
    recipe: RecipeCardSchema

    model_config = {"from_attributes": True}