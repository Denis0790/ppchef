"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getFavorites, Recipe } from "@/lib/api";
import Link from "next/link";

const CACHE_KEY = "favorites_cache";

const CATEGORIES = [
  { key: "breakfast", label: "Завтрак", emoji: "🌅" },
  { key: "lunch", label: "Обед", emoji: "🥗" },
  { key: "dinner", label: "Ужин", emoji: "🍽️" },
  { key: "snack", label: "Перекус", emoji: "🥜" },
  { key: "dessert", label: "Десерт", emoji: "🍓" },
  { key: "soup", label: "Суп", emoji: "🍲" },
  { key: "salad", label: "Салат", emoji: "🥙" },
  { key: "smoothie", label: "Смузи", emoji: "🥤" },
];

export default function FavoritesPage() {
  const router = useRouter();
  const { token, isLoggedIn, isReady } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [fromCache, setFromCache] = useState(() => {
    try { return !!localStorage.getItem(CACHE_KEY); } catch {}
    return false;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      // Небольшая задержка — на случай если токен ещё обновляется
      const t = setTimeout(() => router.push("/auth"), 300);
      return () => clearTimeout(t);
    }

    getFavorites(token!)
      .then(data => {
        setRecipes(data);
        setFromCache(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  }, [isReady, isLoggedIn, token, router]);

  function handleCardClick() {
    sessionStorage.setItem("backTo", "/favorites");
  }

  if (!isReady) return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F5F0E8", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #ece7de",
        borderTop: "3px solid #01311C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#F5F0E8",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        padding: "20px 20px 16px", background: "#fff",
        borderBottom: "1px solid #ece7de",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 700, color: "#4F7453",
        }}>
          ❤️ Избранное
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          {fromCache ? "Сохранённые рецепты · из кэша" : "Сохранённые рецепты"}
        </div>
      </div>

      <div style={{ padding: "16px 16px 80px" }}>
        {loading && recipes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Загрузка...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
            <div style={{ marginBottom: 8 }}>Пока нет избранных рецептов</div>
            <div onClick={() => router.push("/")}
              style={{ color: "#4F7453", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Перейти к рецептам →
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recipes.map(recipe => {
              const emoji = CATEGORIES.find(c => c.key === recipe.category)?.emoji || "🥗";
              const label = CATEGORIES.find(c => c.key === recipe.category)?.label || recipe.category;
              return (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}
                  onClick={handleCardClick} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff", borderRadius: 16,
                    overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                  }}>
                    <div style={{
                      height: 160,
                      background: "linear-gradient(135deg, #e8e0d0 0%, #d5cab8 100%)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 56, position: "relative",
                    }}>
                      {recipe.image_url
                        ? <img src={recipe.image_url} alt={recipe.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : emoji}
                      <div style={{
                        position: "absolute", top: 12, left: 12,
                        background: "#4F7453", color: "#fff",
                        fontSize: 11, fontWeight: 600,
                        padding: "4px 10px", borderRadius: 20,
                      }}>
                        {label}
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div style={{
                        fontSize: 17, fontWeight: 600, color: "#333", marginBottom: 10,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}>
                        {recipe.title}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
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
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}