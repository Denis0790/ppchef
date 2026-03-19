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

BASE_URL = "https://www.povarenok.ru"
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
}

LIGHT_KEYWORDS = ["smuz", "smoothie", "napitok", "desert", "dessert", "perekus", "vypechka"]


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
    """Берём КБЖУ на порцию"""
    nutrition = soup.select_one('[itemprop="nutrition"]')
    if not nutrition:
        return None, None, None, None

    rows = nutrition.select("tr")
    # Ищем строку с данными на порцию (вторая группа после "Порции")
    portion_next = False
    for row in rows:
        td = row.select_one("td.nae-title")
        if td and "порци" in td.get_text(strip=True).lower():
            portion_next = True
            continue
        if portion_next:
            tds = row.select("td strong")
            if len(tds) >= 4:
                calories = parse_number(tds[0].get_text(strip=True))
                protein = parse_number(tds[1].get_text(strip=True))
                fat = parse_number(tds[2].get_text(strip=True))
                carbs = parse_number(tds[3].get_text(strip=True))
                return protein, fat, carbs, calories
            portion_next = False

    # Fallback — на 100г
    per100_next = False
    for row in rows:
        td = row.select_one("td.nae-title")
        if td and "100" in td.get_text(strip=True):
            per100_next = True
            continue
        if per100_next:
            tds = row.select("td strong")
            if len(tds) >= 4:
                calories = parse_number(tds[0].get_text(strip=True))
                protein = parse_number(tds[1].get_text(strip=True))
                fat = parse_number(tds[2].get_text(strip=True))
                carbs = parse_number(tds[3].get_text(strip=True))
                return protein, fat, carbs, calories
            per100_next = False

    return None, None, None, None


async def fetch_recipe_urls(path: str, pages: int = 5) -> list[str]:
    urls = []
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        for page in range(1, pages + 1):
            url = f"{BASE_URL}{path}~{page}/"
            try:
                resp = await client.get(url)
                if resp.status_code == 404:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select("a[href*='/recipes/show/']")
                for link in links:
                    href = link.get("href", "")
                    if re.search(r"/recipes/show/\d+/", href):
                        full = href if href.startswith("http") else BASE_URL + href
                        # убираем якоря (#comments и т.д.)
                        full = full.split("#")[0]
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

            # КБЖУ
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
            time_el = soup.select_one("time[itemprop='totalTime']")
            cook_time = parse_time(time_el.get_text(strip=True) if time_el else "")

            # Порции
            servings = None
            serv_el = soup.select_one("[itemprop='recipeYield']")
            if serv_el:
                m = re.search(r"\d+", serv_el.get_text(strip=True))
                if m:
                    servings = int(m.group())

            # Ингредиенты
            ingredients = []
            for item in soup.select("li[itemprop='recipeIngredient']"):
                spans = item.select("span")
                if len(spans) >= 2:
                    name = spans[0].get_text(strip=True)
                    amount = spans[1].get_text(strip=True)
                elif len(spans) == 1:
                    name = spans[0].get_text(strip=True)
                    amount = None
                else:
                    continue
                if name:
                    ingredients.append({"name": name[:200], "amount": amount})

            # Шаги
            steps = []
            for i, item in enumerate(soup.select("li.cooking-bl"), 1):
                text_el = item.select_one("div p")
                if text_el:
                    text = text_el.get_text(strip=True)
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
                "author_credit": "povarenok.ru",
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


@celery_app.task(name="import_recipes_from_povarenok")
def import_recipes_from_povarenok(path: str = "/recipes/healthy/", pages: int = 5, light: bool = False):
    """Парсит рецепты с povarenok.ru"""
    async def _run():
        logger.info(f"Парсим povarenok.ru{path}, страниц: {pages}, light: {light}")
        urls = await fetch_recipe_urls(path, pages)
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