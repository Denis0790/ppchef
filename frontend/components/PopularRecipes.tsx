"use client";
import Link from "next/link";
import Image from "next/image";
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
      {/* Заголовок */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        border: "1px solid #013125",
        borderRadius: 12,
        padding: "8px 12px",
        background: "#F8FFEE",
        marginBottom: 12,
      }}>
        <Image src="/icon_popular/pop.svg" alt="" width={16} height={16} />
        <span style={{
          fontSize: 12, fontStyle: "italic",
          color: "#013125", fontFamily: "'Montserrat', sans-serif",
        }}>
          Популярное
        </span>
      </div>

      {/* Карусель */}
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
                width: 150,
                height: 185,
                background: "#FFFFFF",
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}>
                {/* Фото */}
                <div style={{
                  height: 110,
                  flexShrink: 0,
                  background: "linear-gradient(135deg, #e8e0d0, #d5cab8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  position: "relative",
                }}>
                  {recipe.image_url
                    ? <Image src={recipe.image_url} alt={recipe.title} fill sizes="150px" loading="lazy" style={{ objectFit: "cover" }} />
                    : cat?.emoji || "🥗"}
                </div>

                {/* Контент */}
                <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Название */}
                  <div style={{
                    fontSize: 9,
                    fontWeight: 400,
                    color: "#013125",
                    lineHeight: 1.3,
                    marginBottom: 6,
                    fontFamily: "'Montserrat', sans-serif",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {recipe.title}
                  </div>

                  {/* Категория + калории + время в одну строку */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 6, marginTop: "auto", flexWrap: "nowrap",
                  }}>
                    {/* Категория */}
                    <div style={{
                      display: "inline-flex", alignItems: "center",
                      background: "#013125", borderRadius: 20,
                      padding: "2px 7px", flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: 7, fontStyle: "italic",
                        color: "#FFFFFF",
                        fontFamily: "'Montserrat', sans-serif",
                      }}>
                        {cat?.label || recipe.category}
                      </span>
                    </div>

                    {/* Калории */}
                    {recipe.calories && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Image src="/icon_popular/kkal.svg" alt="" width={11} height={11} />
                        <span style={{
                          fontSize: 9, color: "rgba(1,49,28,0.7)",
                          fontFamily: "'Montserrat', sans-serif",
                        }}>
                          {Math.round(recipe.calories)}
                        </span>
                      </div>
                    )}

                    {/* Время */}
                    {recipe.cook_time_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Image src="/icon_popular/clock.svg" alt="" width={11} height={11} />
                        <span style={{
                          fontSize: 9, color: "rgba(1,49,28,0.7)",
                          fontFamily: "'Montserrat', sans-serif",
                        }}>
                          {recipe.cook_time_minutes}м
                        </span>
                      </div>
                    )}
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