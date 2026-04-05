"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8" }}>
      {PromptComponent}

      {/* Шапка */}
      <div style={{
        padding: "16px 20px", background: "#fff",
        borderBottom: "1px solid #ece7de",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={() => { sessionStorage.setItem("isBack", "1"); router.push("/"); }} style={{
          width: 36, height: 36, borderRadius: "50%", background: "#F5F0E8",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 18,
        }}>←</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#4F7453" }}>Поиск</div>
      </div>

      {/* Строка поиска + переключатель */}
      <div style={{ background: "#fff", padding: "14px 16px", borderBottom: "1px solid #ece7de" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#aaa" }}>🔍</span>
            <input ref={inputRef} autoFocus value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && mode === "ingredients" && query.trim()) addChip(query); }}
              placeholder={mode === "title" ? "Название рецепта..." : "Продукт → Enter..."}
              style={{ width: "100%", height: 44, border: "1.5px solid #ece7de", borderRadius: 12, padding: "0 12px 0 38px", fontSize: 15, fontFamily: "inherit", background: "#F5F0E8", outline: "none", color: "#333" }}
              onFocus={e => e.target.style.borderColor = "#4F7453"}
              onBlur={e => e.target.style.borderColor = "#ece7de"} />
          </div>

          <div style={{ display: "flex", background: "#F5F0E8", border: "1.5px solid #ece7de", borderRadius: 12, padding: 3, gap: 2, flexShrink: 0 }}>
            {[
              { key: "title", label: "По\nназванию" },
              { key: "ingredients", label: "🧊\nХолодильник" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => switchMode(key as "title" | "ingredients")} style={{
                padding: "6px 10px", borderRadius: 9, border: "none",
                cursor: "pointer", fontSize: 11, fontWeight: 500,
                whiteSpace: "pre", textAlign: "center", lineHeight: 1.4,
                background: mode === key ? "#4F7453" : "transparent",
                color: mode === key ? "#fff" : "#888",
                transition: "all 0.2s",
                position: "relative",
              }}>
                {label}
                {key === "ingredients" && !isPremium && (
                  <span style={{ position: "absolute", top: -4, right: -4, background: "#C4975A", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 6 }}>PRO</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {mode === "ingredients" && chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {chips.map(chip => (
              <div key={chip} style={{ background: "#4F7453", color: "#fff", borderRadius: 20, padding: "5px 10px 5px 14px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                {chip}
                <button onClick={() => removeChip(chip)} style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Контент */}
      <div style={{ padding: "16px 16px 80px" }}>
        {showHint && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{mode === "title" ? "🔍" : "🧊"}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 8 }}>
              {mode === "title" ? "Найдите рецепт" : "Что есть в холодильнике?"}
            </div>
            <div style={{ fontSize: 14, color: "#888", lineHeight: 1.6 }}>
              {mode === "title"
                ? "Введите название блюда или ингредиент — найдём подходящие ПП рецепты"
                : "Вводите продукты по одному и нажимайте Enter — подберём рецепты которые можно приготовить прямо сейчас"}
            </div>
          </div>
        )}

        {mode === "ingredients" && chips.length > 0 && !searched && (
          <button onClick={handleFridgeSearch} style={{ width: "100%", height: 50, background: "#4F7453", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
            🔍 Найти рецепты
          </button>
        )}

        {loading && <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Ищем...</div>}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
            <div>Ничего не нашлось</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "ingredients" && <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Топ рецептов по вашим продуктам</div>}
            {results.map(recipe => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} onClick={() => sessionStorage.setItem("backTo", "/search")} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex" }}>
                  <div style={{ width: 110, flexShrink: 0, background: "linear-gradient(135deg, #e8e0d0, #d5cab8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, minHeight: 100 }}>
                    {recipe.image_url ? <img src={recipe.image_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🥗"}
                  </div>
                  <div style={{ padding: "12px 14px", flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#4F7453", fontWeight: 600, marginBottom: 4 }}>{CATEGORIES[recipe.category] || recipe.category}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#333", marginBottom: 6, lineHeight: 1.3 }}>{recipe.title}</div>
                    {recipe.match_percent !== undefined && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#E8F0E8", color: "#4F7453", borderRadius: 10, padding: "3px 8px", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                        ✓ {recipe.match_percent}% совпадение
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#aaa" }}>
                        {recipe.calories && <span><b style={{ color: "#4F7453" }}>{Math.round(recipe.calories)}</b> ккал</span>}
                        {recipe.protein && <span>Б <b style={{ color: "#4F7453" }}>{Math.round(recipe.protein)}</b></span>}
                        {recipe.fat && <span>Ж <b style={{ color: "#4F7453" }}>{Math.round(recipe.fat)}</b></span>}
                        {recipe.carbs && <span>У <b style={{ color: "#4F7453" }}>{Math.round(recipe.carbs)}</b></span>}
                      </div>
                      {showNorm && normCalories && recipe.calories && (
                        <span style={{ fontSize: 11, color: "#aaa" }}>{Math.round(recipe.calories * 100 / normCalories)}% нормы</span>
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