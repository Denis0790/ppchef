/* eslint-disable @next/next/no-img-element */
// app/auth/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { login, register, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const globalStyles = `
  @font-face {
    font-family: 'Montserrat';
    src: url('/fonts/Montserrat-Italic.ttf') format('truetype');
    font-weight: 400;
    font-style: italic;
    font-display: swap;
  }
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #013125 inset !important;
    -webkit-text-fill-color: #F8FFEE !important;
    caret-color: #F8FFEE;
  }

  @keyframes ppchef-spin {
    to { transform: rotate(360deg); }
  }

  .auth-input {
    width: 100%;
    height: 56px;
    background: transparent;
    border: 1.5px solid #A6ED49;
    border-radius: 100px;
    padding: 13px 18px 13px 48px;
    color: #F8FFEE;
    fontFamily: "'Montserrat', sans-serif";
    fontStyle: "italic";
    font-size: 13px;
    outline: none;
    transition: box-shadow 0.2s;
    letter-spacing: 0.01em;
  }
  .auth-input:focus {
    box-shadow: 0 0 0 3px rgba(166,237,73,0.15);
  }
  .auth-input::placeholder { color: #7aad7a; }

  .submit-btn {
    width: 318px;
    height: 56px;
    padding: 0;
    background: #A6ED49;
    color: #013125;
    border: none;
    border-radius: 100px;
    fontFamily: "'Montserrat', sans-serif";
    fontStyle: "italic";
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(166,237,73,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .submit-btn:not(:disabled):hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(166,237,73,0.4);
  }
  .submit-btn:not(:disabled):active {
    transform: translateY(0);
  }

  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    border-radius: 100px;
    fontFamily: "'Montserrat', sans-serif";
    fontStyle: "italic";
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
    letter-spacing: 0.02em;
    border: none;
    outline: none;
    background: transparent;
  }
  .tab-btn.active   { background: #A6ED49; color: #013125; box-shadow: 0 2px 12px rgba(166,237,73,0.25); }
  .tab-btn.inactive { color: #A6ED49; opacity: 0.7; }

  .input-wrap {
    position: relative;
    width: 318px;
    margin-bottom: 12px;
  }
  .input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.6;
    pointer-events: none;
  }

  .checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    margin-bottom: 12px;
  }
  .checkbox-box {
    width: 22px; height: 22px;
    border-radius: 6px;
    flex-shrink: 0;
    margin-top: 1px;
    border: 1.5px solid #A6ED49;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .checkbox-box.checked { background: #A6ED49; }
  .checkbox-label {
    font-size: 11.5px;
    color: #F8FFEE;
    line-height: 1.6;
    fontFamily: "'Montserrat', sans-serif";
    fontStyle: "italic";
    opacity: 0.85;
    letter-spacing: 0.01em;
  }
  .checkbox-link { color: #A6ED49; text-decoration: underline; cursor: pointer; }

  .forgot-link {
    font-size: 12px; color: #A6ED49; cursor: pointer;
    fontFamily: "'Montserrat', sans-serif";
    fontStyle: "italic";
    letter-spacing: 0.02em;
    transition: opacity 0.2s;
  }
  .forgot-link:hover { opacity: 0.75; }

  .back-link {
    margin-top: 62px;
    font-size: 12px;
    color: #F8FFEE;
    opacity: 0.7;
    cursor: pointer;
    font-family: 'Unbounded', sans-serif;
    letter-spacing: 0.02em;
    transition: opacity 0.2s;
  }
  .back-link:hover { opacity: 1; }

  .error-box {
    width: 318px;
    background: rgba(224,85,85,0.12);
    color: #ff8585;
    border: 1px solid rgba(224,85,85,0.3);
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 12px;
    margin-bottom: 16px;
    fontFamily: "'Montserrat', sans-serif";
    fontStyle: "italic";
  }
`;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function IconEmail() {
  return (
    <img className="input-icon" src="/icon_auth/log.svg" alt="" width={18} height={18} />
  );
}

function IconLock() {
  return (
    <img className="input-icon" src="/icon_auth/pas.svg" alt="" width={18} height={18} />
  );
}

function IconEye({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const Checkbox = ({ checked, onChange, label, link, linkLabel }: {
  checked: boolean; onChange: () => void; label: string; link?: string; linkLabel?: string;
}) => {
  const router = useRouter();
  return (
    <div className="checkbox-row" onClick={onChange}>
      <div className={`checkbox-box${checked ? " checked" : ""}`}>
        {checked && (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="#013125" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="checkbox-label">
        {label}{" "}
        {link && linkLabel && (
          <span className="checkbox-link"
            onClick={e => { e.stopPropagation(); router.push(link); }}>
            {linkLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default function AuthPage() {
  const router = useRouter();
  const { setToken } = useAuth();

  const [mode, setMode]             = useState<"login" | "register">("login");
  const [step, setStep]             = useState<"form" | "verify">("form");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeData, setAgreeData]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [code, setCode]             = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("ref_code", ref);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const canSubmit = mode === "login"
    ? !loading && !!email && !!password
    : !loading && !!email && !!password && agreeTerms && agreeData;

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
    await handleVerifyWithCode(fullCode);
  }

  async function handleVerifyWithCode(fullCode: string) {
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
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
    if (digit && index === 3 && newCode.join("").length === 4) {
      setTimeout(() => handleVerifyWithCode(newCode.join("")), 100);
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

if (step === "verify") {
    return (
      <>
        <style>{globalStyles}</style>
        <main style={{
          maxWidth: 420, margin: "0 auto", minHeight: "100vh",
          background: "#013125",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "0 24px",
        }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📨</div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 20, fontWeight: 700, color: "#A6ED49" }}>
              Проверьте почту
            </div>
            <div style={{
              fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 14,
              color: "#F8FFEE", opacity: 0.6, marginTop: 10, lineHeight: 1.7,
            }}>
              Мы отправили 4-значный код на<br />
              <strong style={{ color: "#A6ED49", opacity: 1 }}>{email}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleCodeInput(i, e.target.value)}
                onKeyDown={e => handleCodeKeyDown(i, e)}
                style={{
                  width: 64, height: 72, textAlign: "center",
                  fontSize: 30, fontWeight: 700, color: "#F8FFEE",
                  border: `2px solid ${digit ? "#A6ED49" : "rgba(166,237,73,0.3)"}`,
                  borderRadius: 16, outline: "none",
                  background: digit ? "rgba(166,237,73,0.08)" : "rgba(255,255,255,0.03)",
                  transition: "all 0.15s",
                  fontFamily: "'Montserrat', sans-serif",
                  fontStyle: "italic",
                  caretColor: "#A6ED49",
                }}
              />
            ))}
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="submit-btn" onClick={handleVerify}
            disabled={loading || code.join("").length !== 4}
            style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
            {loading ? "Проверяем..." : "Подтвердить"}
          </button>

          <div style={{
            textAlign: "center", fontSize: 12, color: "#F8FFEE",
            opacity: 0.55, marginTop: 20,
            fontFamily: "'Montserrat', sans-serif", fontStyle: "italic",
          }}>
            Не получили код?{" "}
            {resendTimer > 0 ? (
              <span style={{ color: "#7aad7a", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>Повторить через {resendTimer}с</span>
            ) : (
              <span onClick={handleResend}
                style={{ color: "#A6ED49", cursor: "pointer", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>
                Отправить снова
              </span>
            )}
          </div>

          <div className="back-link"
            onClick={() => { setStep("form"); setCode(["", "", "", ""]); setError(""); }}
            style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 14 }}>
            ← Изменить email
          </div>
        </main>
      </>
    );
  }

  const topPadding = "calc(50vh - 280px)";

  return (
    <>
      <style>{globalStyles}</style>
      <main style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: "#013125",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: topPadding,
        paddingLeft: 24, paddingRight: 24,
      }}>

        <div style={{ marginBottom: 36 }}>
          <img src="/logo_vert.svg" alt="ШЕФ" style={{ width: 220, height: 144, objectFit: "contain" }} />
        </div>

        <div style={{
          display: "flex",
          background: "#013125",
          borderRadius: 100,
          padding: 4,
          marginBottom: 12,
          border: "2px solid #A6ED49",
          height: 56,
          width: 318,
          flexShrink: 0,
        }}>
          {(["login", "register"] as const).map(m => (
            <button key={m}
              className={`tab-btn ${mode === m ? "active" : "inactive"}`}
              onClick={() => { setMode(m); setError(""); }}
              style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 17 }}>
              {m === "login" ? "вход" : "регистрация"}
            </button>
          ))}
        </div>

        <div className="input-wrap">
          <IconEmail />
          <input className="auth-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="e-mail"
            style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 14 }} />
        </div>

        <div className="input-wrap" style={{ marginBottom: 0 }}>
          <IconLock />
          <input className="auth-input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="пароль"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ paddingRight: 48, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 14 }}
          />
          <div
            onClick={() => setShowPassword(p => !p)}
            style={{
              position: "absolute", right: 16, top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer", opacity: 0.6,
              transition: "opacity 0.2s",
              display: "flex", alignItems: "center",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
          >
            <IconEye visible={showPassword} />
          </div>
        </div>

        {/*
          Нижняя часть — position: relative, не влияет на верхние элементы.
          Login:    забыли пароль (mt 12) → кнопка (mt 35)
          Register: чекбоксы (mt 12)      → кнопка (mt 12)
          Всё что ниже пароля — просто добавляется вниз, верх не двигается.
        */}
        {mode === "login" ? (
          <>
            <div style={{ width: 318, textAlign: "center", marginTop: 12 }}>
            <span className="forgot-link" onClick={() => router.push("/auth/reset")}
              style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 14 }}>
              забыли пароль →
            </span>
          </div>
          {error && <div className="error-box" style={{ marginTop: 16, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic" }}>{error}</div>}
          <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit}
            style={{ marginTop: 35, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 17 }}>
            {loading ? "Подождите..." : "вход"}
          </button>
          </>
        ) : (
          <>
            <div style={{ width: 318, marginTop: 12 }}>
            <Checkbox checked={agreeTerms} onChange={() => setAgreeTerms(p => !p)}
              label="Я принимаю" link="/terms" linkLabel="условия использования сервиса" />
            <Checkbox checked={agreeData} onChange={() => setAgreeData(p => !p)}
              label="Я согласен(а) на обработку персональных данных в соответствии с"
              link="/privacy" linkLabel="политикой конфиденциальности" />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit}
            style={{ marginTop: 12, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 17 }}>
            {loading ? "Подождите..." : "зарегистрироваться"}
          </button>
          </>
        )}

       <div className="back-link" onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontStyle: "italic", fontSize: 14 }}>
        <img src="/icon_auth/back.svg" alt="назад" style={{ width: 10, height: 24, objectFit: "contain" }} />
        вернуться к рецептам
      </div>

      </main>
    </>
  );
}