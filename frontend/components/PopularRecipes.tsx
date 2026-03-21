"use client";
import Link from "next/link";
import { Recipe } from "@/lib/api";

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "Завтрак", emoji: "🌅" },
  lunch: { label: "Обед", emoji: "🥗" },
  dinner: { label: "Ужин", emoji: "🍽️" },
  snack: { label: "Перекус", emoji: "🥜" },
  dessert: { label: "Десерт", emoji: "🍓" },
  soup: { label: "Суп", emoji: "🍲" },
  salad: { label: "Салат", emoji: "🥙" },
  smoothie: { label: "Смузи", emoji: "🥤" },
};

export default function PopularRecipes({ recipes }: { recipes: Recipe[] }) {
  if (!recipes.length) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 18, fontWeight: 700, color: "#333",
        fontFamily: "'Cormorant Garamond', serif",
        padding: "0 0 12px 0",
      }}>
        🔥 Популярное
      </div>

      <div style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        scrollbarWidth: "none",
        paddingBottom: 4,
      }}>
        {recipes.map((recipe) => {
          const cat = CATEGORIES[recipe.category];
          return (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{ textDecoration: "none", flexShrink: 0 }}
            >
              <div style={{
                width: 160,
                background: "#fff",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}>
                {/* Фото */}
                <div style={{
                  height: 110,
                  background: "linear-gradient(135deg, #e8e0d0, #d5cab8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  position: "relative",
                }}>
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt={recipe.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : cat?.emoji || "🥗"}
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    background: "#4F7453", color: "#fff",
                    fontSize: 9, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 20,
                  }}>
                    {cat?.label || recipe.category}
                  </div>
                </div>

                {/* Контент */}
                <div style={{ padding: "10px 10px 12px" }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "#333",
                    lineHeight: 1.3, marginBottom: 6,
                    fontFamily: "'Cormorant Garamond', serif",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {recipe.title}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#888" }}>
                    {recipe.calories && <span>🔥 {Math.round(recipe.calories)}</span>}
                    {recipe.cook_time_minutes && <span>⏱ {recipe.cook_time_minutes}м</span>}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}