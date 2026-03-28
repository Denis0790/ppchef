// app/auth/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { login, register, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("ref_code", ref);
  }, []);

  // Таймер повторной отправки
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSubmit() {
    setError("");
    if (!isValidEmail(email)) { setError("Введите корректный email адрес"); return; }
    if (mode === "register" && (!agreeTerms || !agreeData)) {
      setError("Необходимо принять условия использования и согласиться на обработку данных");
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
        setStep("verify");
        setResendTimer(60);
        // Фокус на первую цифру
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    const fullCode = code.join("");
    if (fullCode.length !== 4) { setError("Введите 4-значный код"); return; }
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code: fullCode }),
      }) as { access_token: string }; 
      setToken(data.access_token);
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Неверный код");
      // Очищаем поля при ошибке
      setCode(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      setResendTimer(60);
      setCode(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeInput(index: number, value: string) {
    // Разрешаем только цифры
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    // Переходим на следующий инпут
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    // Автоматически верифицируем когда все 4 цифры введены
    if (digit && index === 3) {
      const fullCode = [...newCode].join("");
      if (fullCode.length === 4) {
        setTimeout(() => handleVerifyWithCode(fullCode), 100);
      }
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyWithCode(fullCode: string) {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code: fullCode }),
      }) as { access_token: string };   // ← добавить приведение типа
      
      setToken(data.access_token);
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Неверный код");
      setCode(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%", padding: "12px 14px", border: "1.5px solid #ece7de",
    borderRadius: 12, fontSize: 15, outline: "none", background: "#fafaf8",
    boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif",
  };

  const Checkbox = ({ checked, onChange, label, link, linkLabel }: {
    checked: boolean; onChange: () => void; label: string; link?: string; linkLabel?: string;
  }) => (
    <div onClick={onChange} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 10 }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? "#4F7453" : "#ddd"}`,
        background: checked ? "#4F7453" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
        {label}{" "}
        {link && linkLabel && (
          <span onClick={e => { e.stopPropagation(); router.push(link); }}
            style={{ color: "#4F7453", textDecoration: "underline", cursor: "pointer" }}>
            {linkLabel}
          </span>
        )}
      </div>
    </div>
  );

  const canSubmit = mode === "login"
    ? !loading && !!email && !!password
    : !loading && !!email && !!password && agreeTerms && agreeData;

  // ── Шаг верификации ────────────────────────────────────────
  if (step === "verify") {
    return (
      <main style={{
        maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 24px", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📨</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#4F7453" }}>
            Проверьте почту
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 8, lineHeight: 1.5 }}>
            Мы отправили 4-значный код на<br />
            <strong style={{ color: "#555" }}>{email}</strong>
          </div>
        </div>

        <div style={{ width: "100%", background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          {/* 4 поля для цифр */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleCodeInput(i, e.target.value)}
                onKeyDown={e => handleCodeKeyDown(i, e)}
                style={{
                  width: 64, height: 72, textAlign: "center",
                  fontSize: 32, fontWeight: 700, color: "#333",
                  border: `2px solid ${digit ? "#4F7453" : "#ece7de"}`,
                  borderRadius: 16, outline: "none", background: digit ? "#f0f7f0" : "#fafaf8",
                  transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ background: "#fef0f0", color: "#e05555", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || code.join("").length !== 4}
            style={{
              width: "100%", padding: "14px 0",
              background: code.join("").length === 4 && !loading ? "#4F7453" : "#a8c5ab",
              color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: code.join("").length === 4 && !loading ? "pointer" : "not-allowed",
              marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {loading ? "Проверяем..." : "Подтвердить"}
          </button>

          {/* Повторная отправка */}
          <div style={{ textAlign: "center", fontSize: 13, color: "#888" }}>
            Не получили код?{" "}
            {resendTimer > 0 ? (
              <span style={{ color: "#aaa" }}>Повторить через {resendTimer}с</span>
            ) : (
              <span
                onClick={handleResend}
                style={{ color: "#4F7453", cursor: "pointer", fontWeight: 600 }}
              >
                Отправить снова
              </span>
            )}
          </div>
        </div>

        <div onClick={() => { setStep("form"); setCode(["", "", "", ""]); setError(""); }}
          style={{ marginTop: 24, fontSize: 13, color: "#888", cursor: "pointer" }}>
          ← Изменить email
        </div>
      </main>
    );
  }

  // ── Основная форма ─────────────────────────────────────────
  return (
    <main style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#F5F0E8",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "0 24px", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#4F7453" }}>
          ПП Шеф
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Рецепты правильного питания</div>
      </div>

      <div style={{ width: "100%", background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {/* Переключатель */}
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
            placeholder="your@email.com" style={inp} />
        </div>

        <div style={{ marginBottom: mode === "login" ? 8 : 20 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>Пароль</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={inp} />
        </div>

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <span onClick={() => router.push("/auth/reset")}
              style={{ fontSize: 12, color: "#4F7453", cursor: "pointer", fontWeight: 500 }}>
              Забыли пароль?
            </span>
          </div>
        )}

        {mode === "register" && (
          <div style={{ marginBottom: 16 }}>
            <Checkbox checked={agreeTerms} onChange={() => setAgreeTerms(p => !p)}
              label="Я принимаю" link="/terms" linkLabel="условия использования сервиса" />
            <Checkbox checked={agreeData} onChange={() => setAgreeData(p => !p)}
              label="Я согласен(а) на обработку персональных данных в соответствии с"
              link="/privacy" linkLabel="политикой конфиденциальности" />
          </div>
        )}

        {error && (
          <div style={{ background: "#fef0f0", color: "#e05555", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: "100%", padding: "14px 0",
          background: canSubmit ? "#4F7453" : "#a8c5ab",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: canSubmit ? "pointer" : "not-allowed",
          transition: "background 0.2s", fontFamily: "'DM Sans', sans-serif",
        }}>
          {loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </button>
      </div>

      <div onClick={() => router.push("/")} style={{ marginTop: 24, fontSize: 13, color: "#888", cursor: "pointer" }}>
        ← Вернуться к рецептам
      </div>
    </main>
  );
}