"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecipes, Recipe, RecipesResponse } from "@/lib/api";
import PopularRecipes from "@/components/PopularRecipes";
import { useAuth } from "@/lib/auth";
import FavoriteButton from "@/components/FavoriteButton";
import InstallBanner from "@/components/InstallBanner";

const CATEGORIES = [
  { key: "", label: "Все", svg: "/icon_filter/vse.svg", svgActive: "/icon_filter/vse2.svg" },
  { key: "breakfast", label: "Завтрак", svg: "/icon_filter/zavtrak.svg", svgActive: "/icon_filter/zavtrak2.svg" },
  { key: "lunch", label: "Обед", svg: "/icon_filter/obed.svg", svgActive: "/icon_filter/obed2.svg" },
  { key: "dinner", label: "Ужин", svg: "/icon_filter/ujin.svg", svgActive: "/icon_filter/ujin2.svg" },
  { key: "snack", label: "Перекус", svg: "/icon_filter/perekus.svg", svgActive: "/icon_filter/perekus2.svg" },
  { key: "dessert", label: "Десерт", svg: "/icon_filter/desert.svg", svgActive: "/icon_filter/desert2.svg" },
  { key: "salad", label: "Салат", svg: "/icon_filter/salat.svg", svgActive: "/icon_filter/salat2.svg" },
  { key: "smoothie", label: "Смузи", svg: "/icon_filter/smuzy.svg", svgActive: "/icon_filter/smuzy2.svg" },
];

const PAGE_SIZE = 10;

// ─── ДИЗАЙН-ТОКЕНЫ ────────────────────────────────────────────────────────────
const DESIGN = {
  // Цвета шапки
  headerBg: "#01311C",           // фон шапки
  headerHeight: 96,              // высота шапки (px)
  logoHeight: 72,                // высота логотипа (px)
  profileIconSize: 44,           // размер иконки профиля (px)

  // Цвета фильтров
  filterBg: "#E1FAC0",           // фон полосы фильтров
  filterBorder: "#cfe7b3",       // граница полосы фильтров
  filterActiveBg: "#013125",     // фон активной кнопки фильтра
  filterActiveText: "#A6ED49",   // текст активной кнопки фильтра
  filterInactiveText: "#013125", // текст неактивной кнопки фильтра
  filterBorderColor: "#013125",  // граница кнопок фильтра
  filterIconSize: 22,            // размер иконки в фильтре (px)
  // Для замены SVG иконок фильтров — папка /public/icon_filter/
  // Активная иконка: svgActive, неактивная: svg (они инвертированы в коде)

  // Цвета карточки рецепта
  cardBg: "#fff",                // фон карточки
  cardImageHeight: 180,          // высота картинки в карточке (px)
  cardImagePlaceholderBg: "linear-gradient(135deg, #e8e0d0 0%, #d5cab8 100%)",
  cardCategoryBadgeBg: "#4F7453",
  cardCategoryBadgeText: "#fff",
  cardTitleColor: "#333",
  cardKbjuBg: "#F5F0E8",        // фон ячеек КБЖУ
  cardKbjuValueColor: "#4F7453",
  cardTimeColor: "#888",

  // Основной фон страницы
  pageBg: "#F5F0E8",

  // Кнопка "наверх"
  scrollBtnBg: "#4F7453",
  scrollBtnColor: "#fff",
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
        background: DESIGN.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        cursor: "pointer",
      }}>
        {/* ── Картинка карточки ── */}
        <div style={{
          height: DESIGN.cardImageHeight,
          background: DESIGN.cardImagePlaceholderBg,
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 64,
          position: "relative", overflow: "hidden",
        }}>
          {recipe.image_url
            ? <img src={recipe.image_url} alt={recipe.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : emoji}
          {/* Бейдж категории — слева снизу */}
          <div style={{
            position: "absolute", bottom: 12, left: 12,
            background: DESIGN.cardCategoryBadgeBg,
            color: DESIGN.cardCategoryBadgeText,
            fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 20,
          }}>
            {label}
          </div>
          <FavoriteButton recipeId={recipe.id} variant="card" />
        </div>

        {/* ── Контент карточки ── */}
        <div style={{ padding: "14px 16px 16px" }}>
          <div style={{
            fontSize: 17, fontWeight: 600,
            color: DESIGN.cardTitleColor,
            marginBottom: hasStopWords ? 6 : 10,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            {recipe.title}
          </div>

          {hasStopWords && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(192,57,43,0.08)",
              borderRadius: 20, padding: "3px 10px", marginBottom: 10,
            }}>
              <span style={{ fontSize: 11, color: "rgba(192,57,43,0.55)", fontWeight: 400 }}>
                🚫 нежелательные ингредиенты
              </span>
            </div>
          )}

          {/* ── КБЖУ ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6, marginBottom: 12,
          }}>
            {[
              { label: "Ккал", value: recipe.calories },
              { label: "Белки", value: recipe.protein },
              { label: "Жиры", value: recipe.fat },
              { label: "Углев", value: recipe.carbs },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: DESIGN.cardKbjuBg,
                borderRadius: 10, padding: "6px 4px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DESIGN.cardKbjuValueColor }}>
                  {value ? Math.round(value) : "—"}
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: DESIGN.cardTimeColor }}>
              {recipe.cook_time_minutes && <span>⏱ {recipe.cook_time_minutes} мин</span>}
              {recipe.servings && <span>🍽 {recipe.servings} порц.</span>}
            </div>
            <span style={{ fontSize: 11, color: "#aaa" }}>
              {normPercent !== null ? `${normPercent}% нормы` : ""}
            </span>
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
        <div style={{
          height: DESIGN.headerHeight,
          padding: "0 20px",
          background: DESIGN.headerBg,
          borderBottom: "1px solid #ece7de",
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <img src="/logo.svg" alt="ПП Шеф" style={{ height: DESIGN.logoHeight, width: "auto" }} />
          <div onClick={() => router.push(isLoggedIn ? "/profile" : "/auth")} style={{ cursor: "pointer" }}>
            <img src="/profile.svg" alt="Профиль" style={{ width: DESIGN.profileIconSize, height: DESIGN.profileIconSize }} />
          </div>
        </div>

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
            top: DESIGN.headerHeight - 24,
            zIndex: 6,
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
                  height: 38, padding: "0 14px", borderRadius: 20,
                  background: active ? DESIGN.filterActiveBg : DESIGN.filterBg,
                  border: `1.5px solid ${DESIGN.filterBorderColor}`,
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.2s ease", boxSizing: "border-box",
                }}
              >
                <img
                  src={active ? svg : svgActive}
                  alt={label}
                  style={{ width: DESIGN.filterIconSize, height: DESIGN.filterIconSize, display: "block", flexShrink: 0 }}
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
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}

          <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loadingMore && <div style={{ color: "#aaa", fontSize: 13 }}>Загружаем ещё...</div>}
            {!hasMore && recipes.length > 0 && (
              <div style={{ color: "#ccc", fontSize: 12 }}>Все рецепты загружены 🎉</div>
            )}
          </div>

          {!activeCategory && <PopularRecipes recipes={popularRecipes} />}
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