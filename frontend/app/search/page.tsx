"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchRecipes, SearchRecipe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

const CATEGORIES: Record<string, string> = {
  breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин",
  snack: "Перекус", dessert: "Десерт", soup: "Суп",
  salad: "Салат", smoothie: "Смузи",
};

export default function SearchPage() {
  const router = useRouter();
  const { isLoggedIn, isPremium } = useAuth();
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
        setResults(res);
        setSearched(true);
      } finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, mode]);

  async function handleFridgeSearch() {
    if (!chips.length) return;
    setLoading(true);
    try {
      const res = await searchRecipes(chips.join(","), "ingredients");
      setResults(res);
      setSearched(true);
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
    if (m === "ingredients" && !isPremium) {
      requirePremium();
      return;
    }
    setMode(m);
    setQuery(""); setChips([]); setResults([]); setSearched(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const showHint = mode === "title" ? !query.trim() : chips.length === 0;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE", fontFamily: "'Montserrat', sans-serif" }}>
      {PromptComponent}

      {/* ── ШАПКА 70px ── */}
      <div style={{
        height: 70,
        background: "#01311C",
        display: "flex", alignItems: "center",
        paddingLeft: 18, paddingRight: 18,
        flexShrink: 0,
      }}>
        <div
          onClick={() => { sessionStorage.setItem("isBack", "1"); router.push("/"); }}
          style={{
            width: 175, height: 32,
            border: "1px solid #A6ED49",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, cursor: "pointer",
          }}
        >
          {/* SVG стрелка — замени путь на свой */}
          <Image src="/icons/left.svg" alt="" width={8} height={8} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{
            fontSize: 12,
            fontStyle: "italic",
            fontWeight: 400,
            fontFamily: "'Montserrat', sans-serif",
            color: "#F8FFEE",
          }}>
            вернуться к рецептам
          </span>
        </div>
      </div>

      {/* ── КОНТЕНТ ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, paddingBottom: 80 }}>

        {/* ── СДВОЕННАЯ КНОПКА 345х48 ── */}
        <div style={{
          width: 345, height: 48,
          background: "#013125",
          borderRadius: 24,
          display: "flex", alignItems: "center",
          padding: "4px",
          marginBottom: 8,
        }}>
          {/* Поиск по рецептам */}
          <div
            onClick={() => switchMode("title")}
            style={{
              flex: 1, height: "100%",
              borderRadius: 20,
              background: mode === "title" ? "#A6ED49" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{
              fontSize: 14,
              fontStyle: "italic",
              fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif",
              color: mode === "title" ? "#013125" : "#A6ED49",
            }}>
              поиск по рецептам
            </span>
          </div>

          {/* Поиск по продуктам */}
          <div
            onClick={() => switchMode("ingredients")}
            style={{
              flex: 1, height: "100%",
              borderRadius: 20,
              background: mode === "ingredients" ? "#A6ED49" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{
              fontSize: 14,
              fontStyle: "italic",
              fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif",
              color: mode === "ingredients" ? "#013125" : "#A6ED49",
            }}>
              поиск по продуктам
            </span>
          </div>
        </div>

        {/* ── ПОИСКОВАЯ СТРОКА 345х48 ── */}
        <div style={{ position: "relative", width: 345, marginBottom: 24 }}>
          {/* Иконка лупы */}
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
            {/* SVG лупа — замени путь на свой */}
            <Image src="/icons/search1.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
          </div>
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && mode === "ingredients" && query.trim()) addChip(query); }}
            placeholder={mode === "title" ? "найти рецепт" : "продукт → Enter"}
            style={{
              width: "100%", height: 48,
              border: "1px solid #013125",
              borderRadius: 24,
              paddingLeft: 46, paddingRight: 16,
              fontSize: 14,
              fontStyle: "italic",
              fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif",
              background: "#F8FFEE",
              color: "#013125",
              outline: "none",
            }}
          />
        </div>

        {/* ── ЧИПСЫ (режим холодильника) ── */}
        {mode === "ingredients" && chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: 345, marginBottom: 16 }}>
            {chips.map(chip => (
              <div key={chip} style={{
                background: "#013125", color: "#A6ED49",
                borderRadius: 20, paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 10,
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

        {/* ── КНОПКА НАЙТИ (режим холодильника) ── */}
        {mode === "ingredients" && chips.length > 0 && !searched && (
          <button onClick={handleFridgeSearch} style={{
            width: 345, height: 48,
            background: "#A6ED49", color: "#013125",
            border: "none", borderRadius: 24,
            fontSize: 14, fontStyle: "italic",
            fontFamily: "'Montserrat', sans-serif",
            cursor: "pointer", marginBottom: 16,
          }}>
            найти рецепты
          </button>
        )}

        {/* ── ПОДСКАЗКИ ── */}
        {showHint && (
          <div style={{ width: 345 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12, fontStyle: "italic", fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: "#013125", opacity: 0.7,
                marginBottom: 4,
              }}>
                что есть в холодильнике?
              </div>
              <div style={{
                fontSize: 12, fontStyle: "italic", fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: "#013125", opacity: 0.7,
                lineHeight: 1.5,
              }}>
                введите название блюда и ищите рецепт, который хотите приготовить прямо сейчас
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 12, fontStyle: "italic", fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: "#013125", opacity: 0.7,
                marginBottom: 4,
              }}>
                что приготовим?
              </div>
              <div style={{
                fontSize: 12, fontStyle: "italic", fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: "#013125", opacity: 0.8,
                lineHeight: 1.5,
              }}>
                введите продукты по порядку и ищите рецепты, которые можно приготовить прямо сейчас
              </div>
            </div>
          </div>
        )}

        {/* ── ЗАГРУЗКА ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#013125", opacity: 0.5, fontSize: 12, fontFamily: "'Montserrat', sans-serif" }}>
            Ищем...
          </div>
        )}

        {/* ── НЕТ РЕЗУЛЬТАТОВ ── */}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, width: 345 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
            <div style={{ fontSize: 12, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.5 }}>
              Ничего не нашлось
            </div>
          </div>
        )}

        {/* ── РЕЗУЛЬТАТЫ ── */}
        {!loading && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 345 }}>
            {mode === "ingredients" && (
              <div style={{ fontSize: 12, fontStyle: "italic", fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.6, marginBottom: 4 }}>
                топ рецептов по вашим продуктам
              </div>
            )}
            {results.map(recipe => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} onClick={() => sessionStorage.setItem("backTo", "/search")} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex" }}>
                  <div style={{ width: 110, flexShrink: 0, background: "linear-gradient(135deg, #e8e0d0, #d5cab8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, minHeight: 100 }}>
                    {recipe.image_url
                      ? <img src={recipe.image_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "🥗"}
                  </div>
                  <div style={{ padding: "12px 14px", flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#4F7453", fontWeight: 600, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>
                      {CATEGORIES[recipe.category] || recipe.category}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#013125", marginBottom: 6, lineHeight: 1.3, fontFamily: "'Montserrat', sans-serif" }}>
                      {recipe.title}
                    </div>
                    {recipe.match_percent !== undefined && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#E8F0E8", color: "#4F7453", borderRadius: 10, paddingTop: 3, paddingBottom: 3, paddingLeft: 8, paddingRight: 8, fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: "'Montserrat', sans-serif" }}>
                        ✓ {recipe.match_percent}% совпадение
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#aaa", fontFamily: "'Montserrat', sans-serif" }}>
                        {recipe.calories && <span><b style={{ color: "#013125" }}>{Math.round(recipe.calories)}</b> ккал</span>}
                        {recipe.protein && <span>Б <b style={{ color: "#013125" }}>{Math.round(recipe.protein)}</b></span>}
                        {recipe.fat && <span>Ж <b style={{ color: "#013125" }}>{Math.round(recipe.fat)}</b></span>}
                        {recipe.carbs && <span>У <b style={{ color: "#013125" }}>{Math.round(recipe.carbs)}</b></span>}
                      </div>
                      {showNorm && normCalories && recipe.calories && (
                        <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Montserrat', sans-serif" }}>
                          {Math.round(recipe.calories * 100 / normCalories)}% нормы
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}