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
  { key: "", label: "Все", emoji: "🌿" },
  { key: "breakfast", label: "Завтрак", emoji: "🌅" },
  { key: "lunch", label: "Обед", emoji: "🥗" },
  { key: "dinner", label: "Ужин", emoji: "🍽️" },
  { key: "snack", label: "Перекус", emoji: "🥜" },
  { key: "dessert", label: "Десерт", emoji: "🍓" },
  { key: "salad", label: "Салат", emoji: "🥙" },
  { key: "smoothie", label: "Смузи", emoji: "🥤" },
];

const PAGE_SIZE = 10;

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const emoji = CATEGORIES.find(c => c.key === recipe.category)?.emoji || "🥗";
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
        background: "#fff", borderRadius: 16,
        overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        cursor: "pointer",
      }}>
        <div style={{
          height: 180,
          background: "linear-gradient(135deg, #e8e0d0 0%, #d5cab8 100%)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 64, position: "relative",
          overflow: "hidden",
        }}>
          {recipe.image_url
            ? <img src={recipe.image_url} alt={recipe.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : emoji}
          <div style={{
            position: "absolute", bottom: 12, left: 12,
            background: "#4F7453", color: "#fff",
            fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 20,
          }}>
            {label}
          </div>
          <FavoriteButton recipeId={recipe.id} variant="card" />
        </div>
        <div style={{ padding: "14px 16px 16px" }}>
          <div style={{
            fontSize: 17, fontWeight: 600, color: "#333",
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
                background: "#F5F0E8", borderRadius: 10,
                padding: "6px 4px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4F7453" }}>
                  {value ? Math.round(value) : "—"}
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888" }}>
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

        // Восстанавливаем URL
        if (cachedCategory) {
          window.history.replaceState(null, "", `/?category=${cachedCategory}`);
        } else {
          window.history.replaceState(null, "", "/");
        }

        // Восстанавливаем скролл страницы
        if (savedScroll && parseInt(savedScroll) > 0) {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll));
            sessionStorage.removeItem("scrollY");
          }, 100);
        }

        // Восстанавливаем скролл фильтров
        setTimeout(() => {
          const savedFilterScroll = sessionStorage.getItem("filterScrollX");
          if (filterRef.current && savedFilterScroll) {
            filterRef.current.scrollLeft = parseInt(savedFilterScroll);
          }
        }, 50);

        return;
      }
    }

    // Обычная загрузка
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
      <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8" }}>

        {/* Шапка */}
        <div style={{
          padding: "16px 20px", background: "#fff",
          borderBottom: "1px solid #ece7de",
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#4F7453" }}>
              🌿 ПП Шеф
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Рецепты правильного питания</div>
          </div>
          <div onClick={() => router.push(isLoggedIn ? "/profile" : "/auth")} style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#F5F0E8", display: "flex",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 20,
            border: "1.5px solid #ece7de",
          }}>
            👤
          </div>
        </div>

        {/* Фильтры */}
        <div
          ref={filterRef}
          style={{
            display: "flex", gap: 8, padding: "12px 16px",
            overflowX: "auto", background: "#fff",
            borderBottom: "1px solid #ece7de", scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map(({ key, label, emoji }) => (
            <div key={key} onClick={() => handleCategory(key)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20,
              background: activeCategory === key ? "#4F7453" : "#F5F0E8",
              color: activeCategory === key ? "#fff" : "#888",
              fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
              fontWeight: activeCategory === key ? 600 : 400,
              transition: "all 0.2s",
            }}>
              {emoji} {label}
            </div>
          ))}
        </div>

        {/* Список */}
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

        {showScrollTop && (
          <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{
            position: "fixed", bottom: 90, right: "calc(50% - 228px)",
            width: 44, height: 44, borderRadius: "50%",
            background: "#4F7453", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(79,116,83,0.4)", zIndex: 20,
          }}>↑</div>
        )}

        {/* Нижняя навигация */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, background: "#fff",
          borderTop: "1px solid #ece7de", display: "flex",
          justifyContent: "space-around", padding: "10px 0 20px",
        }}>
          {[
            { icon: "🏠", label: "Главная", href: "/" },
            { icon: "🔍", label: "Поиск", href: "/search" },
            { icon: "❤️", label: "Избранное", href: "/favorites" },
            { icon: "📊", label: "КБЖУ", href: "/kbju" },
          ].map(({ icon, label, href }) => (
            <div key={label} onClick={() => router.push(href)} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, cursor: "pointer",
            }}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}