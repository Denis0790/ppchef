import asyncio
import logging
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select

from app.tasks.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.recipe import Recipe, RecipeIngredient, RecipeStep, RecipeTag

logger = logging.getLogger(__name__)

BASE_URL = "https://fitstars.ru"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
}

CATEGORY_MAP = {
    "завтрак": "breakfast",
    "обед": "lunch",
    "ужин": "dinner",
    "перекус": "snack",
    "десерт": "dessert",
    "суп": "soup",
    "салат": "salad",
    "смузи": "smoothie",
    "напиток": "smoothie",
}

SMOOTHIE_KEYWORDS = ["smuzi", "smoothie", "napitok", "kokteyl"]
DESSERT_KEYWORDS = ["desert", "dessert", "vypechka", "tort", "pechene"]
SNACK_KEYWORDS = ["perekus", "snack", "baton"]


def detect_category(title: str, url: str) -> str:
    text = (title + " " + url).lower()
    for ru, en in CATEGORY_MAP.items():
        if ru in text:
            return en
    return "lunch"


def is_light_category(url: str) -> bool:
    """Смузи, десерты, перекусы — без жёсткого фильтра"""
    url_lower = url.lower()
    return any(kw in url_lower for kw in SMOOTHIE_KEYWORDS + DESSERT_KEYWORDS + SNACK_KEYWORDS)


def parse_number(text: str) -> Optional[float]:
    if not text:
        return None
    text = text.strip().replace(",", ".")
    m = re.search(r"[\d.]+", text)
    return float(m.group()) if m else None


def parse_time(text: str) -> Optional[int]:
    if not text:
        return None
    hours = re.search(r"(\d+)\s*ч", text)
    mins = re.search(r"(\d+)\s*мин", text)
    total = 0
    if hours:
        total += int(hours.group(1)) * 60
    if mins:
        total += int(mins.group(1))
    return total if total > 0 else None


def get_kbju(soup) -> tuple:
    def extract(testid):
        el = soup.select_one(f'[data-testid="{testid}"] p.about-recipe__stats-num')
        if not el:
            # fallback — ищем по тексту лейбла
            for item in soup.select("div.about-recipe__stats-item"):
                label = item.select_one("p.about-recipe__stats-text")
                num = item.select_one("p.about-recipe__stats-num")
                if label and num:
                    label_text = label.get_text(strip=True).lower()
                    if testid == "recipe-nutrition-stat-ccal" and "ккал" in label_text:
                        return parse_number(num.get_text(strip=True))
                    if testid == "recipe-nutrition-stat-protein" and "белк" in label_text:
                        return parse_number(num.get_text(strip=True))
                    if testid == "recipe-nutrition-stat-fat" and "жир" in label_text:
                        return parse_number(num.get_text(strip=True))
                    if testid == "recipe-nutrition-stat-carbon" and "углевод" in label_text:
                        return parse_number(num.get_text(strip=True))
            return None
        return parse_number(el.get_text(strip=True))

    return (
        extract("recipe-nutrition-stat-protein"),
        extract("recipe-nutrition-stat-fat"),
        extract("recipe-nutrition-stat-carbon"),
        extract("recipe-nutrition-stat-ccal"),
    )


async def fetch_recipe_urls_fitstars(path: str, pages: int = 5) -> list[str]:
    urls = []
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        for page in range(1, pages + 1):
            url = f"{BASE_URL}{path}?page={page}"
            try:
                resp = await client.get(url)
                if resp.status_code == 404:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select("a[href*='/recipes/']")
                for link in links:
                    href = link.get("href", "")
                    if re.search(r"/recipes/[a-z0-9\-]+/?$", href):
                        full = BASE_URL + href if href.startswith("/") else href
                        if full not in urls:
                            urls.append(full)
                logger.info(f"Страница {page}: найдено {len(urls)} URL всего")
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Ошибка страница {page}: {e}")
    return urls


async def parse_recipe_fitstars(url: str, light: bool = False) -> Optional[dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.text, "html.parser")

            # Название
            title_el = soup.find("h1") or soup.select_one('[data-testid="feature-product-page-banner-title"]')
            if not title_el:
                return None
            title = title_el.get_text(strip=True)[:200]

            # КБЖУ — берём "на 100 грамм" (активный таб по умолчанию)
            protein, fat, carbs, calories = get_kbju(soup)

            # Фильтр
            is_light = light or is_light_category(url)

            if not is_light:
                if protein is None or fat is None or carbs is None:
                    return None
                if protein < fat or protein < carbs:
                    return None
                if calories and calories > 700:
                    return None

            # Ингредиенты — формат "Название - количество"
            ingredients = []
            for item in soup.select("li.about-recipe__item"):
                text = item.get_text(strip=True)
                if " - " in text:
                    parts = text.split(" - ", 1)
                    name = parts[0].strip()
                    amount = parts[1].strip()
                elif " — " in text:
                    parts = text.split(" — ", 1)
                    name = parts[0].strip()
                    amount = parts[1].strip()
                else:
                    name = text
                    amount = None
                if name:
                    ingredients.append({"name": name[:200], "amount": amount})

            # Шаги
            steps = []
            for i, step in enumerate(soup.select("div.recipe-steps__action"), 1):
                text_el = step.select_one("div.recipe-steps__text")
                if text_el:
                    text = text_el.get_text(strip=True)
                    if text:
                        steps.append({"step_number": i, "text": text, "image_url": None})

            if not steps or not ingredients:
                return None

            # Время
            cook_time = None
            time_el = soup.find(string=re.compile(r"\d+\s*(мин|ч)", re.I))
            if time_el:
                cook_time = parse_time(time_el.strip())

            # Категория
            category = detect_category(title, url)
            if is_light and category == "lunch":
                if any(kw in url.lower() for kw in SMOOTHIE_KEYWORDS):
                    category = "smoothie"
                elif any(kw in url.lower() for kw in DESSERT_KEYWORDS):
                    category = "dessert"
                elif any(kw in url.lower() for kw in SNACK_KEYWORDS):
                    category = "snack"

            return {
                "title": title,
                "category": category,
                "calories": calories,
                "protein": protein,
                "fat": fat,
                "carbs": carbs,
                "cook_time_minutes": cook_time,
                "servings": None,
                "image_url": None,
                "author_credit": "fitstars.ru",
                "external_id": url,
                "tags": [],
                "ingredients": ingredients,
                "steps": steps,
            }

        except Exception as e:
            logger.error(f"Ошибка парсинга {url}: {e}")
            return None


async def save_recipe(data: dict) -> bool:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(
            select(Recipe).where(Recipe.external_id == data["external_id"])
        )
        if existing.scalar_one_or_none():
            return False

        recipe = Recipe(
            title=data["title"],
            category=data["category"],
            calories=data["calories"],
            protein=data["protein"],
            fat=data["fat"],
            carbs=data["carbs"],
            cook_time_minutes=data["cook_time_minutes"],
            servings=data["servings"],
            image_url=data["image_url"],
            author_credit=data["author_credit"],
            external_id=data["external_id"],
            status="draft",
            is_published=False,
        )
        db.add(recipe)
        await db.flush()

        for ing in data["ingredients"]:
            db.add(RecipeIngredient(
                recipe_id=recipe.id,
                name=ing["name"],
                amount=ing["amount"],
            ))

        for step in data["steps"]:
            db.add(RecipeStep(
                recipe_id=recipe.id,
                step_number=step["step_number"],
                text=step["text"],
                image_url=None,
            ))

        await db.commit()
        return True


@celery_app.task(name="import_recipes_from_fitstars")
def import_recipes_from_fitstars(path: str = "/recipes", pages: int = 5, light: bool = False):
    """Парсит рецепты с fitstars.ru"""
    async def _run():
        logger.info(f"Парсим fitstars.ru{path}, страниц: {pages}, light: {light}")
        urls = await fetch_recipe_urls_fitstars(path, pages)
        logger.info(f"Найдено URL: {len(urls)}")

        saved = 0
        skipped = 0
        for url in urls:
            data = await parse_recipe_fitstars(url, light=light)
            if data is None:
                skipped += 1
                continue
            result = await save_recipe(data)
            if result:
                saved += 1
                logger.info(f"✅ {data['title']}")
            else:
                skipped += 1
            await asyncio.sleep(1.5)

        logger.info(f"Готово. Сохранено: {saved}, пропущено: {skipped}")
        return {"saved": saved, "skipped": skipped}

    return asyncio.run(_run())