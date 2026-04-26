"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

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
        background: "#013125",
        border: "1px solid #A6ED49",
        borderRadius: 20,
        padding: 24,
        maxWidth: 340,
        width: "100%",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        <div style={{
          fontSize: 18, fontWeight: 500, fontStyle: "italic",
          color: "#A6ED49", marginBottom: 12, textAlign: "center",
        }}>
          🎁 premium в подарок
        </div>

        <div style={{
          fontSize: 14, fontWeight: 400,
          color: "#F8FFEE", lineHeight: 1.6,
          marginBottom: 24, textAlign: "center", opacity: 0.85,
        }}>
          Мы дарим вам <span style={{ color: "#A6ED49", fontStyle: "italic" }}>1 месяц premium</span> бесплатно. Пользуйтесь всеми функциями без ограничений!
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "стоп-слова — скрывайте нежелательные ингредиенты",
            "расчёт % суточной нормы в каждом рецепте",
            "неограниченное избранное",
            "поиск по продуктам из холодильника",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#A6ED49", flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: "#F8FFEE", opacity: 0.8, lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <button
            onClick={() => { setShow(false); router.push("/kbju"); }}
            style={{
              width: "100%", height: 48,
              background: "#A6ED49", color: "#013125",
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
              background: "transparent", color: "#F8FFEE",
              border: "1px solid rgba(166,237,73,0.3)",
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