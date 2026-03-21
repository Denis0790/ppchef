"use client";
import { useState } from "react";

interface Props {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export default function KbjuBlock({ calories, protein, fat, carbs }: Props) {
  const [normPercent] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("userNorm");
      if (!raw) return null;
      const norm = JSON.parse(raw);
      if (!norm.show || !norm.calories || !calories) return null;
      return Math.round(calories * 100 / norm.calories);
    } catch { return null; }
  });

  return (
    <>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8, marginBottom: 24,
      }}>
        {[
          { label: "Ккал", value: calories },
          { label: "Белки", value: protein },
          { label: "Жиры", value: fat },
          { label: "Углев", value: carbs },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#fff", borderRadius: 12,
            padding: "12px 8px", textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#4F7453" }}>
              {value ? Math.round(value) : "—"}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <span suppressHydrationWarning style={{ fontSize: 12, color: "#aaa", display: "block", textAlign: "right", marginBottom: 24, marginTop: -16 }}>
        {normPercent !== null ? `${normPercent}% от вашей суточной нормы` : ""}
      </span>
    </>
  );
}