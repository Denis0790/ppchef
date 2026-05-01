"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export default function WelcomePremiumModal() {
  const { isLoggedIn, isReady, isPremium, subscriptionPlan, token } = useAuth();
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !isLoggedIn || !isPremium || subscriptionPlan !== "trial") return;

    try {
      const payload = JSON.parse(atob(token!.split(".")[1]));
      const key = `welcome_premium_shown_${payload.sub}`;
      const alreadyShown = localStorage.getItem(key);
      if (!alreadyShown) {
        localStorage.setItem(key, "1");
        setTimeout(() => setShow(true), 0);
      }
    } catch {}
  }, [isReady, isLoggedIn, isPremium, subscriptionPlan, token]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(1,49,37,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#F8FFEE",
        border: "1px solid #A6ED49",
        borderRadius: 20,
        padding: 24,
        maxWidth: 340,
        width: "100%",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        {/* Заголовок */}
        <div style={{
          fontSize: 18, fontWeight: 500, fontStyle: "italic",
          color: "#013125", marginBottom: 16,
        }}>
          premium в подарок
        </div>

        {/* Список фич — как на странице подписки */}
        {[
          { icon: "/icon_profile/stop2.svg", title: "стоп-слова", desc: "скрывай нежелательные ингредиенты" },
          { icon: "/icon_profile/kbju2.svg", title: "расчет нормы в %", desc: "суточная норма блюда в каждом рецепте" },
          { icon: "/icon_profile/like2.svg", title: "неограниченное избранное", desc: "добавляй в избранное без ограничений" },
          { icon: "/icon_profile/search2.svg", title: "холодильник", desc: "поиск по имеющимся продуктам" },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            marginBottom: 14,
          }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <Image src={icon} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
            </div>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 400, fontStyle: "italic",
                fontFamily: "'Montserrat', sans-serif", color: "#013125",
                marginBottom: 2,
              }}>
                {title}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 400, fontStyle: "normal",
                fontFamily: "'Montserrat', sans-serif", color: "#013125", opacity: 0.7,
              }}>
                {desc}
              </div>
            </div>
          </div>
        ))}

        {/* Кнопки */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <button
            onClick={() => { setShow(false); router.push("/kbju"); }}
            style={{
              width: "100%", height: 48,
              background: "#013125", color: "#A6ED49",
              border: "none", borderRadius: 100,
              fontSize: 14, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            попробовать →
          </button>
          <button
            onClick={() => setShow(false)}
            style={{
              width: "100%", height: 48,
              background: "transparent", color: "#013125",
              border: "1px solid rgba(1,49,37,0.3)",
              borderRadius: 100,
              fontSize: 14, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer", opacity: 0.7,
            }}
          >
            закрыть
          </button>
        </div>
      </div>
    </div>
  );
}