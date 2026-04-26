"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function TrialExpiredModal() {
  const { trialExpiredModalShown, setTrialExpiredModalShown, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (trialExpiredModalShown && token) {
      // Помечаем что показали — больше не показывать
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        localStorage.setItem(`trial_expired_shown_${payload.sub}`, "1");
      } catch {}
    }
  }, [trialExpiredModalShown, token]);

  if (!trialExpiredModalShown) return null;

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
        {/* Заголовок */}
        <div style={{
          fontSize: 18, fontWeight: 500, fontStyle: "italic",
          color: "#A6ED49", marginBottom: 12, textAlign: "center",
        }}>
          пробный период закончился
        </div>

        {/* Текст */}
        <div style={{
          fontSize: 14, fontWeight: 400, fontStyle: "normal",
          color: "#F8FFEE", lineHeight: 1.6,
          marginBottom: 24, textAlign: "center", opacity: 0.85,
        }}>
          Вы использовали бесплатный месяц премиума. Оформите подписку чтобы продолжить пользоваться всеми функциями.
        </div>

        {/* Кнопки */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => {
              setTrialExpiredModalShown(false);
              router.push("/subscription");
            }}
            style={{
              width: "100%", height: 48,
              background: "#A6ED49", color: "#013125",
              border: "none", borderRadius: 100,
              fontSize: 14, fontStyle: "italic",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            оформить подписку →
          </button>
          <button
            onClick={() => setTrialExpiredModalShown(false)}
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
            позже
          </button>
        </div>
      </div>
    </div>
  );
}