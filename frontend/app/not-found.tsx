"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  useEffect(() => {
  if (count === 0) {
    router.push("/");
    return;
  }
  const timer = setTimeout(() => setCount(prev => prev - 1), 1000);
  return () => clearTimeout(timer);
}, [count, router]);

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#013125",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: 0,
      fontFamily: "'Montserrat', sans-serif",
      fontStyle: "italic",
    }}>

      {/* ЛОГО — 310x205, отступ сверху 204px */}
      <div style={{
        marginTop: 100,
        width: 310, height: 205,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="/icon_404/404.svg" alt="Лого" style={{ width: 310, height: 205, objectFit: "contain" }} />
        {/* 🔧 замени /YOUR_LOGO.svg на путь до своего svg */}
      </div>

      {/* КНОПКА — НА ГЛАВНУЮ, отступ от лого 211px */}
      <div style={{ marginTop: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <button
          onClick={() => router.push("/")}
          style={{
            width: 205, height: 56,
            background: "#013125",
            color: "#F8FFEE",
            border: "1.5px solid #A6ED49",
            borderRadius: 30,
            fontSize: 17, fontWeight: 600,
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <img src="/icon_404/default.svg" alt="" style={{ width: 20, height: 20 }} />
          {/* svg */}
          На главную
        </button>

        {/* КНОПКА — НАЙТИ РЕЦЕПТ, отступ 11px */}
        <button
          onClick={() => router.push("/search")}
          style={{
            marginTop: 11,
            width: 205, height: 56,
            background: "#013125",
            color: "#F8FFEE",
            border: "1.5px solid #A6ED49",
            borderRadius: 30,
            fontSize: 17, fontWeight: 600,
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <img src="/icon_404/search.svg" alt="" style={{ width: 20, height: 20 }} />
          {/* svg */}
          Найти рецепт
        </button>
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "#A6ED4966" }}>
        Автоматический переход через {count} сек...
      </div>

    </main>
  );
}