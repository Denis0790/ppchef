"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #013125 inset !important;
    -webkit-text-fill-color: #F8FFEE !important;
    caret-color: #F8FFEE;
  }

  .reset-input {
    width: 318px;
    height: 56px;
    background: transparent;
    border: 1.5px solid #A6ED49;
    border-radius: 100px;
    padding: 13px 18px 13px 48px;
    color: #F8FFEE;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-size: 13px;
    outline: none;
    transition: box-shadow 0.2s;
  }
  .reset-input:focus {
    box-shadow: 0 0 0 3px rgba(166,237,73,0.15);
  }
  .reset-input::placeholder { color: rgba(248,255,238,0.35); }

  .reset-btn {
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
  .reset-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .reset-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .reset-back {
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
    font-size: 12px;
    color: #F8FFEE;
    opacity: 0.7;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 28px;
  }
  .reset-back:hover { opacity: 1; }

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

  .error-box {
    width: 318px;
    background: rgba(224,85,85,0.12);
    color: #ff8585;
    border: 1px solid rgba(224,85,85,0.3);
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 12px;
    margin-bottom: 16px;
    font-family: 'Montserrat', sans-serif;
    font-style: italic;
  }
`;

/* ── Логотип + подпись ── */
function Logo() {
  return (
    <div style={{ marginBottom: 40, textAlign: "center" }}>
      <img src="/logo_vert.svg" alt="ШЕФ" style={{ width: 220, height: 144, objectFit: "contain" }} />
    </div>
  );
}

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
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  useEffect(() => {
    if (token) setMode("confirm");
  }, [token]);

  async function handleRequest() {
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      await apiFetch("/auth/reset-password/request", { method: "POST", body: JSON.stringify({ email }) });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  }

  async function handleConfirm() {
    if (password !== password2) { setError("Пароли не совпадают"); return; }
    if (password.length < 8) { setError("Пароль должен быть не менее 8 символов"); return; }
    setLoading(true); setError("");
    try {
      await apiFetch("/auth/reset-password/confirm", { method: "POST", body: JSON.stringify({ token, new_password: password }) });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  }

  const main = {
    maxWidth: 480, margin: "0 auto", minHeight: "100vh",
    background: "#013125",
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
    padding: "0 24px",
  };

  /* ── Письмо отправлено ── */
  if (done && mode === "request") return (
    <main style={main}>
      <style>{globalStyles}</style>
      <Logo />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {/* TODO: <img src="/icon_reset/mail.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} /> */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
          письмо отправлено
        </span>
      </div>

      <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#F8FFEE", opacity: 0.7, textAlign: "center", lineHeight: 1.7, marginBottom: 32, maxWidth: 318 }}>
        если e-mail зарегистрирован — вы получите письмо со ссылкой для сброса пароля (не забудьте проверить папку «спам»)
      </div>

      <button className="reset-btn" onClick={() => router.push("/auth")}>
        вернуться ко входу
      </button>
    </main>
  );

  /* ── Пароль изменён ── */
  if (done && mode === "confirm") return (
    <main style={main}>
      <style>{globalStyles}</style>
      <Logo />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {/* TODO: <img src="/icon_reset/check.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} /> */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
          пароль изменён
        </span>
      </div>

      <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#F8FFEE", opacity: 0.7, textAlign: "center", lineHeight: 1.7, marginBottom: 32, maxWidth: 318 }}>
        теперь войдите с новым паролем
      </div>

      <button className="reset-btn" onClick={() => router.push("/auth")}>
        войти
      </button>
    </main>
  );

  /* ── Основная форма ── */
  return (
    <main style={main}>
      <style>{globalStyles}</style>
      <Logo />

      {/* Описание */}
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, color: "#F8FFEE", opacity: 0.7, textAlign: "center", lineHeight: 1.7, marginBottom: 24, maxWidth: 318 }}>
        {mode === "request"
          ? "введите свой e-mail и мы пришлём ссылку для восстановления пароля"
          : "придумайте новый пароль"
        }
      </div>

      {/* Форма запроса сброса */}
      {mode === "request" && (
        <>
          <div className="input-wrap">
            {/* TODO: <img className="input-icon" src="/icon_auth/log.svg" alt="" width={18} height={18} /> */}
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <input
              className="reset-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e-mail"
              onKeyDown={e => e.key === "Enter" && handleRequest()}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="reset-btn" onClick={handleRequest} disabled={loading || !email.trim()}>
            {loading ? "отправляем..." : "отправить ссылку"}
          </button>
        </>
      )}

      {/* Форма нового пароля */}
      {mode === "confirm" && (
        <>
          {/* Новый пароль */}
          <div className="input-wrap">
            {/* TODO: <img className="input-icon" src="/icon_auth/pas.svg" alt="" width={18} height={18} /> */}
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
            <input
              className="reset-input"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="новый пароль"
              style={{ paddingRight: 48 }}
            />
            <div onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {showPass
                  ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
            </div>
          </div>

          {/* Повтор пароля */}
          <div className="input-wrap">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
            <input
              className="reset-input"
              type={showPass2 ? "text" : "password"}
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              placeholder="повторите пароль"
              style={{ paddingRight: 48 }}
              onKeyDown={e => e.key === "Enter" && handleConfirm()}
            />
            <div onClick={() => setShowPass2(p => !p)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6ED49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {showPass2
                  ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="reset-btn" onClick={handleConfirm} disabled={loading || !password || !password2}>
            {loading ? "сохраняем..." : "сохранить пароль"}
          </button>
        </>
      )}

      {/* Вернуться ко входу */}
      <div className="reset-back" onClick={() => router.push("/auth")}>
        ← вернуться ко входу
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