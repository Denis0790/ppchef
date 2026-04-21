"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getFavorites, Recipe } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import AuthPrompt from "@/components/AuthPrompt";
import FavoriteButton from "@/components/FavoriteButton";

const CACHE_KEY = "favorites_cache";

const CATEGORIES = [
  { key: "",          label: "все",     svg: "/icon_filter/vse.svg",     svgActive: "/icon_filter/vse2.svg"     },
  { key: "breakfast", label: "завтрак", svg: "/icon_filter/zavtrak.svg", svgActive: "/icon_filter/zavtrak2.svg" },
  { key: "lunch",     label: "обед",    svg: "/icon_filter/obed.svg",    svgActive: "/icon_filter/obed2.svg"    },
  { key: "dinner",    label: "ужин",    svg: "/icon_filter/ujin.svg",    svgActive: "/icon_filter/ujin2.svg"    },
  { key: "snack",     label: "перекус", svg: "/icon_filter/perekus.svg", svgActive: "/icon_filter/perekus2.svg" },
  { key: "dessert",   label: "десерт",  svg: "/icon_filter/desert.svg",  svgActive: "/icon_filter/desert2.svg"  },
  { key: "salad",     label: "салат",   svg: "/icon_filter/salat.svg",   svgActive: "/icon_filter/salat2.svg"   },
  { key: "smoothie",  label: "смузи",   svg: "/icon_filter/smuzy.svg",   svgActive: "/icon_filter/smuzy2.svg"   },
];

/* ── Карточка рецепта — 1 в 1 как на главной ─────────────────────────────── */
function RecipeCard({ recipe }: { recipe: Recipe }) {
  const label = CATEGORIES.find(c => c.key === recipe.category)?.label || recipe.category;
  const emoji = CATEGORIES.find(c => c.key === recipe.category)?.svgActive || "🥗";

  function handleClick() {
    sessionStorage.setItem("backTo", "/favorites");
    sessionStorage.setItem("isBack", "1");
  }

  return (
    <Link href={`/recipes/${recipe.id}`} onClick={handleClick} style={{ textDecoration: "none" }}>
      <div style={{
        background: "#F8FFEE",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        cursor: "pointer",
      }}>

        {/* ── ФОТО ── */}
        <div style={{
          height: 180,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #e8e0d0 0%, #d5cab8 100%)",
        }}>
          {recipe.image_url
            ? <Image src={recipe.image_url} alt={recipe.title} fill sizes="480px" style={{ objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>{emoji}</div>
          }
        </div>

        {/* ── КОНТЕНТ ── */}
        <div style={{ padding: "11px 0 14px 0", display: "flex", alignItems: "flex-start" }}>

          {/* Левая колонка */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 21 }}>

            {/* Бейдж + избранное */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
              <div style={{
                width: 52, height: 25, borderRadius: 100,
                background: "#01311C",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 9, color: "#F8FFEE", lineHeight: 1, whiteSpace: "nowrap", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
                  {label}
                </span>
              </div>
              <FavoriteButton recipeId={recipe.id} variant="card" />
            </div>

            {/* Название */}
            <div style={{
              fontSize: 14, lineHeight: 1.3, color: "#133520",
              marginBottom: 7, maxWidth: 225,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {recipe.title}
            </div>

            {/* Мета */}
            <div style={{
              display: "flex", alignItems: "center",
              flexWrap: "wrap", gap: "2px 12px",
              fontSize: 11, color: "#888",
              fontFamily: "'Montserrat', sans-serif",
              fontStyle: "italic",
            }}>
              {recipe.cook_time_minutes && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <img src="/icons/chasi.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.cook_time_minutes} мин
                </span>
              )}
              {recipe.servings && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <img src="/icons/vilki.svg" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                  {recipe.servings} порц.
                </span>
              )}
            </div>
          </div>

          {/* Правая колонка — КБЖУ */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 4,
            flexShrink: 0, width: 86, marginRight: 20,
          }}>
            {[
              { label: "ккал",     value: recipe.calories },
              { label: "белки",    value: recipe.protein  },
              { label: "жиры",     value: recipe.fat      },
              { label: "углеводы", value: recipe.carbs    },
            ].map(({ label, value }) => (
              <div key={label} style={{
                width: 83, height: 19,
                border: "1px solid #A6ED49",
                borderRadius: 12,
                background: "#F8FFEE",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 3,
                overflow: "hidden",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#01311C", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {value ? Math.round(value) : "—"}
                </span>
                <span style={{ fontSize: 10, color: "#01311C", lineHeight: 1, whiteSpace: "nowrap", opacity: 0.75 }}>
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

export default function FavoritesPage() {
  const router = useRouter();
  const { token, isLoggedIn, isReady } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      const t = setTimeout(() => { setShowAuthPrompt(true); setLoading(false); }, 0);
      return () => clearTimeout(t);
    }
    getFavorites(token!)
      .then(data => {
        setRecipes(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isReady, isLoggedIn, token, router]);

  if (!isReady || (loading && recipes.length === 0)) return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(1,49,37,0.1)", borderTop: "3px solid #013125", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F8FFEE" }}>

      {/* ── ШАПКА ──────────────────────────────────────────────────────────────
          Высота: 71px | Фон: #013125 | Padding: 0 15px
          Левая: стрелка + "вернуться к рецептам" #F8FFEE italic 12
          Правая: SVG заглушка + "premium" #F8FFEE italic 12
          Обе: высота 32px, бордер 1.4px #A6ED49, border-radius 100px
          TODO: иконка стрелки — /icon_profile/left1.svg
          TODO: иконка premium — /icon_kbju/premium.svg
      ───────────────────────────────────────────────────────────────────────── */}
      <div style={{
        height: 71, padding: "0 15px", background: "#013125",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div onClick={() => router.push("/")} style={{ height: 32, border: "1.4px solid #A6ED49", borderRadius: 100, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", cursor: "pointer" }}>
          <img src="/icon_profile/left1.svg" alt="" width={8} height={8} style={{ objectFit: "contain" }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, color: "#F8FFEE", whiteSpace: "nowrap" }}>
            вернуться к рецептам
          </span>
        </div>
      </div>

      {showAuthPrompt && <AuthPrompt type="auth" onClose={() => router.push("/")} />}

      <div style={{ padding: "16px 16px 80px" }}>
        {recipes.length === 0 && !showAuthPrompt ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: "#013125", opacity: 0.5, marginBottom: 12 }}>
              пока нет избранных рецептов
            </div>
            <div onClick={() => router.push("/")} style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#013125", cursor: "pointer", textDecoration: "underline" }}>
              перейти к рецептам →
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

    </main>
  );
}