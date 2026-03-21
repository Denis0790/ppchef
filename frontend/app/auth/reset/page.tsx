"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [mode, setMode] = useState<"request" | "confirm">(token ? "confirm" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) setMode("confirm");
  }, [token]);

  async function handleRequest() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch("/auth/reset-password/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (password !== password2) { setError("Пароли не совпадают"); return; }
    if (password.length < 8) { setError("Пароль должен быть не менее 8 символов"); return; }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/auth/reset-password/confirm", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%", padding: "12px 14px",
    border: "1.5px solid #ece7de", borderRadius: 12,
    fontSize: 15, outline: "none", background: "#fafaf8",
    boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif",
  };

  if (done && mode === "request") return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#4F7453", marginBottom: 8 }}>Письмо отправлено</div>
      <div style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
        Если email зарегистрирован — вы получите письмо со ссылкой для сброса пароля. Проверьте папку Спам.
      </div>
      <button onClick={() => router.push("/auth")} style={{ background: "#4F7453", color: "#fff", border: "none", borderRadius: 12, padding: "12px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Вернуться ко входу
      </button>
    </main>
  );

  if (done && mode === "confirm") return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#4F7453", marginBottom: 8 }}>Пароль изменён!</div>
      <div style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 24 }}>Теперь войдите с новым паролем.</div>
      <button onClick={() => router.push("/auth")} style={{ background: "#4F7453", color: "#fff", border: "none", borderRadius: 12, padding: "12px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Войти
      </button>
    </main>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#4F7453" }}>
          {mode === "request" ? "Восстановление пароля" : "Новый пароль"}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
          {mode === "request" ? "Введите email и мы пришлём ссылку" : "Придумайте новый пароль"}
        </div>
      </div>

      <div style={{ width: "100%", background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {mode === "request" ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" style={inp}
                onKeyDown={e => e.key === "Enter" && handleRequest()} />
            </div>
            {error && <div style={{ background: "#fef0f0", color: "#e05555", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button onClick={handleRequest} disabled={loading || !email.trim()} style={{
              width: "100%", padding: "14px 0",
              background: !email.trim() ? "#a8c5ab" : "#4F7453",
              color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: !email.trim() ? "not-allowed" : "pointer",
            }}>
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Новый пароль</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 8 символов" style={inp} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Повторите пароль</div>
              <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                placeholder="••••••••" style={inp}
                onKeyDown={e => e.key === "Enter" && handleConfirm()} />
            </div>
            {error && <div style={{ background: "#fef0f0", color: "#e05555", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button onClick={handleConfirm} disabled={loading || !password || !password2} style={{
              width: "100%", padding: "14px 0",
              background: !password || !password2 ? "#a8c5ab" : "#4F7453",
              color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: !password || !password2 ? "not-allowed" : "pointer",
            }}>
              {loading ? "Сохраняем..." : "Сохранить пароль"}
            </button>
          </>
        )}
      </div>

      <div onClick={() => router.push("/auth")} style={{ marginTop: 24, fontSize: 13, color: "#888", cursor: "pointer" }}>
        ← Вернуться ко входу
      </div>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}