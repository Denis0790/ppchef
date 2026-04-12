"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecipes, Recipe, RecipesResponse } from "@/lib/api";
import PopularRecipes from "@/components/PopularRecipes";
import { useAuth } from "@/lib/auth";
import FavoriteButton from "@/components/FavoriteButton";
import InstallBanner from "@/components/InstallBanner";
import Image from "next/image";
import { Fragment } from "react";
import Header from "@/components/Header";


const CATEGORIES = [
  { key: "", label: "все", svg: "/icon_filter/vse.svg", svgActive: "/icon_filter/vse2.svg" },
  { key: "breakfast", label: "завтрак", svg: "/icon_filter/zavtrak.svg", svgActive: "/icon_filter/zavtrak2.svg" },
  { key: "lunch", label: "обед", svg: "/icon_filter/obed.svg", svgActive: "/icon_filter/obed2.svg" },
  { key: "dinner", label: "ужин", svg: "/icon_filter/ujin.svg", svgActive: "/icon_filter/ujin2.svg" },
  { key: "snack", label: "перекус", svg: "/icon_filter/perekus.svg", svgActive: "/icon_filter/perekus2.svg" },
  { key: "dessert", label: "десерт", svg: "/icon_filter/desert.svg", svgActive: "/icon_filter/desert2.svg" },
  { key: "salad", label: "салат", svg: "/icon_filter/salat.svg", svgActive: "/icon_filter/salat2.svg" },
  { key: "smoothie", label: "смузи", svg: "/icon_filter/smuzy.svg", svgActive: "/icon_filter/smuzy2.svg" },
];

const PAGE_SIZE = 10;

// ─── ДИЗАЙН-ТОКЕНЫ ────────────────────────────────────────────────────────────
const DESIGN = {
           // размер иконки профиля (px)

  // Цвета фильтро
  filterBg: "#F8FFEE",           // фон полосы фильтров
  filterBorder: "#F8FFEE",       // граница полосы фильтров
  filterActiveBg: "#013125",     // фон активной кнопки фильтра
  filterActiveText: "#A6ED49",   // текст активной кнопки фильтра
  filterInactiveText: "#013125", // текст неактивной кнопки фильтра
  filterBorderColor: "#013125",  // граница кнопок фильтра
  filterIconSize: 24,            // размер иконки в фильтре (px)
  // Для замены SVG иконок фильтров — папка /public/icon_filter/
  // Активная иконка: svgActive, неактивная: svg (они инвертированы в коде)

  // Цвета карточки рецепта
  cardBg: "#F8FFEE",                // фон карточки
  cardImageHeight: 180,          // высота картинки в карточке (px)
  cardImagePlaceholderBg: "linear-gradient(135deg, #e8e0d0 0%, #d5cab8 100%)",
  cardCategoryBadgeBg: "#4F7453",
  cardCategoryBadgeText: "#F8FFEE",
  cardTitleColor: "#333",
  cardKbjuBg: "#F5F0E8",        // фон ячеек КБЖУ
  cardKbjuValueColor: "#4F7453",
  cardTimeColor: "#888",

  // Основной фон страницы
  pageBg: "#F8FFEE",

  // Кнопка "наверх"
  scrollBtnBg: "#013125",
  scrollBtnColor: "#F8FFEE",
  scrollBtnSize: 44,             // размер кнопки (px)
  scrollBtnBottom: 90,           // отступ снизу (px)
  scrollBtnRight: 16,            // ← отступ справа (px)
};
// ──────────────────────────────────────────────────────────────────────────────

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const emoji = CATEGORIES.find(c => c.key === recipe.category)?.svgActive || "🥗";
  const label = CATEGORIES.find(c => c.key === recipe.category)?.label || recipe.category;
  const [normPercent, setNormPercent] = useState<number | null>(null);
  const [hasStopWords, setHasStopWords] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      try {
        const raw = localStorage.getItem("userNorm");
        if (!raw) return;
        const norm = JSON.parse(raw);
        if (norm.show && norm.calories && recipe.calories) {
          setNormPercent(Math.round(recipe.calories * 100 / norm.calories));
        }
        if (norm.stop_words) {
          const stops = norm.stop_words.toLowerCase().split(",").map((s: string) => s.trim()).filter(Boolean);
          if (stops.length && recipe.ingredient_names?.length) {
            const found = recipe.ingredient_names.some(ing =>
              stops.some((stop: string) => ing.toLowerCase().includes(stop))
            );
            setHasStopWords(found);
          }
        }
      } catch {}
    }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick() {
    sessionStorage.setItem("scrollY", String(window.scrollY));
    sessionStorage.setItem("backTo", "/");
    sessionStorage.setItem("isBack", "1");
  }

  return (
    <Link href={`/recipes/${recipe.id}`} onClick={handleClick} style={{ textDecoration: "none" }}>
      <div style={{
        /* ── ОБЁРТКА КАРТОЧКИ ──────────────────────────────────────
           Фон: #fff | Скругление: 16px | Тень лёгкая
        ────────────────────────────────────────────────────────── */
        background: DESIGN.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        cursor: "pointer",
      }}>

        {/* ── БЛОК ФОТО ────────────────────────────────────────────
            Высота: DESIGN.cardImageHeight
            Фото: objectFit cover, вся ширина
            Заглушка: эмодзи по центру
        ────────────────────────────────────────────────────────── */}
        <div style={{
          height: DESIGN.cardImageHeight,
          position: "relative",
          overflow: "hidden",
          background: DESIGN.cardImagePlaceholderBg,
        }}>
          {recipe.image_url
            ? <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                sizes="(max-width: 768px) 100vw, 665px"
                quality={70}
                style={{ objectFit: "cover" }}
              />
            : <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 64,
              }}>{emoji}</div>
          }
        </div>

        {/* ── КОНТЕНТ ПОД ФОТО ─────────────────────────────────────
            padding: 11px 0 14px 0
            Два столбца: левый (бейдж+избранное, название, мета)
                         правый (КБЖУ)
        ────────────────────────────────────────────────────────── */}
        <div style={{
          padding: "11px 0 14px 0",
          display: "flex",
          gap: 0,
          alignItems: "flex-start",
        }}>

          {/* ── ЛЕВАЯ КОЛОНКА ────────────────────────────────────────
              Отступ слева 21px — как у бейджа и текста
              flex: 1
          ────────────────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 21 }}>

            {/* ── СТРОКА 1: бейдж категории + кнопка «в избранное» ──
                Оба элемента высотой 25px, в одну строку
                Расстояние между ними: 4px
            ────────────────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>

              {/* Бейдж категории
                  Размер: 52×25px | Скругление: 100px (овал)
                  Фон: #01311C | Текст: белый, 8px
              */}
              <div style={{
                width: 52, height: 25,
                borderRadius: 100,
                background: "#01311C",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 9,
                  color: "#F8FFEE", lineHeight: 1,
                  whiteSpace: "nowrap",
                  fontFamily: "'Montserrat', sans-serif",
                  fontStyle: "italic",
                }}>
                  {label}
                </span>
              </div>

              {/* Кнопка «в избранное»
                  Размер: 98×25px | Скругление: 100px
                  Фон по умолчанию: как у карточки (#fff)
                  Обводка сердца: #01311C, 1.1px
                  Нажата: фон #01311C, текст A6ED49, обводка сердца A6ED49
                  Сердце: 15×15px
              */}
              <FavoriteButton recipeId={recipe.id} variant="card" />
            </div>

            {/* ── СТРОКА 2: название рецепта ───────────────────────
                Отступ сверху: 0 (уже задан marginBottom: 7 у строки выше)
                Отступ снизу: 7px до мета-строки
                Макс. ширина: 256px
                Цвет: #133520 | Шрифт: Cormorant Garamond, 17px
                Ограничение: 2 строки с обрезкой
            ────────────────────────────────────────────────────── */}
            <div style={{
              fontSize: 14, lineHeight: 1.3,
              color: "#133520",
              marginBottom: 7,
              maxWidth: 225,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {recipe.title}
            </div>

           {hasStopWords && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              borderRadius: 20, paddingTop: 3, paddingBottom: 3, paddingLeft: 0, paddingRight: 10,
              marginBottom: 8,
            }}>
              <Image src="/icons/stop.svg" alt="" width={16} height={16} style={{ objectFit: "contain" }} />
              <span style={{
                fontSize: 11, fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: "#F87045",
              }}>
                нежелательные ингредиенты
              </span>
            </div>
          )}

            {/* ── СТРОКА 3: мета (время, порции, % нормы) ──────────
                Отступ слева: 0 (уже есть paddingLeft на колонке)
                Цвет: DESIGN.cardTimeColor (серый)
            ────────────────────────────────────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center",
              flexWrap: "wrap", gap: "2px 12px",
              fontSize: 11, color: DESIGN.cardTimeColor,
              fontFamily: "'Montserrat', sans-serif",
              fontStyle: "italic",
            }}>
              {recipe.cook_time_minutes && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Image src="/icons/chasi.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.cook_time_minutes} мин
                </span>
              )}
              {recipe.servings && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Image src="/icons/vilki.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.servings} порц.
                </span>
              )}
              {normPercent !== null && (
                <span>{normPercent}% нормы</span>
              )}
            </div>

          </div>

          {/* ── ПРАВАЯ КОЛОНКА: КБЖУ ─────────────────────────────────
              4 бейджа вертикально: Ккал / Белки / Жиры / Углеводы
              Каждый бейдж: 83×19px
              Фон: как у карточки  | Обводка: #A6ED49, 1px
              Значение: жирное | Подпись: обычная | Всё в одну строку
              Цвет текста: #01311C
              Отступ справа от колонки: 40px
          ────────────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 4,
            flexShrink: 0, width: 86,
            marginRight: 20,
            boxSizing: "border-box",
          }}>
            {[
              { label: "ккал",     value: recipe.calories },
              { label: "белки",    value: recipe.protein  },
              { label: "жиры",     value: recipe.fat      },
              { label: "углеводы", value: recipe.carbs    },
            ].map(({ label, value }) => (
              <div key={label} style={{
                /* Бейдж КБЖУ
                   Размер: 83×19px | Скругление: 12px
                   Фон: (как карточка) | Обводка: #A6ED49, 1px
                   Значение и подпись в одну строку, не переносятся
                */
                width: 83, height: 19,
                border: "1px solid #A6ED49",
                borderRadius: 12,
                background: DESIGN.cardBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                overflow: "hidden",
              }}>
                {/* Значение: жирное, #01311C */}
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: "#01311C", lineHeight: 1,
                  whiteSpace: "nowrap",
                }}>
                  {value ? Math.round(value) : "—"}
                </span>
                {/* Подпись: обычная, #01311C */}
                <span style={{
                  fontSize: 10,
                  color: "#01311C", lineHeight: 1,
                  whiteSpace: "nowrap",
                  opacity: 0.75,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Link>
  );
}
function checkIsBack(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("isBack") === "1";
}

export default function RecipeList({ initialData, popularRecipes, refCode }: {
  initialData: RecipesResponse,
  popularRecipes: Recipe[],
  refCode?: string,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loaderRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const isBackRef = useRef(checkIsBack());

  const [recipes, setRecipes] = useState<Recipe[]>(initialData.items);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.total > initialData.items.length);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (refCode) localStorage.setItem("ref_code", refCode);
  }, [refCode]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isBack = isBackRef.current;
    isBackRef.current = false;
    sessionStorage.removeItem("isBack");

    if (isBack) {
      const cachedStr = sessionStorage.getItem("cachedRecipes");
      const cachedPage = sessionStorage.getItem("cachedPage");
      const cachedHasMore = sessionStorage.getItem("cachedHasMore");
      const cachedCategory = sessionStorage.getItem("cachedCategory") || "";
      const savedScroll = sessionStorage.getItem("scrollY");

      if (cachedStr) {
        const cached = JSON.parse(cachedStr) as Recipe[];
        setRecipes(cached);
        setPage(parseInt(cachedPage || "1"));
        setHasMore(cachedHasMore === "1");
        setActiveCategory(cachedCategory);

        if (cachedCategory) {
          window.history.replaceState(null, "", `/?category=${cachedCategory}`);
        } else {
          window.history.replaceState(null, "", "/");
        }

        if (savedScroll && parseInt(savedScroll) > 0) {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll));
            sessionStorage.removeItem("scrollY");
          }, 100);
        }

        setTimeout(() => {
          const savedFilterScroll = sessionStorage.getItem("filterScrollX");
          if (filterRef.current && savedFilterScroll) {
            filterRef.current.scrollLeft = parseInt(savedFilterScroll);
          }
        }, 50);

        return;
      }
    }

    const category = searchParams.get("category") || "";
    setActiveCategory(category);
    setPage(1);
    setLoading(true);
    getRecipes({ category: category || undefined, page: 1, page_size: PAGE_SIZE })
      .then(result => {
        setRecipes(result.items);
        setHasMore(result.total > result.items.length);
        sessionStorage.setItem("cachedRecipes", JSON.stringify(result.items));
        sessionStorage.setItem("cachedPage", "1");
        sessionStorage.setItem("cachedHasMore", result.total > result.items.length ? "1" : "0");
        sessionStorage.setItem("cachedCategory", category);
      })
      .finally(() => setLoading(false));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await getRecipes({
        category: activeCategory || undefined,
        page: nextPage,
        page_size: PAGE_SIZE,
      });
      setRecipes(prev => {
        const updated = [...prev, ...result.items];
        sessionStorage.setItem("cachedRecipes", JSON.stringify(updated));
        sessionStorage.setItem("cachedPage", String(nextPage));
        sessionStorage.setItem("cachedHasMore", result.total > nextPage * PAGE_SIZE ? "1" : "0");
        return updated;
      });
      setPage(nextPage);
      setHasMore(result.total > nextPage * PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, activeCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  function handleCategory(category: string) {
    if (filterRef.current) {
      sessionStorage.setItem("filterScrollX", String(filterRef.current.scrollLeft));
    }
    sessionStorage.removeItem("scrollY");
    sessionStorage.removeItem("cachedRecipes");
    sessionStorage.removeItem("cachedPage");
    sessionStorage.removeItem("cachedHasMore");
    sessionStorage.setItem("cachedCategory", category);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    router.push(`/?${params.toString()}`);
  }

  return (
    <>
      <InstallBanner />
      <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: DESIGN.pageBg }}>

        {/* ── SEO: скрытый H1 для поисковиков ── */}
        <h1 style={{
          position: "absolute", width: 1, height: 1,
          overflow: "hidden", clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap", margin: 0,
        }}>
          Рецепты правильного питания с расчётом КБЖУ — ПП Шеф
        </h1>

        {/* ── ШАПКА ──────────────────────────────────────────────────────────
            Логотип: /public/logo.svg
            Иконка профиля: /public/profile.svg
            Высота: DESIGN.headerHeight
            Фон: DESIGN.headerBg
        ────────────────────────────────────────────────────────────────────── */}
        <Header />

        {/* ── ФИЛЬТРЫ КАТЕГОРИЙ ───────────────────────────────────────────────
            Иконки: /public/icon_filter/*.svg
            Активная: svg (светлая), неактивная: svgActive (тёмная) — можно поменять местами
            Фон полосы: DESIGN.filterBg
            Кнопки: DESIGN.filterActiveBg / DESIGN.filterInactiveText
        ────────────────────────────────────────────────────────────────────── */}
        <div
          ref={filterRef}
          style={{
            display: "flex", gap: 8,
            padding: "12px 16px",
            overflowX: "auto",
            background: DESIGN.filterBg,
            borderBottom: `1px solid ${DESIGN.filterBorder}`,
            scrollbarWidth: "none",
            position: "sticky",

            zIndex: 6,
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic",
            
          }}
        >
          {CATEGORIES.map(({ key, label, svg, svgActive }) => {
            const active = activeCategory === key;
            return (
              <div
                key={key}
                onClick={() => handleCategory(key)}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 6,
                  height: 32, padding: "0 14px", borderRadius: 20,
                  background: active ? DESIGN.filterActiveBg : DESIGN.filterBg,
                  border: `1.5px solid ${DESIGN.filterBorderColor}`,
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.2s ease", boxSizing: "border-box",
                }}
              >
                <Image
                  src={active ? svg : svgActive}
                  alt={label}
                  width={DESIGN.filterIconSize}
                  height={DESIGN.filterIconSize}
                  style={{ display: "block", flexShrink: 0 }}
                />
                <span style={{
                  fontSize: 12, fontWeight: active ? 600 : 500, lineHeight: 1,
                  color: active ? DESIGN.filterActiveText : DESIGN.filterInactiveText,
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── СПИСОК РЕЦЕПТОВ ── */}
        <div style={{ padding: "16px 16px 80px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Загрузка...</div>
          ) : recipes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
              <div>Рецептов пока нет</div>
            </div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recipes.map((recipe, index) => (
                  <Fragment key={recipe.id}>
                    <RecipeCard recipe={recipe} />
                    {index === 19 && !activeCategory && (
                      <PopularRecipes recipes={popularRecipes} />
                    )}
                  </Fragment>
                ))}
              </div>
            )}

          <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loadingMore && <div style={{ color: "#aaa", fontSize: 13 }}>Загружаем ещё...</div>}
            {!hasMore && recipes.length > 0 && (
              <div style={{ color: "#ccc", fontSize: 12 }}>Все рецепты загружены </div>
            )}
          </div>
        </div>

        {/* ── КНОПКА НАВЕРХ ──────────────────────────────────────────────────
            Размер: DESIGN.scrollBtnSize
            Отступ справа: DESIGN.scrollBtnRight (фиксированный, не calc)
            Отступ снизу: DESIGN.scrollBtnBottom
            Фон: DESIGN.scrollBtnBg
        ────────────────────────────────────────────────────────────────────── */}
        {showScrollTop && (
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              position: "fixed",
              bottom: DESIGN.scrollBtnBottom,
              right: DESIGN.scrollBtnRight,  // ← исправлено, теперь видна полностью
              width: DESIGN.scrollBtnSize,
              height: DESIGN.scrollBtnSize,
              borderRadius: "50%",
              background: DESIGN.scrollBtnBg,
              color: DESIGN.scrollBtnColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(79,116,83,0.4)",
              zIndex: 20,
            }}
          >↑</div>
        )}
      </main>
    </>
  );
}