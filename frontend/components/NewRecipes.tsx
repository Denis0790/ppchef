"use client";
import Link from "next/link";
import Image from "next/image";
import { Recipe } from "@/lib/api";
import { useRef, useEffect } from "react";

const CATEGORIES: Record<string, { label: string }> = {
  breakfast: { label: "завтрак" },
  lunch: { label: "обед" },
  dinner: { label: "ужин" },
  snack: { label: "перекус" },
  dessert: { label: "десерт" },
  salad: { label: "салат" },
  smoothie: { label: "смузи" },
};

export default function NewRecipes({ recipes }: { recipes: Recipe[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); el.scrollLeft += e.deltaY; };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  if (!recipes.length) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        border: "1px solid #A6ED49",
        borderRadius: 20,
        height: 32,
        padding: "0 12px",
        background: "#F8FFEE",
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 12, fontStyle: "italic", fontWeight: 400,
          color: "#013125", fontFamily: "'Montserrat', sans-serif",
        }}>
          новое сегодня
        </span>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 4,
        }}
      >
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
                border: "1.5px solid #A6ED49",
              }}>
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
                    ? <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        sizes="150px"
                        quality={70}
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      />
                    : "🥗"}
                </div>

                <div style={{ padding: "9px 11px 4px", display: "flex", flexDirection: "column", flex: 1 }}>
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

                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 6, marginTop: "auto", flexWrap: "nowrap",
                  }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center",
                      background: "#013125", borderRadius: 20,
                      height: 18, padding: "5px 8px", flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: 7, fontStyle: "italic",
                        color: "#FFFFFF", fontFamily: "'Montserrat', sans-serif",
                      }}>
                        {cat?.label || recipe.category}
                      </span>
                    </div>

                    {recipe.calories && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Image src="/icon_popular/kkal.svg" alt="" width={11} height={11} />
                        <span style={{
                          fontSize: 9, color: "#013125", opacity: 0.7,
                          fontFamily: "'Montserrat', sans-serif",
                        }}>
                          {Math.round(recipe.calories)}
                        </span>
                      </div>
                    )}

                    {recipe.cook_time_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <Image src="/icon_popular/clock.svg" alt="" width={11} height={11} />
                        <span style={{
                          fontSize: 9, color: "#013125", opacity: 0.7,
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