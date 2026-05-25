"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function GoogleButton({ onSuccess, onError }: { onSuccess: (token: string) => void; onError: () => void }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: { access_token: string }) => {
      try {
        onSuccess(tokenResponse.access_token);
      } catch {
        onError();
      }
    },
    onError: () => onError(),
    flow: "implicit",
  });

  return (
    <button
      onClick={() => googleLogin()}
      style={{
        width: "100%", height: 48,
        background: "white", color: "#013125",
        border: "none", borderRadius: 100,
        fontSize: 14, fontStyle: "italic",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      войти через google
    </button>
  );
}

function PromoModalInner() {
  const { isLoggedIn, isReady, setToken } = useAuth();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isReady || isLoggedIn) return;

    const now = Date.now();
    const lastShown = localStorage.getItem("recipe_promo_shown");

    if (lastShown) {
      const lastDate = new Date(parseInt(lastShown)).toDateString();
      const today = new Date().toDateString();
      if (lastDate === today) return;
    }

    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem("recipe_promo_shown", String(now));
    }, 30000);

    return () => clearTimeout(timer);
  }, [isReady, isLoggedIn]);

  async function handleGoogleSuccess(accessToken: string) {
    setError("");
    try {
      const data = await apiFetch("/auth/google", {
        method: "POST",
        body: JSON.stringify({ token: accessToken }),
      }) as { access_token: string };
      setToken(data.access_token);
      setShow(false);
    } catch {
      setError("не удалось войти через google");
    }
  }

  if (!show) return null;

  return (
    <>
      <div
        onClick={() => setShow(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      />

      <div style={{
        position: "fixed", zIndex: 201,
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#013125",
        borderRadius: "24px 24px 0 0",
        padding: "24px 24px 48px",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "rgba(248,255,238,0.2)",
          margin: "0 auto 24px",
        }} />

        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🥗</div>

        <div style={{
          fontSize: 18, fontWeight: 500, fontStyle: "italic",
          color: "#A6ED49", textAlign: "center", marginBottom: 12,
        }}>
          хочешь больше таких рецептов?
        </div>

        <div style={{
          fontSize: 12, fontStyle: "italic",
          color: "#F8FFEE", opacity: 0.7,
          textAlign: "center", lineHeight: 1.6, marginBottom: 20,
        }}>
          войди и получи доступ ко всем возможностям
        </div>

        {/* Фичи */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {[
            { emoji: "📊", text: "расчёт КБЖУ под твои цели" },
            { emoji: "❤️", text: "избранное — сохраняй что понравилось" },
            { emoji: "🛒", text: "поиск рецептов по продуктам из холодильника" },
            { emoji: "✨", text: "новые рецепты каждый день" },
          ].map(({ emoji, text }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
              <span style={{ fontSize: 12, fontStyle: "italic", color: "#F8FFEE", opacity: 0.8 }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "#F87045", textAlign: "center", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <GoogleButton
            onSuccess={handleGoogleSuccess}
            onError={() => setError("не удалось войти через google")}
          />
          <button
            onClick={() => { setShow(false); router.push("/auth"); }}
            style={{
              width: "100%", height: 48,
              background: "transparent", color: "#F8FFEE",
              border: "1px solid rgba(166,237,73,0.3)", borderRadius: 100,
              fontSize: 13, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
            }}
          >
            войти через email →
          </button>
          <button
            onClick={() => setShow(false)}
            style={{
              width: "100%", height: 44,
              background: "transparent", color: "#F8FFEE",
              border: "none",
              fontSize: 12, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer", opacity: 0.4,
            }}
          >
            продолжить без входа
          </button>
        </div>
      </div>
    </>
  );
}

export default function RecipePromoModal() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <PromoModalInner />
    </GoogleOAuthProvider>
  );
}