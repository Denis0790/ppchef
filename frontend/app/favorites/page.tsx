"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getFavorites, Recipe } from "@/lib/api";
import Link from "next/link";

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
  const { token, isLoggedIn } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }
    getFavorites(token!).then(data => {
      setRecipes(data);
    }).finally(() => setLoading(false));
  }, [isLoggedIn, token, router]);

  function handleCardClick() {
    sessionStorage.setItem("backTo", "/favorites");
  }

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#F5F0E8",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Шапка */}
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
          Сохранённые рецепты
        </div>
      </div>

      <div style={{ padding: "16px 16px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
            Загрузка...
          </div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
            <div style={{ marginBottom: 8 }}>Пока нет избранных рецептов</div>
            <div
              onClick={() => router.push("/")}
              style={{ color: "#4F7453", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              Перейти к рецептам →
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recipes.map(recipe => {
              const emoji = CATEGORIES.find(c => c.key === recipe.category)?.emoji || "🥗";
              const label = CATEGORIES.find(c => c.key === recipe.category)?.label || recipe.category;
              return (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  onClick={handleCardClick}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#fff", borderRadius: 16,
                    overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                    cursor: "pointer",
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
                      <div style={{
                        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 6,
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
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Нижняя навигация */}
      <div style={{
        position: "fixed", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#fff", borderTop: "1px solid #ece7de",
        display: "flex", justifyContent: "space-around",
        padding: "10px 0 20px",
      }}>
        {[
          { icon: "🏠", label: "Главная", href: "/" },
          { icon: "🔍", label: "Поиск", href: "/search" },
          { icon: "❤️", label: "Избранное", href: "/favorites", active: true },
          { icon: "📊", label: "КБЖУ", href: "/kbju" },
        ].map(({ icon, label, href, active }) => (
          <div key={label} onClick={() => router.push(href)} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, cursor: "pointer",
          }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontSize: 10, color: active ? "#4F7453" : "#888", fontWeight: active ? 600 : 400 }}>{label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}