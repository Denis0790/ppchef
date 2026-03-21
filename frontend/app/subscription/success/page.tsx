"use client";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#4F7453" }}>Подписка активна!</div>
      <div style={{ fontSize: 15, color: "#888", textAlign: "center", padding: "0 32px" }}>
        Спасибо за поддержку! Все функции Premium теперь доступны.
      </div>
      <button onClick={() => router.push("/")} style={{ marginTop: 8, background: "#4F7453", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Перейти к рецептам
      </button>
    </main>
  );
}