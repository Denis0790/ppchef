import re
import time
import uuid
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.db.session import SyncSessionLocal
from app.models.recipe import Recipe, RecipeIngredient, RecipeStep, RecipeStatus

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
BASE_URL = "https://menunedeli.ru"

CATEGORY_MAP = {
    "завтрак": "breakfast", "обед": "lunch", "ужин": "dinner",
    "перекус": "snack", "десерт": "dessert", "суп": "soup",
    "салат": "salad", "смузи": "smoothie",
}

def detect_category(text: str) -> str:
    text = text.lower()
    for ru, en in CATEGORY_MAP.items():
        if ru in text:
            return en
    return "dinner"

def parse_time(text: str) -> int | None:
    total = 0
    h = re.search(r"(\d+)\s*час", text)
    m = re.search(r"(\d+)\s*мин", text)
    if h:
        total += int(h.group(1)) * 60
    if m:
        total += int(m.group(1))
    return total if total else None

def parse_recipe(url: str) -> dict | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")

        title_tag = soup.find("h1")
        if not title_tag:
            return None
        title = title_tag.get_text(strip=True)
        title = re.sub(r"^Рецепт\s+", "", title)

        og_image = soup.find("meta", property="og:image")
        image_url = og_image["content"] if og_image else None

        calories = None
        kcal_block = soup.find(string=re.compile(r"Калорийность"))
        if kcal_block:
            kcal_text = kcal_block.parent.get_text()
            m = re.search(r"(\d+)\s*ккал", kcal_text)
            if m:
                calories = float(m.group(1))

        cook_time = None
        time_block = soup.find(string=re.compile(r"время готовки", re.I))
        if time_block:
            cook_time = parse_time(time_block.parent.get_text())

        servings = None
        servings_block = soup.find(string=re.compile(r"Количество порций", re.I))
        if servings_block:
            m = re.search(r"(\d+)", servings_block.parent.get_text())
            if m:
                servings = int(m.group(1))

        ingredients = []
        for meta in soup.find_all("meta", itemprop="recipeIngredient"):
            content = meta.get("content", "").strip()
            if not content:
                continue
            if "–" in content:
                parts = content.split("–", 1)
                name = parts[0].strip()
                amount = parts[1].strip()
            else:
                name = content
                amount = None
            if name:
                ingredients.append({"name": name, "amount": amount})

        steps = []
        instructions = soup.select("ul.instructions-lst li")
        for i, li in enumerate(instructions):
            desc = li.select_one("div.desc")
            if desc:
                text = desc.get_text(separator=" ", strip=True)
                text = re.sub(r"\s+", " ", text).strip()
                if text:
                    steps.append({"step_number": i + 1, "text": text})

        breadcrumbs = soup.get_text()
        category = detect_category(breadcrumbs)

        return {
            "title": title,
            "image_url": image_url,
            "calories": calories,
            "cook_time_minutes": cook_time,
            "servings": servings,
            "category": category,
            "ingredients": ingredients,
            "steps": steps,
        }
    except Exception as e:
        print(f"Ошибка парсинга {url}: {e}")
        return None


def get_recipe_links(catalog_url: str) -> list[str]:
    try:
        r = requests.get(catalog_url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"  HTTP {r.status_code} — пропускаем")
            return []
        soup = BeautifulSoup(r.text, "html.parser")
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/recipe/" in href:
                if not href.startswith("http"):
                    href = BASE_URL + href
                if href not in links:
                    links.append(href)
        print(f"  Найдено ссылок: {len(links)}")
        return links
    except Exception as e:
        print(f"Ошибка каталога {catalog_url}: {e}")
        return []


def import_recipes_from_menunedeli(
    catalog_path: str = "/podborki-receptov/nizkokalorijnye-recepty-obedov-i-uzhinov/",
    pages: int = 10,
) -> str:
    db: Session = SyncSessionLocal()
    saved = 0
    skipped = 0

    try:
        all_links = []
        for page in range(1, pages + 1):
            if page == 1:
                url = f"{BASE_URL}{catalog_path}"
            else:
                url = f"{BASE_URL}{catalog_path}page/{page}/"
            print(f"Каталог стр.{page}: {url}")
            links = get_recipe_links(url)
            if not links:
                print(f"  Стр.{page} пуста — стоп")
                break
            all_links.extend(links)
            time.sleep(1.5)

        all_links = list(dict.fromkeys(all_links))
        print(f"\nВсего уникальных ссылок: {len(all_links)}\n")

        for idx, url in enumerate(all_links, 1):
            print(f"[{idx}/{len(all_links)}] {url}")
            data = parse_recipe(url)
            if not data or not data["title"] or not data["ingredients"]:
                skipped += 1
                print(f"  Пропущено")
                continue

            recipe = Recipe(
                id=uuid.uuid4(),
                title=data["title"],
                category=data["category"],
                image_url=data["image_url"],
                calories=data["calories"],
                cook_time_minutes=data["cook_time_minutes"],
                servings=data["servings"],
                status=RecipeStatus.draft,
                author_credit="Меню недели",
            )
            db.add(recipe)
            db.flush()

            for ing in data["ingredients"]:
                db.add(RecipeIngredient(
                    id=uuid.uuid4(),
                    recipe_id=recipe.id,
                    name=ing["name"],
                    amount=ing.get("amount"),
                ))

            for step in data["steps"]:
                db.add(RecipeStep(
                    id=uuid.uuid4(),
                    recipe_id=recipe.id,
                    step_number=step["step_number"],
                    text=step["text"],
                ))

            db.commit()
            saved += 1
            print(f"  ✓ Сохранён: {data['title']}")
            time.sleep(0.8)

    except Exception as e:
        db.rollback()
        print(f"Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

    return f"menunedeli: сохранено {saved}, пропущено {skipped}"