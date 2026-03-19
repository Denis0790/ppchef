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

BASE_URL = "https://www.edimdoma.ru"
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
    "smuzi": "smoothie",
    "smoothie": "smoothie",
}

SMOOTHIE_KEYWORDS = ["smuzi", "smoothie", "kokteyl", "shake"]


def detect_category(title: str, tags: list[str]) -> str:
    text = (title + " " + " ".join(tags)).lower()
    for ru, en in CATEGORY_MAP.items():
        if ru in text:
            return en
    return "lunch"


def is_smoothie_url(url: str) -> bool:
    url_lower = url.lower()
    return any(kw in url_lower for kw in SMOOTHIE_KEYWORDS)


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


def parse_number(text: str) -> Optional[float]:
    if not text:
        return None
    text = text.strip().replace(",", ".")
    m = re.search(r"[\d.]+", text)
    return float(m.group()) if m else None


def get_kbju(soup) -> tuple:
    """Извлекает КБЖУ из страницы"""
    def extract(cls):
        el = soup.find(class_=cls)
        if not el:
            return None
        # Берём первый span с числом внутри
        span = el.find("span", class_=re.compile(r"mr-"))
        if span:
            return parse_number(span.get_text(strip=True))
        return parse_number(el.get_text(strip=True))

    return (
        extract("protein"),
        extract("fat"),
        extract("carbohydrates"),
        extract("calories"),
    )


async def fetch_recipe_urls(tag: str, pages: int = 5) -> list[str]:
    urls = []
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        for page in range(1, pages + 1):
            url = f"{BASE_URL}/retsepty?tag={tag}&page={page}"
            try:
                resp = await client.get(url)
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select("a[href^='/retsepty/']")
                for link in links:
                    href = link.get("href", "")
                    if re.match(r"^/retsepty/\d+", href):
                        full = BASE_URL + href
                        if full not in urls:
                            urls.append(full)
                logger.info(f"Страница {page} тега {tag}: найдено {len(urls)} ссылок всего")
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Ошибка при получении страницы {page}: {e}")
    return urls


async def fetch_urls_by_search(query: str, pages: int = 5) -> list[str]:
    """Ищет рецепты через поиск сайта"""
    urls = []
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        for page in range(1, pages + 1):
            url = f"{BASE_URL}/search?q={query}&page={page}"
            try:
                resp = await client.get(url)
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select("a[href^='/retsepty/']")
                for link in links:
                    href = link.get("href", "")
                    if re.match(r"^/retsepty/\d+", href):
                        full = BASE_URL + href
                        if full not in urls:
                            urls.append(full)
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Ошибка поиска страница {page}: {e}")
    return urls


async def parse_recipe(url: str, is_smoothie_tag: bool = False) -> Optional[dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            # Если редирект на авторизацию — пропускаем
            if "popup_auth" in str(resp.url):
                return None

            soup = BeautifulSoup(resp.text, "html.parser")

            # Название
            title_el = soup.find("h1")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)

            # КБЖУ
            protein, fat, carbs, calories = get_kbju(soup)

            # Смузи — не фильтруем
            smoothie = is_smoothie_tag or is_smoothie_url(url)

            if not smoothie:
                if protein is None or fat is None or carbs is None:
                    return None
                if protein < fat or protein < carbs:
                    return None
                if calories and calories > 700:
                    return None

            # Время готовки
            time_el = soup.select_one("span.rounded-2xl.text-xx")
            cook_time = parse_time(time_el.get_text(strip=True) if time_el else "")

            # Порции
            servings = None
            serv_text = soup.find(string=re.compile(r"\d+\s*(порц|person)", re.I))
            if serv_text:
                m = re.search(r"(\d+)", serv_text)
                if m:
                    servings = int(m.group(1))

            # Ингредиенты
            ingredients = []
            ing_items = soup.select("li.after\\:bg-line-light")
            for item in ing_items:
                name_el = item.select_one("a.linkSimple, span.order-0")
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                amount_el = item.select_one("span.order-2")
                amount = amount_el.get_text(strip=True) if amount_el else None
                if name:
                    ingredients.append({"name": name, "amount": amount})

            # Шаги
            steps = []
            step_items = soup.select("ul.instructions li")
            for i, item in enumerate(step_items, 1):
                text_el = item.select_one("p.not-last\\:mb-4")
                if text_el:
                    text = text_el.get_text(strip=True)
                    if text:
                        steps.append({"step_number": i, "text": text, "image_url": None})

            if not steps or not ingredients:
                return None

            # Категория
            slug = url.rstrip("/").split("/")[-1]
            tags = slug.split("-")[1:]
            category = "smoothie" if smoothie else detect_category(title, tags)

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
                "author_credit": "edimdoma.ru",
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

        for tag_name in data["tags"]:
            db.add(RecipeTag(recipe_id=recipe.id, name=tag_name))

        await db.commit()
        return True


@celery_app.task(name="import_recipes_from_edimdoma")
def import_recipes_from_edimdoma(tag: str = "здоровое-питание", pages: int = 3):
    async def _run():
        logger.info(f"Начинаем парсинг тега '{tag}', страниц: {pages}")
        is_smoothie_tag = any(kw in tag for kw in SMOOTHIE_KEYWORDS)
        urls = await fetch_recipe_urls(tag, pages)
        logger.info(f"Найдено URL: {len(urls)}")

        saved = 0
        skipped = 0
        for url in urls:
            data = await parse_recipe(url, is_smoothie_tag=is_smoothie_tag)
            if data is None:
                skipped += 1
                continue
            result = await save_recipe(data)
            if result:
                saved += 1
                logger.info(f"✅ Сохранён: {data['title']}")
            else:
                skipped += 1
            await asyncio.sleep(1.5)

        logger.info(f"Готово. Сохранено: {saved}, пропущено: {skipped}")
        return {"saved": saved, "skipped": skipped}

    return asyncio.run(_run())


@celery_app.task(name="import_smoothies_from_search")
def import_smoothies_from_search(pages: int = 10):
    """Парсит смузи через поиск"""
    async def _run():
        logger.info(f"Ищем смузи через поиск, страниц: {pages}")
        urls = await fetch_urls_by_search("смузи", pages)
        logger.info(f"Найдено URL: {len(urls)}")

        saved = 0
        skipped = 0
        for url in urls:
            data = await parse_recipe(url, is_smoothie_tag=True)
            if data is None:
                skipped += 1
                continue
            result = await save_recipe(data)
            if result:
                saved += 1
                logger.info(f"✅ Сохранён: {data['title']}")
            else:
                skipped += 1
            await asyncio.sleep(1.5)

        logger.info(f"Готово смузи. Сохранено: {saved}, пропущено: {skipped}")
        return {"saved": saved, "skipped": skipped}

    return asyncio.run(_run())

@celery_app.task(name="import_by_search_no_filter")
def import_by_search_no_filter(queries: list, pages: int = 3):
    """Парсит рецепты через поиск без фильтра по КБЖУ"""
    async def _run():
        all_saved = 0
        all_skipped = 0
        for q in queries:
            urls = await fetch_urls_by_search(q, pages=pages)
            logger.info(f"'{q}': найдено {len(urls)} URL")
            for url in urls:
                data = await parse_recipe(url, is_smoothie_tag=True)  # is_smoothie_tag отключает фильтр
                if data is None:
                    all_skipped += 1
                    continue
                # Переопределяем категорию
                if "десерт" in q or "dessert" in q:
                    data["category"] = "dessert"
                elif "перекус" in q or "снек" in q or "батончик" in q:
                    data["category"] = "snack"
                result = await save_recipe(data)
                if result:
                    all_saved += 1
                    logger.info(f"✅ {data['title']}")
                else:
                    all_skipped += 1
                await asyncio.sleep(1.5)
        logger.info(f"Итого: сохранено {all_saved}, пропущено {all_skipped}")
        return {"saved": all_saved, "skipped": all_skipped}

    return asyncio.run(_run())