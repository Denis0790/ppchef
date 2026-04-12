"use client";
import { useState } from "react";
import Image from "next/image";

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
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 0,
            paddingRight: 0,
            borderBottom: i < ingredients.length - 1 ? "1px solid #A6ED49" : "none",
            background: "transparent",
            borderRadius: 0,
          }}>
            <span suppressHydrationWarning style={{
              fontSize: 11, fontWeight: 400,
              fontFamily: "'Montserrat', sans-serif",
              color: stop ? "#F87045" : "#013125",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {stop && (
                <Image
                  src="/icons/stop.svg"
                  alt=""
                  width={16}
                  height={16}
                  style={{ objectFit: "contain", flexShrink: 0 }}
                />
              )}
              {ing.name}
            </span>
            {ing.amount && (
              <span suppressHydrationWarning style={{
                fontSize: 12, fontWeight: 400,
                fontFamily: "'Montserrat', sans-serif",
                color: stop ? "#F87045" : "#013125",
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