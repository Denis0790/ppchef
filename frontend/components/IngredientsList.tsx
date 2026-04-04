"use client";
import { useState } from "react";

interface Ingredient {
  id: string;
  name: string;
  amount: string | null;
}

export default function IngredientsList({ ingredients }: { ingredients: Ingredient[] }) {
  const [stopWords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("userNorm");
      if (!raw) return [];
      const norm = JSON.parse(raw);
      if (!norm.stop_words) return [];
      return norm.stop_words.toLowerCase().split(",").map((s: string) => s.trim()).filter(Boolean);
    } catch { return []; }
  });

  function isStop(name: string) {
    return stopWords.some(stop => name.toLowerCase().includes(stop));
  }

  return (
    <>
      {ingredients.map((ing, i) => {
        const stop = isStop(ing.name);
        return (
          <div key={ing.id} suppressHydrationWarning style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: i < ingredients.length - 1 ? "1px solid #A6ED49" : "none",
            background: stop ? "rgba(224,85,85,0.04)" : "transparent",
            borderRadius: stop ? 8 : 0,
            paddingLeft: stop ? 8 : 0,
            paddingRight: stop ? 8 : 0,
          }}>
            <span suppressHydrationWarning style={{
              fontSize: 11, fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif",
              color: stop ? "rgba(224,85,85,0.7)" : "#013125",
            }}>
              <span suppressHydrationWarning style={{
                marginRight: 4,
                display: stop ? "inline" : "none",
              }}>🚫</span>
              {ing.name}
            </span>
            {ing.amount && (
              <span suppressHydrationWarning style={{
                fontSize: 11, fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: stop ? "rgba(224,85,85,0.5)" : "#013125",
                opacity: stop ? 1 : 0.6,
              }}>
                {ing.amount}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}