"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => router.push("/"), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#F5F0E8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 32px", fontFamily: "'DM Sans', sans-serif",
      textAlign: "center",
    }}>

      {/* Анимированный авокадо */}
      <div style={{ fontSize: 80, marginBottom: 8, animation: "wobble 2s infinite" }}>🥑</div>

      <style>{`
        @keyframes wobble {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 80, fontWeight: 700,
        color: "#4F7453", lineHeight: 1,
        marginBottom: 8,
        animation: "fadeIn 0.5s ease",
      }}>
        404
      </div>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 24, fontWeight: 600,
        color: "#333", marginBottom: 12,
        animation: "fadeIn 0.6s ease",
      }}>
        Рецепт не найден
      </div>

      <div style={{
        fontSize: 14, color: "#888",
        lineHeight: 1.7, marginBottom: 32,
        animation: "fadeIn 0.7s ease",
      }}>
        Кажется, этот рецепт куда-то убежал.{"\n"}
        Может, его съели? 🍽️
      </div>

      {/* Кнопки */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", animation: "fadeIn 0.8s ease" }}>
        <button onClick={() => router.push("/")} style={{
          width: "100%", height: 52,
          background: "#4F7453", color: "#fff",
          border: "none", borderRadius: 14,
          fontSize: 16, fontWeight: 600, cursor: "pointer",
        }}>
          🏠 На главную
        </button>
        <button onClick={() => router.push("/search")} style={{
          width: "100%", height: 52,
          background: "#fff", color: "#4F7453",
          border: "1.5px solid #4F7453", borderRadius: 14,
          fontSize: 16, fontWeight: 600, cursor: "pointer",
        }}>
          🔍 Найти рецепт
        </button>
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "#bbb" }}>
        Автоматический переход через {count} сек...
      </div>

    </main>
  );
}