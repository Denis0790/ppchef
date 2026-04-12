"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMe } from "@/lib/api";

export default function SuccessPage() {
  const router = useRouter();
  const { token, isLoggedIn } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "pending">("loading");

  useEffect(() => {
    if (!isLoggedIn || !token) { router.push("/auth"); return; }

    // Проверяем статус подписки с сервера
    getMe(token).then(u => {
      if (u.is_premium) {
        setStatus("success");
      } else {
        setStatus("pending");
      }
    }).catch(() => setStatus("pending"));
  }, [isLoggedIn, token, router]);

  if (status === "loading") return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #A6ED49",
        borderTop: "3px solid #01311C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  if (status === "pending") return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16,
      fontFamily: "'Montserrat', sans-serif", padding: "0 32px",
    }}>
      <div style={{ fontSize: 64 }}>⏳</div>
      <div style={{
        fontSize: 18, fontWeight: 500, fontStyle: "italic",
        fontFamily: "'Montserrat', sans-serif", color: "#013125",
        textAlign: "center",
      }}>
        оплата обрабатывается
      </div>
      <div style={{
        fontSize: 13, fontFamily: "'Montserrat', sans-serif",
        color: "#013125", opacity: 0.6, textAlign: "center", lineHeight: 1.6,
      }}>
        это может занять несколько минут. если вы оплатили — подписка активируется автоматически
      </div>
      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 8, height: 48, paddingLeft: 32, paddingRight: 32,
          background: "#01311C", color: "#F8FFEE",
          border: "none", borderRadius: 20,
          fontSize: 12, fontStyle: "italic",
          fontFamily: "'Montserrat', sans-serif", cursor: "pointer",
        }}
      >
        перейти к рецептам
      </button>
    </main>
  );

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "#F8FFEE", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16,
      fontFamily: "'Montserrat', sans-serif", padding: "0 32px",
    }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <div style={{
        fontSize: 18, fontWeight: 500, fontStyle: "italic",
        fontFamily: "'Montserrat', sans-serif", color: "#013125",
        textAlign: "center",
      }}>
        подписка активна!
      </div>
      <div style={{
        fontSize: 13, fontFamily: "'Montserrat', sans-serif",
        color: "#013125", opacity: 0.6, textAlign: "center", lineHeight: 1.6,
      }}>
        спасибо за поддержку! все функции premium теперь доступны
      </div>
      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 8, height: 48, paddingLeft: 32, paddingRight: 32,
          background: "#A6ED49", color: "#01311C",
          border: "none", borderRadius: 20,
          fontSize: 12, fontStyle: "italic",
          fontFamily: "'Montserrat', sans-serif", cursor: "pointer",
        }}
      >
        перейти к рецептам
      </button>
    </main>
  );
}