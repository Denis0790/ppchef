"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchRecipes, SearchRecipe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

const CATEGORIES: Record<string, string> = {
  breakfast: "завтрак", lunch: "обед", dinner: "ужин",
  snack: "перекус", dessert: "десерт", soup: "суп",
  salad: "салат", smoothie: "смузи",
};

const pageStyles = `
  .search-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
  }
  .search-tab-line {
    width: 60%;
    height: 2px;
    background: transparent;
    border-radius: 2px;
    transition: background 0.2s;
  }
  .search-tab.active .search-tab-line {
    background: #A6ED49;
  }
  .search-tab-text {
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-weight: 500;
    font-size: 14px;
    color: #013125;
    transition: opacity 0.2s;
    padding: 10px 0 8px 0;
  }
  .search-tab.active .search-tab-text { opacity: 1; }
  .search-tab:not(.active) .search-tab-text { opacity: 0.4; }

  .search-input {
    width: 100%;
    height: 48px;
    border: 1.4px solid #013125;
    border-radius: 100px;
    padding-left: 46px;
    padding-right: 16px;
    font-size: 13px;
    font-style: italic;
    font-family: 'Montserrat', sans-serif;
    background: #F8FFEE;
    color: #013125;
    outline: none;
  }
  .search-input::placeholder { color: rgba(1,49,37,0.35); }

  @keyframes search-spin { to { transform: rotate(360deg); } }
`;

/* ── Карточка результата поиска ──────────────────────────────────────────────
   Горизонтальная | Высота: 136px | Фото: 140px слева
   Бейдж: 38×18px #01311C italic 9px
   Название: Montserrat regular 12px #133520
   % нормы: 10px opacity 0.5 — если нет стоп-слов сразу под названием, если есть — под ними
   Нежелательные: оранжевый 10px opacity 0.7
   Совпадение: 10px opacity 0.7
   КБЖУ: 2×2, высота 20px, border-radius 100px, бордер #A6ED49, gap 5px
   Значение: bold 9px | Подпись: regular 9px opacity 0.6
────────────────────────────────────────────────────────────────────────────── */
function SearchCard({ recipe, normCalories, showNorm }: {
  recipe: SearchRecipe;
  normCalories: number | null;
  showNorm: boolean;
}) {
  const label = CATEGORIES[recipe.category] || recipe.category;
  const [hasStopWords, setHasStopWords] = useState(false);
  const normPercent = showNorm && normCalories && recipe.calories
    ? Math.round(recipe.calories * 100 / normCalories)
    : null;

  useEffect(() => {
    setTimeout(() => {
      try {
        const raw = localStorage.getItem("userNorm");
        if (!raw) return;
        const norm = JSON.parse(raw);
        if (norm.stop_words) {
          const stops = norm.stop_words.toLowerCase().split(",").map((s: string) => s.trim()).filter(Boolean);
          const ingredientNames = (recipe as SearchRecipe & { ingredient_names?: string[] }).ingredient_names;
          if (stops.length && ingredientNames?.length) {
            const found = ingredientNames.some((ing: string) =>
              stops.some((stop: string) => ing.toLowerCase().includes(stop))
            );
            setHasStopWords(found);
          }
        }
      } catch {}
    }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Link href={`/recipes/${recipe.id}`} onClick={() => sessionStorage.setItem("backTo", "/search")} style={{ textDecoration: "none" }}>
      <div style={{
        minHeight: 136,
        background: "#F8FFEE",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        display: "flex",
      }}>

        {/* Фото 140px слева */}
        <div style={{
          width: 140, flexShrink: 0,
          background: "linear-gradient(135deg, #e8e0d0, #d5cab8)",
          position: "relative", overflow: "hidden",
        }}>
          {recipe.image_url
            ? <Image src={recipe.image_url} alt={recipe.title} fill style={{ objectFit: "cover" }} sizes="140px" />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🥗</div>
          }
        </div>


        {/* Контент справа */}
          <div style={{ flex: 1, padding: "10px 10px 10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>

          <div>
            {/* Бейдж категории */}
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 18, borderRadius: 100,
              background: "#01311C", marginBottom: 6,
            }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 9, color: "#F8FFEE", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>

            {/* Название */}
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400, fontSize: 12,
              color: "#133520", lineHeight: 1.3,
              marginBottom: 4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {recipe.title}
            </div>

            {/* % нормы — если нет стоп-слов */}
            {normPercent !== null && !hasStopWords && (
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 10, color: "#013125", opacity: 0.5, marginBottom: 4 }}>
                {normPercent}% нормы
              </div>
            )}

            {/* Нежелательные ингредиенты */}
            {hasStopWords && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                {/* TODO: <img src="/icons/stop.svg" alt="" width={12} height={12} /> */}
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 10, color: "#F87045", opacity: 0.7 }}>
                  нежелательные ингредиенты
                </span>
              </div>
            )}

            {/* % нормы под нежелательными */}
            {normPercent !== null && hasStopWords && (
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 10, color: "#013125", opacity: 0.5, marginBottom: 4 }}>
                {normPercent}% нормы
              </div>
            )}

            {/* Совпадение по ингредиентам */}
            {recipe.match_percent !== undefined && (
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 10, color: "#013125", opacity: 0.7 }}>
                ✓ {recipe.match_percent}% совпадение
              </div>
            )}
          </div>

          {/* КБЖУ 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {[
              { label: "ккал",     value: recipe.calories },
              { label: "жиры",     value: recipe.fat      },
              { label: "белки",    value: recipe.protein  },
              { label: "углеводы", value: recipe.carbs    },
            ].map(({ label, value }) => (
              <div key={label} style={{
                height: 20,
                border: "1px solid #A6ED49",
                borderRadius: 100,
                background: "#F8FFEE",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 3,
                overflow: "hidden",
              }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 9, color: "#013125", whiteSpace: "nowrap" }}>
                  {value ? Math.round(value) : "—"}
                </span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 9, color: "#013125", opacity: 0.6, whiteSpace: "nowrap" }}>
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

export default function SearchPage() {
  const router = useRouter();
  const { isPremium } = useAuth();
  const [mode, setMode] = useState<"title" | "ingredients">("title");
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [results, setResults] = useState<SearchRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [normCalories, setNormCalories] = useState<number | null>(null);
  const [showNorm, setShowNorm] = useState(false);
  const { requirePremium, PromptComponent } = useAuthPrompt();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("userNorm");
      if (!raw) return;
      const norm = JSON.parse(raw);
      if (norm.show && norm.calories) { setNormCalories(norm.calories); setShowNorm(true); }
    } catch {}
  }, []);

  useEffect(() => {
    const savedMode = sessionStorage.getItem("searchMode") as "title" | "ingredients" | null;
    const savedQuery = sessionStorage.getItem("searchQuery");
    const savedChips = sessionStorage.getItem("searchChips");
    const savedResults = sessionStorage.getItem("searchResults");
    if (savedMode) setMode(savedMode);
    if (savedQuery) setQuery(savedQuery);
    if (savedChips) setChips(JSON.parse(savedChips));
    if (savedResults) { setResults(JSON.parse(savedResults)); setSearched(true); }
  }, []);

  useEffect(() => { sessionStorage.setItem("searchMode", mode); }, [mode]);
  useEffect(() => { sessionStorage.setItem("searchQuery", query); }, [query]);
  useEffect(() => { sessionStorage.setItem("searchChips", JSON.stringify(chips)); }, [chips]);
  useEffect(() => {
    if (results.length > 0) sessionStorage.setItem("searchResults", JSON.stringify(results));
    else sessionStorage.removeItem("searchResults");
  }, [results]);

  useEffect(() => {
    if (mode !== "title") return;
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchRecipes(query.trim(), "title");
        setResults(res); setSearched(true);
      } finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, mode]);

  async function handleFridgeSearch() {
    if (!chips.length) return;
    setLoading(true);
    try {
      const res = await searchRecipes(chips.join(","), "ingredients");
      setResults(res); setSearched(true);
    } finally { setLoading(false); }
  }

  function addChip(value: string) {
    const v = value.trim();
    if (!v || chips.includes(v)) return;
    setChips(prev => [...prev, v]);
    setQuery(""); setResults([]); setSearched(false);
  }

  function removeChip(name: string) {
    setChips(prev => prev.filter(c => c !== name));
    setResults([]); setSearched(false);
  }

  function switchMode(m: "title" | "ingredients") {
    if (m === "ingredients" && !isPremium) { requirePremium(); return; }
    setMode(m);
    setQuery(""); setChips([]); setResults([]); setSearched(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const showHint = mode === "title" ? !query.trim() : chips.length === 0;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE" }}>
      <style>{pageStyles}</style>
      {PromptComponent}

      {/* ── ШАПКА 71px ─────────────────────────────────────────────────────────
          Фон: #013125 | Padding: 0 15px
          Левая: стрелка + "вернуться к рецептам" italic 12px #F8FFEE
          Правая: SVG + "premium" italic 12px #F8FFEE
          Обе: высота 32px, бордер 1.4px #A6ED49, border-radius 100px
          TODO: стрелка — /icon_profile/left1.svg
          TODO: premium — /icon_kbju/premium.svg
      ───────────────────────────────────────────────────────────────────────── */}
      <div style={{
        height: 71, padding: "0 15px", background: "#013125",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div onClick={() => { sessionStorage.setItem("isBack", "1"); router.push("/"); }}
          style={{ height: 32, border: "1.4px solid #A6ED49", borderRadius: 100, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", cursor: "pointer" }}>
          <img src="/icon_profile/left1.svg" alt="" width={8} height={8} style={{ objectFit: "contain" }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#F8FFEE", whiteSpace: "nowrap" }}>
            вернуться к рецептам
          </span>
        </div>
        
      </div>

      <div style={{ display: "flex", flexDirection: "column", paddingTop: 18, paddingBottom: 80, gap: 18 }}>

        {/* ── ТАБЫ — полоска 2px #A6ED49 сверху над активным ─────────────────
            Текст: Montserrat italic 13px #013125
            Активный: opacity 1 | Неактивный: opacity 0.4
            Без серой линии снизу
        ───────────────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", padding: "0 15px" }}>
          <div className={`search-tab${mode === "title" ? " active" : ""}`} onClick={() => switchMode("title")}>
            <div className="search-tab-line" />
            <span className="search-tab-text">поиск по рецептам</span>
          </div>
          <div className={`search-tab${mode === "ingredients" ? " active" : ""}`} onClick={() => switchMode("ingredients")}>
            <div className="search-tab-line" />
            <span className="search-tab-text">поиск по продуктам</span>
          </div>
        </div>

        {/* ── ПОИСКОВАЯ СТРОКА ─────────────────────────────────────────────── */}
        <div style={{ position: "relative", padding: "0 15px", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: "calc(50% - 172px + 16px)", top: "50%", transform: "translateY(-50%)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(1,49,37,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && mode === "ingredients" && query.trim()) addChip(query); }}
          placeholder={mode === "title" ? "найти рецепт" : "продукт → Enter"}
          className="search-input"
          style={{ width: 345 }}
        />
      </div>

        {/* ── ЧИПСЫ ────────────────────────────────────────────────────────── */}
        {mode === "ingredients" && chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 15px" }}>
            {chips.map(chip => (
              <div key={chip} style={{
                background: "#013125", color: "#A6ED49",
                borderRadius: 100, padding: "5px 10px 5px 14px",
                fontSize: 12, fontFamily: "'Montserrat', sans-serif",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {chip}
                <button onClick={() => removeChip(chip)} style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(166,237,73,0.2)", border: "none",
                  cursor: "pointer", color: "#A6ED49", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* ── КНОПКА НАЙТИ ─────────────────────────────────────────────────── */}
        {mode === "ingredients" && chips.length > 0 && !searched && (
          <div style={{ padding: "0 15px" }}>
            <button onClick={handleFridgeSearch} style={{
              width: "100%", height: 48,
              background: "#013125", color: "#A6ED49",
              border: "none", borderRadius: 100,
              fontSize: 13, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
            }}>
              найти рецепты
            </button>
          </div>
        )}

        {/* ── ПОДСКАЗКИ ────────────────────────────────────────────────────── */}
        {showHint && !loading && (
          <div style={{ padding: "0 15px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", opacity: 0.7, marginBottom: 4 }}>
                поиск по рецептам
              </div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", opacity: 0.7, lineHeight: 1.5 }}>
                введите название блюда и ищите рецепт, который хотите приготовить прямо сейчас
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", opacity: 0.7, marginBottom: 4 }}>
                поиск по продуктам
              </div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", opacity: 0.8, lineHeight: 1.5 }}>
                введите продукты по порядку и ищите рецепты, которые можно приготовить прямо сейчас
              </div>
            </div>
          </div>
        )}

        {/* ── ЗАГРУЗКА ─────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(1,49,37,0.1)", borderTop: "2.5px solid #013125", animation: "search-spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* ── НЕТ РЕЗУЛЬТАТОВ ──────────────────────────────────────────────── */}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", opacity: 0.5 }}>
              ничего не нашлось
            </div>
          </div>
        )}

        {/* ── РЕЗУЛЬТАТЫ ───────────────────────────────────────────────────── */}
        {!loading && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 385, margin: "0 auto" }}>
            {mode === "ingredients" && (
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#013125", opacity: 0.6 }}>
                топ рецептов по вашим продуктам
              </div>
            )}
            {results.map(recipe => (
              <SearchCard
                key={recipe.id}
                recipe={recipe}
                normCalories={normCalories}
                showNorm={showNorm}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}