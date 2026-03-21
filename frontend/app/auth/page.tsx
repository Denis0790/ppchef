"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Сохраняем ref код из URL если есть
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("ref_code", ref);
  }, []);

  async function handleSubmit() {
    setError("");
    if (!isValidEmail(email)) {
      setError("Введите корректный email адрес");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await login(email, password);
        setToken(data.access_token);
        router.push("/");
      } else {
        const refCode = localStorage.getItem("ref_code") || undefined;
        await register(email, password, refCode);
        localStorage.removeItem("ref_code");
        const data = await login(email, password);
        setToken(data.access_token);
        router.push("/");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Произошла ошибка";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      maxWidth: 480, margin: "0 auto",
      minHeight: "100vh", background: "#F5F0E8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 24px", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#4F7453" }}>
          ПП Шеф
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Рецепты правильного питания</div>
      </div>

      <div style={{ width: "100%", background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", background: "#F5F0E8", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {(["login", "register"] as const).map((m) => (
            <div key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 10,
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#4F7453" : "#888",
              fontWeight: mode === m ? 600 : 400, fontSize: 14, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}>
              {m === "login" ? "Вход" : "Регистрация"}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Email</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" style={{
              width: "100%", padding: "12px 14px", border: "1.5px solid #ece7de",
              borderRadius: 12, fontSize: 15, outline: "none", background: "#fafaf8",
              boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif",
            }} />
        </div>

        <div style={{ marginBottom: mode === "login" ? 8 : 24 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Пароль</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%", padding: "12px 14px", border: "1.5px solid #ece7de",
              borderRadius: 12, fontSize: 15, outline: "none", background: "#fafaf8",
              boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif",
            }} />
        </div>

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <span onClick={() => router.push("/auth/reset")} style={{ fontSize: 12, color: "#4F7453", cursor: "pointer", fontWeight: 500 }}>
              Забыли пароль?
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: "#fef0f0", color: "#e05555", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || !email || !password} style={{
          width: "100%", padding: "14px 0",
          background: loading || !email || !password ? "#a8c5ab" : "#4F7453",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: loading || !email || !password ? "not-allowed" : "pointer",
          transition: "background 0.2s", fontFamily: "'DM Sans', sans-serif",
        }}>
          {loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>

        {mode === "register" && (
          <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            Регистрируясь, вы соглашаетесь с{" "}
            <span style={{ color: "#4F7453", cursor: "pointer" }}>условиями использования</span>
            {" "}и обработкой персональных данных
          </div>
        )}
      </div>

      <div onClick={() => router.push("/")} style={{ marginTop: 24, fontSize: 13, color: "#888", cursor: "pointer" }}>
        ← Вернуться к рецептам
      </div>
    </main>
  );
}