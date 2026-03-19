import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Float, Boolean,
    DateTime, Enum, ForeignKey, func, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
import enum
from app.db.session import Base
from app.models.base import TimestampMixin


class RecipeCategory(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"
    dessert = "dessert"
    soup = "soup"
    salad = "salad"
    smoothie = "smoothie"


class RecipeStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"
    suggested = "suggested"


class Recipe(Base, TimestampMixin):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    external_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[RecipeCategory] = mapped_column(
        Enum(RecipeCategory), nullable=False, index=True
    )
    calories: Mapped[float | None] = mapped_column(Float, index=True)
    protein: Mapped[float | None] = mapped_column(Float, index=True)
    fat: Mapped[float | None] = mapped_column(Float)
    carbs: Mapped[float | None] = mapped_column(Float)
    cook_time_minutes: Mapped[int | None] = mapped_column(Integer)
    servings: Mapped[int | None] = mapped_column(Integer)
    benefit: Mapped[str | None] = mapped_column(Text)
    nutritionist_tips: Mapped[str | None] = mapped_column(Text)
    vitamins: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[RecipeStatus] = mapped_column(
        Enum(RecipeStatus), default=RecipeStatus.draft, index=True
    )
    author_credit: Mapped[str | None] = mapped_column(String(255))
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR)

    # Связи
    steps: Mapped[list["RecipeStep"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan",
        order_by="RecipeStep.step_number"
    )
    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )
    tags: Mapped[list["RecipeTag"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )
    favorites: Mapped[list["Favorite"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_recipes_status_category", "status", "category"),
        Index("ix_recipes_status_calories", "status", "calories"),
        Index("ix_recipes_search_vector", "search_vector", postgresql_using="gin"),
    )


class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))

    recipe: Mapped["Recipe"] = relationship(back_populates="steps")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[str | None] = mapped_column(String(100))
    name_normalized: Mapped[str | None] = mapped_column(String(255), index=True)

    recipe: Mapped["Recipe"] = relationship(back_populates="ingredients")


class RecipeTag(Base):
    __tablename__ = "recipe_tags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    recipe: Mapped["Recipe"] = relationship(back_populates="tags")


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="favorites")
    recipe: Mapped["Recipe"] = relationship(back_populates="favorites")

class PartnerProduct(Base, TimestampMixin):
    __tablename__ = "partner_products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # Ключевые слова через запятую: "молоко, молоко коровье, цельное молоко"
    keywords: Mapped[str] = mapped_column(Text, nullable=False)
    # Название товара для показа
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Партнёрская ссылка
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    # Лого/иконка магазина (ozon, wildberries, admitad и т.д.)
    store_name: Mapped[str | None] = mapped_column(String(100))
    store_logo_url: Mapped[str | None] = mapped_column(String(500))
    # Активна ли
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Тип: ingredient (на ингредиент) | kitchen (товар для кухни)
    product_type: Mapped[str] = mapped_column(String(50), default="ingredient")