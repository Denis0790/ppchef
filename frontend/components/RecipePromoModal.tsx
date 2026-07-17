"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const YANDEX_CLIENT_ID = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID || "";
const YANDEX_REDIRECT_URI = "https://ppchef.ru/api/v1/auth/yandex/callback";

function IconYandex() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
      <path
        fill="#fff"
        d="M13.32 6.6h-1.28c-2.24 0-3.42 1.14-3.42 2.8 0 1.88 0.8 2.76 2.46 3.9l1.36 0.92-3.92 5.86h-2.1l3.52-5.24c-2.02-1.44-3.16-2.84-3.16-5.2 0-2.94 2.06-4.94 5.24-4.94h3.06v15.36h-1.76V6.6z"
      />
    </svg>
  );
}

function YandexButton() {
  function handleClick() {
    if (!YANDEX_CLIENT_ID) {
      // eslint-disable-next-line no-console
      console.error("NEXT_PUBLIC_YANDEX_CLIENT_ID не задан");
      return;
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: YANDEX_CLIENT_ID,
      redirect_uri: YANDEX_REDIRECT_URI,
      force_confirm: "yes",
    });
    window.location.href = `https://oauth.yandex.ru/authorize?${params.toString()}`;
  }

  return (
    <button
      onClick={handleClick}
      style={{
        width: "100%", height: 48,
        background: "#A6ED49", color: "#013125",
        border: "none", borderRadius: 100,
        fontSize: 14, fontStyle: "italic",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}
    >
      <IconYandex />
      войти через яндекс
    </button>
  );
}

export default function RecipePromoModal() {
  const { isLoggedIn, isReady } = useAuth();
  const [show, setShow] = useState(false);
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
        padding: "20px 24px 48px",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        {/* Ручка */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "rgba(248,255,238,0.2)",
          margin: "0 auto 24px",
        }} />

        {/* Заголовок */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <img src="/icon_profile/diamond.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
          <span style={{
            fontSize: 16, fontWeight: 500, fontStyle: "italic",
            color: "#A6ED49",
          }}>
            хочешь больше таких рецептов?
          </span>
        </div>

        {/* Фичи */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {[
            { icon: "/icon_profile/kbju2.svg", title: "расчёт КБЖУ под твои цели", desc: "считай калории, белки, жиры и углеводы" },
            { icon: "/icon_profile/like2.svg", title: "избранное", desc: "сохраняй рецепты которые понравились" },
            { icon: "/icon_profile/search2.svg", title: "поиск по продуктам", desc: "найди рецепт из того что есть в холодильнике" },
            { icon: "/icon_profile/stop2.svg", title: "стоп-слова", desc: "скрывай нежелательные ингредиенты" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <img src={icon} alt="" width={19} height={19} style={{ objectFit: "contain", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, fontStyle: "italic", color: "#F8FFEE", marginBottom: 2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 11, fontStyle: "italic", color: "#F8FFEE", opacity: 0.6 }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <YandexButton />
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