"use client";
import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setTimeout(() => setStatus("error"), 0);
      return;
    }

    apiFetch("/auth/verify-email/confirm", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => setTimeout(() => setStatus("success"), 0))
      .catch(() => setTimeout(() => setStatus("error"), 0));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 48 }}>⏳</div>
      <div style={{ fontSize: 16, color: "#888" }}>Подтверждаем email...</div>
    </main>
  );

  if (status === "success") return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#4F7453" }}>Email подтверждён!</div>
      <div style={{ fontSize: 15, color: "#888", textAlign: "center", padding: "0 32px" }}>Теперь все функции приложения доступны.</div>
      <button onClick={() => router.push("/")} style={{ marginTop: 8, background: "#4F7453", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Перейти к рецептам
      </button>
    </main>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 64 }}>❌</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#333" }}>Ссылка недействительна</div>
      <div style={{ fontSize: 15, color: "#888", textAlign: "center", padding: "0 32px" }}>Ссылка истекла или уже была использована. Запросите новое письмо.</div>
      <button onClick={() => router.push("/profile")} style={{ marginTop: 8, background: "#4F7453", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        В профиль
      </button>
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyContent /></Suspense>;
}