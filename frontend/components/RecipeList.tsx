"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import { getRecipes, Recipe, RecipesResponse, searchRecipes } from "@/lib/api";
import PopularRecipes from "@/components/PopularRecipes";
import { useAuth } from "@/lib/auth";
import FavoriteButton from "@/components/FavoriteButton";
import InstallBanner from "@/components/InstallBanner";
import Image from "next/image";
import { Fragment } from "react";
import Header from "@/components/Header";
import { useSearch } from "@/lib/searchContext";
import AuthPrompt from "@/components/AuthPrompt";

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

const DESIGN = {
  filterBg: "#F8FFEE",
  filterBorder: "#F8FFEE",
  filterActiveBg: "#013125",
  filterActiveText: "#A6ED49",
  filterInactiveText: "#013125",
  filterBorderColor: "#013125",
  filterIconSize: 24,
  cardBg: "#F8FFEE",
  cardImageHeight: 180,
  cardImagePlaceholderBg: "linear-gradient(135deg, #e8e0d0 0%, #d5cab8 100%)",
  cardTimeColor: "#888",
  pageBg: "#F8FFEE",
  scrollBtnBg: "#013125",
  scrollBtnColor: "#F8FFEE",
  scrollBtnSize: 44,
  scrollBtnBottom: 90,
  scrollBtnRight: 16,
};

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
        background: DESIGN.cardBg, borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)", cursor: "pointer", display: "flex", flexDirection: "column",
      }}>
        <div className="recipe-card-image" style={{
          height: DESIGN.cardImageHeight, position: "relative", overflow: "hidden",
          background: DESIGN.cardImagePlaceholderBg, flexShrink: 0,
        }}>
          {recipe.image_url
            ? <Image src={recipe.image_url} alt={recipe.title} fill sizes="(max-width: 768px) 100vw, 480px" quality={70} style={{ objectFit: "cover", objectPosition: "center" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{emoji}</div>
          }
        </div>

        <div style={{ padding: "11px 0 14px 0", display: "flex", gap: 0, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 21 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
              <div style={{ width: 52, height: 25, borderRadius: 100, background: "#01311C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="card-text-xs" style={{ fontSize: 9, color: "#F8FFEE", lineHeight: 1, whiteSpace: "nowrap", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
                  {label}
                </span>
              </div>
              <FavoriteButton recipeId={recipe.id} variant="card" />
            </div>

            <div className="card-text-title" style={{ fontSize: 14, lineHeight: 1.3, color: "#133520", marginBottom: 7, maxWidth: 400, fontFamily: "'Montserrat', sans-serif" }}>
              {recipe.title}
            </div>

            {hasStopWords && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 20, paddingTop: 3, paddingBottom: 3, paddingLeft: 0, paddingRight: 10, marginBottom: 8 }}>
                <Image src="/icons/stop.svg" alt="" width={16} height={16} style={{ objectFit: "contain" }} />
                <span className="card-text-sm" style={{ fontSize: 11, fontWeight: 400, fontFamily: "'Montserrat', sans-serif", color: "#F87045" }}>
                  нежелательные ингредиенты
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px 12px", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
              {recipe.cook_time_minutes && (
                <span className="card-text-meta" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: DESIGN.cardTimeColor }}>
                  <Image src="/icons/chasi.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.cook_time_minutes} мин
                </span>
              )}
              {recipe.servings && (
                <span className="card-text-meta" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: DESIGN.cardTimeColor }}>
                  <Image src="/icons/vilki.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.servings} порц.
                </span>
              )}
              {normPercent !== null && (
                <span className="card-text-meta" style={{ fontSize: 11, color: DESIGN.cardTimeColor }}>{normPercent}% нормы</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, width: 86, marginRight: 20, boxSizing: "border-box" }}>
            {[
              { label: "ккал", value: recipe.calories },
              { label: "белки", value: recipe.protein },
              { label: "жиры", value: recipe.fat },
              { label: "углеводы", value: recipe.carbs },
            ].map(({ label, value }) => (
              <div key={label} style={{ width: 83, height: 19, border: "1px solid #A6ED49", borderRadius: 12, background: DESIGN.cardBg, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, overflow: "hidden" }}>
                <span className="card-text-kbju-val" style={{ fontSize: 10, fontWeight: 700, color: "#01311C", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {value ? Math.round(value) : "—"}
                </span>
                <span className="card-text-kbju-label" style={{ fontSize: 10, color: "#01311C", lineHeight: 1, whiteSpace: "nowrap", opacity: 0.75 }}>
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

const Sidebar = memo(({ activeCategory, onCategory }: {
  activeCategory: string;
  onCategory: (cat: string) => void;
}) => (
  <div className="filter-bar" style={{ display: "none" }}>
    {CATEGORIES.map(({ key, label, svg, svgActive }) => {
      const active = activeCategory === key;
      return (
        <div
          key={key}
          className={`filter-btn${active ? " active" : ""}`}
          onClick={() => onCategory(key)}
          style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px", borderRadius: 10, background: active ? "#013125" : "transparent", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.2s ease" }}
        >
          <Image src={active ? svg : svgActive} alt={label} width={20} height={20} style={{ display: "block", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: active ? "#A6ED49" : "#013125" }}>
            {label}
          </span>
        </div>
      );
    })}
  </div>
));
Sidebar.displayName = "Sidebar";

function DesktopSearchBar() {
  const { isPremium, isLoggedIn } = useAuth();
  const {
    desktopQuery, setDesktopQuery,
    desktopMode, setDesktopMode,
    desktopChips, setDesktopChips,
    setDesktopResults,
  } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [authPrompt, setAuthPrompt] = useState<"auth" | "premium" | null>(null);

  function switchMode(m: "title" | "ingredients") {
    if (m === "ingredients") {
      if (!isLoggedIn) { setAuthPrompt("auth"); return; }
      if (!isPremium) { setAuthPrompt("premium"); return; }
    }
    setDesktopMode(m);
    setDesktopQuery("");
    setDesktopChips([]);
    setDesktopResults([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && desktopQuery.trim() && desktopMode === "ingredients") {
      const v = desktopQuery.trim();
      if (!desktopChips.includes(v)) setDesktopChips([...desktopChips, v]);
      setDesktopQuery("");
    }
  }

  return (
    <>
      {authPrompt && (
        <AuthPrompt type={authPrompt} onClose={() => setAuthPrompt(null)} desktop />
      )}

      <div className="desktop-searchbar" style={{ display: "none", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
          {[
            { key: "title", label: "поиск по названию" },
            { key: "ingredients", label: "поиск по продуктам" },
          ].map(({ key, label }) => (
            <span
              key={key}
              onClick={() => switchMode(key as "title" | "ingredients")}
              style={{
                fontSize: 13, fontStyle: "italic",
                fontFamily: "'Montserrat', sans-serif",
                color: desktopMode === key ? "#013125" : "rgba(1,49,37,0.4)",
                cursor: "pointer",
                borderBottom: desktopMode === key ? "1.5px solid #013125" : "1.5px solid transparent",
                paddingBottom: 2, transition: "all 0.2s", whiteSpace: "nowrap",
                fontWeight: desktopMode === key ? 600 : 400,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <svg
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.35 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#013125" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={desktopQuery}
            onChange={e => setDesktopQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={desktopMode === "title" ? "найти рецепт..." : "введите продукт и нажмите Enter"}
            style={{
              width: "100%", height: 44,
              background: "white",
              border: "1.5px solid rgba(1,49,37,0.15)",
              borderRadius: 100,
              paddingLeft: 44, paddingRight: 16,
              color: "#013125", fontSize: 13, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              outline: "none", transition: "border-color 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            onFocus={e => e.target.style.borderColor = "#A6ED49"}
            onBlur={e => e.target.style.borderColor = "rgba(1,49,37,0.15)"}
          />
        </div>

        {desktopMode === "ingredients" && desktopChips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {desktopChips.map(chip => (
              <div key={chip} style={{
                background: "#013125", color: "#A6ED49",
                borderRadius: 100, padding: "5px 10px 5px 14px",
                fontSize: 12, fontFamily: "'Montserrat', sans-serif",
                fontStyle: "italic", display: "flex", alignItems: "center", gap: 6,
              }}>
                {chip}
                <span
                  onClick={() => setDesktopChips(desktopChips.filter(c => c !== chip))}
                  style={{ cursor: "pointer", fontSize: 16, lineHeight: 1, color: "#A6ED49", fontWeight: 700 }}
                >×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function RecipeList({ initialData, popularRecipes, refCode }: {
  initialData: RecipesResponse,
  popularRecipes: Recipe[],
  refCode?: string,
}) {
  const searchParams = useSearchParams();
  const loaderRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const isBackRef = useRef(checkIsBack());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    desktopQuery, desktopMode,
    desktopResults, setDesktopResults,
    setDesktopSearching, desktopSearching,
    desktopChips, setDesktopChips,
    isDesktopSearchActive,
  } = useSearch();

  const [recipes, setRecipes] = useState<Recipe[]>(initialData.items);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.total > initialData.items.length);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (refCode) localStorage.setItem("ref_code", refCode);
  }, [refCode]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); el.scrollLeft += e.deltaY; };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  useEffect(() => {
    if (desktopMode !== "title") return;
    if (!desktopQuery.trim()) { setDesktopResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setDesktopSearching(true);
      try {
        const res = await searchRecipes(desktopQuery.trim(), "title");
        setDesktopResults(res);
      } finally { setDesktopSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [desktopQuery, desktopMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (desktopMode !== "ingredients" || !desktopChips.length) { setDesktopResults([]); return; }
    setDesktopSearching(true);
    searchRecipes(desktopChips.join(","), "ingredients")
      .then(setDesktopResults)
      .finally(() => setDesktopSearching(false));
  }, [desktopChips, desktopMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (cachedCategory) window.history.replaceState(null, "", `/?category=${cachedCategory}`);
        else window.history.replaceState(null, "", "/");
        if (savedScroll && parseInt(savedScroll) > 0) {
          setTimeout(() => { window.scrollTo(0, parseInt(savedScroll)); sessionStorage.removeItem("scrollY"); }, 100);
        }
        setTimeout(() => {
          const savedFilterScroll = sessionStorage.getItem("filterScrollX");
          if (filterRef.current && savedFilterScroll) filterRef.current.scrollLeft = parseInt(savedFilterScroll);
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
      const result = await getRecipes({ category: activeCategory || undefined, page: nextPage, page_size: PAGE_SIZE });
      setRecipes(prev => {
        const updated = [...prev, ...result.items];
        sessionStorage.setItem("cachedRecipes", JSON.stringify(updated));
        sessionStorage.setItem("cachedPage", String(nextPage));
        sessionStorage.setItem("cachedHasMore", result.total > nextPage * PAGE_SIZE ? "1" : "0");
        return updated;
      });
      setPage(nextPage);
      setHasMore(result.total > nextPage * PAGE_SIZE);
    } finally { setLoadingMore(false); }
  }, [loadingMore, hasMore, page, activeCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleCategory = useCallback(async (category: string) => {
    sessionStorage.removeItem("scrollY");
    sessionStorage.removeItem("cachedRecipes");
    sessionStorage.removeItem("cachedPage");
    sessionStorage.removeItem("cachedHasMore");
    sessionStorage.setItem("cachedCategory", category);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    window.history.pushState(null, "", `/?${params.toString()}`);
    setActiveCategory(category);
    setPage(1);
    setLoading(true);
    try {
      const result = await getRecipes({ category: category || undefined, page: 1, page_size: PAGE_SIZE });
      setRecipes(result.items);
      setHasMore(result.total > result.items.length);
      sessionStorage.setItem("cachedRecipes", JSON.stringify(result.items));
      sessionStorage.setItem("cachedPage", "1");
      sessionStorage.setItem("cachedHasMore", result.total > result.items.length ? "1" : "0");
    } finally { setLoading(false); }
  }, []);

  return (
    <>
      <InstallBanner />
      <main className="recipe-main" style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: DESIGN.pageBg }}>
        <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", margin: 0 }}>
          Рецепты правильного питания с расчётом КБЖУ — ПП Шеф
        </h1>

        <Header />

        {/* ── МОБИЛЬНЫЕ ФИЛЬТРЫ ── */}
        <div ref={filterRef} className="filter-bar-mobile" style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", background: DESIGN.filterBg, borderBottom: `1px solid ${DESIGN.filterBorder}`, scrollbarWidth: "none", position: "sticky", top: 70, zIndex: 6, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
          {CATEGORIES.map(({ key, label, svg, svgActive }) => {
            const active = activeCategory === key;
            return (
              <div key={key} onClick={() => handleCategory(key)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 20, background: active ? DESIGN.filterActiveBg : DESIGN.filterBg, border: `1.5px solid ${DESIGN.filterBorderColor}`, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease", boxSizing: "border-box" }}>
                <Image src={active ? svg : svgActive} alt={label} width={DESIGN.filterIconSize} height={DESIGN.filterIconSize} style={{ display: "block", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, lineHeight: 1, color: active ? DESIGN.filterActiveText : DESIGN.filterInactiveText }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* ── ДЕСКТОП БАННЕР ── */}
        <div className="desktop-banner-wrapper" style={{ display: "none" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px 0" }}>
            <div style={{ borderRadius: 16, overflow: "hidden", background: "#013125", height: 240, position: "relative" }}>
              <Image src="https://media.ppchef.ru/other/banner1.png" alt="баннер" fill style={{ objectFit: "cover" }} />
            </div>
          </div>
        </div>

        {/* ── ДЕСКТОП: обёртка ── */}
        <div className="desktop-wrapper" style={{ display: "contents" }}>
          <Sidebar activeCategory={activeCategory} onCategory={handleCategory} />

          <div className="recipe-content" style={{ padding: "16px 16px 80px" }}>

            {/* Поиск под баннером */}
            <DesktopSearchBar />

            {/* Результаты поиска */}
            <div className="desktop-search-results" style={{ display: "none" }}>
              {isDesktopSearchActive && (
                <div>
                  {desktopSearching && (
                    <div style={{ textAlign: "center", padding: 40 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(1,49,37,0.1)", borderTop: "2.5px solid #013125", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                    </div>
                  )}
                  {!desktopSearching && desktopResults.length === 0 && (
                    <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
                      ничего не нашлось
                    </div>
                  )}
                  {!desktopSearching && desktopResults.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {desktopResults.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe as unknown as Recipe} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Обычная лента */}
            {!isDesktopSearchActive && (
              <>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Загрузка...</div>
                ) : recipes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
                    <div>Рецептов пока нет</div>
                  </div>
                ) : (
                  <div className="recipe-grid" style={{ display: "flex", flexDirection: "column", gap: 12, opacity: loading ? 0 : 1, transition: "opacity 0.3s ease" }}>
                    {recipes.map((recipe, index) => (
                      <Fragment key={recipe.id}>
                        <RecipeCard recipe={recipe} />
                        {index === 19 && !activeCategory && (
                          <div className="recipe-grid-full">
                            <PopularRecipes recipes={popularRecipes} />
                          </div>
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}
                <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {loadingMore && <div style={{ color: "#aaa", fontSize: 13 }}>Загружаем ещё...</div>}
                  {!hasMore && recipes.length > 0 && <div style={{ color: "#ccc", fontSize: 12 }}>Все рецепты загружены</div>}
                </div>
              </>
            )}
          </div>
        </div>

        {showScrollTop && (
          <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ position: "fixed", bottom: DESIGN.scrollBtnBottom, right: DESIGN.scrollBtnRight, width: DESIGN.scrollBtnSize, height: DESIGN.scrollBtnSize, borderRadius: "50%", background: DESIGN.scrollBtnBg, color: DESIGN.scrollBtnColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", boxShadow: "0 4px 16px rgba(79,116,83,0.4)", zIndex: 20 }}>↑</div>
        )}
      </main>
    </>
  );
}