"use client";
import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

const globalStyles = `
  @keyframes verify-spin { to { transform: rotate(360deg); } }

  .verify-btn {
    width: 318px;
    height: 56px;
    background: #A6ED49;
    color: #013125;
    border: none;
    border-radius: 100px;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 4px 20px rgba(166,237,73,0.3);
  }
  .verify-btn:hover { opacity: 0.9; transform: translateY(-1px); }
`;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (!token) { setTimeout(() => setStatus("error"), 0); return; }
    apiFetch("/auth/verify-email/confirm", { method: "POST", body: JSON.stringify({ token }) })
      .then(() => setTimeout(() => setStatus("success"), 0))
      .catch(() => setTimeout(() => setStatus("error"), 0));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const main = {
    maxWidth: 480, margin: "0 auto", minHeight: "100vh",
    background: "#013125",
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
    padding: "0 24px",
  };

  /* ── Загрузка ── */
  if (status === "loading") return (
    <main style={main}>
      <style>{globalStyles}</style>
      <div style={{ marginBottom: 40 }}>
        <img src="/logo_vert.svg" alt="ШЕФ" style={{ width: 220, height: 144, objectFit: "contain" }} />
      </div>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(166,237,73,0.2)", borderTop: "3px solid #A6ED49", animation: "verify-spin 0.8s linear infinite" }} />
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#F8FFEE", opacity: 0.6, marginTop: 16 }}>
        подтверждаем email...
      </div>
    </main>
  );

  /* ── Успех ── */
  if (status === "success") return (
    <main style={main}>
      <style>{globalStyles}</style>
      <div style={{ marginBottom: 40 }}>
        <img src="/logo_vert.svg" alt="ШЕФ" style={{ width: 220, height: 144, objectFit: "contain" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {/* TODO: <img src="/icon_reset/check.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} /> */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
          email подтверждён
        </span>
      </div>

      <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#F8FFEE", opacity: 0.7, textAlign: "center", lineHeight: 1.7, marginBottom: 32, maxWidth: 318 }}>
        теперь все функции приложения доступны
      </div>

      <button className="verify-btn" onClick={() => router.push("/")}>
        перейти к рецептам
      </button>
    </main>
  );

  /* ── Ошибка ── */
  return (
    <main style={main}>
      <style>{globalStyles}</style>
      <div style={{ marginBottom: 40 }}>
        <img src="/logo_vert.svg" alt="ШЕФ" style={{ width: 220, height: 144, objectFit: "contain" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {/* TODO: <img src="/icon_reset/error.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} /> */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
          ссылка недействительна
        </span>
      </div>

      <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#F8FFEE", opacity: 0.7, textAlign: "center", lineHeight: 1.7, marginBottom: 32, maxWidth: 318 }}>
        ссылка истекла или уже была использована — запросите новое письмо в профиле
      </div>

      <button className="verify-btn" onClick={() => router.push("/profile")}>
        в профиль
      </button>
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyContent /></Suspense>;
}