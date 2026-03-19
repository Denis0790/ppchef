import asyncio
import logging
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select

from app.tasks.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.recipe import Recipe, RecipeIngredient, RecipeStep

logger = logging.getLogger(__name__)

BASE_URL = "https://1000.menu"
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
    "выпечка": "dessert",
    "вафли": "breakfast",
    "блины": "breakfast",
    "панкейки": "breakfast",
}

LIGHT_KEYWORDS = ["smuz", "smoothie", "desert", "dessert", "perekus", "vypechka", "vafli", "bliny"]


def detect_category(title: str, url: str) -> str:
    text = (title + " " + url).lower()
    for ru, en in CATEGORY_MAP.items():
        if ru in text:
            return en
    return "lunch"


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
    protein = parse_number(soup.select_one("#nutr_p") and soup.select_one("#nutr_p").get_text(strip=True) or "")
    fat = parse_number(soup.select_one("#nutr_f") and soup.select_one("#nutr_f").get_text(strip=True) or "")
    carbs = parse_number(soup.select_one("#nutr_c") and soup.select_one("#nutr_c").get_text(strip=True) or "")
    calories = parse_number(soup.select_one("#nutr_kcal") and soup.select_one("#nutr_kcal").get_text(strip=True) or "")
    return protein, fat, carbs, calories


async def fetch_recipe_urls(catalog_path: str, pages: int = 10) -> list[str]:
    urls = []
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        for page in range(1, pages + 1):
            url = f"{BASE_URL}{catalog_path}/{page}" if page > 1 else f"{BASE_URL}{catalog_path}"
            try:
                resp = await client.get(url)
                if resp.status_code == 404:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select("a[href*='/cooking/']")
                for link in links:
                    href = link.get("href", "")
                    if re.match(r"^/cooking/[\w\-]+$", href):
                        full = BASE_URL + href
                        if full not in urls:
                            urls.append(full)
                logger.info(f"Страница {page}: найдено {len(urls)} URL всего")
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Ошибка страница {page}: {e}")
    return urls


async def parse_recipe(url: str, light: bool = False) -> Optional[dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.text, "html.parser")

            # Название
            title_el = soup.find("h1", itemprop="name")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)[:200]

            # КБЖУ — на 100г (активный по умолчанию)
            protein, fat, carbs, calories = get_kbju(soup)

            # Фильтр
            is_light = light or any(kw in url.lower() for kw in LIGHT_KEYWORDS)

            if not is_light:
                if protein is None or fat is None or carbs is None:
                    return None
                if protein < fat or protein < carbs:
                    return None
                if calories and calories > 700:
                    return None

            # Время
            time_el = soup.select_one("meta[itemprop='totalTime']")
            cook_time = None
            if time_el:
                content = time_el.get("content", "")
                # PT1H30M формат
                h = re.search(r"(\d+)H", content)
                m = re.search(r"(\d+)M", content)
                total = 0
                if h:
                    total += int(h.group(1)) * 60
                if m:
                    total += int(m.group(1))
                cook_time = total if total > 0 else None

            # Порции
            servings = None
            serv_el = soup.select_one("meta[itemprop='recipeYield']")
            if serv_el:
                m = re.search(r"\d+", serv_el.get("content", ""))
                if m:
                    servings = int(m.group())

            # Ингредиенты — берём из meta тегов формат "Молоко - 100 мл"
            ingredients = []
            for meta in soup.select("meta[itemprop='recipeIngredient']"):
                content = meta.get("content", "")
                if " - " in content:
                    parts = content.split(" - ", 1)
                    name = parts[0].strip()[:200]
                    amount = parts[1].strip()
                else:
                    name = content.strip()[:200]
                    amount = None
                if name:
                    ingredients.append({"name": name, "amount": amount})

            # Шаги
            steps = []
            for i, item in enumerate(soup.select("ol.instructions li div.instruction"), 1):
                text = item.get_text(strip=True)
                if text:
                    steps.append({"step_number": i, "text": text, "image_url": None})

            if not steps or not ingredients:
                return None

            category = detect_category(title, url)

            return {
                "title": title,
                "category": category,
                "calories": calories,
                "protein": protein,
                "fat": fat,
                "carbs": carbs,
                "cook_time_minutes": cook_time,
                "servings": servings,
                "image_url": None,
                "author_credit": "1000.menu",
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


@celery_app.task(name="import_recipes_from_1000menu")
def import_recipes_from_1000menu(catalog_path: str = "/catalog/pp-recepty", pages: int = 10, light: bool = False):
    async def _run():
        logger.info(f"Парсим 1000.menu{catalog_path}, страниц: {pages}, light: {light}")
        urls = await fetch_recipe_urls(catalog_path, pages)
        logger.info(f"Найдено URL: {len(urls)}")

        saved = 0
        skipped = 0
        for url in urls:
            data = await parse_recipe(url, light=light)
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