"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  type: "auth" | "premium";
  onClose: () => void;
}

export default function AuthPrompt({ type, onClose }: Props) {
  const router = useRouter();

  // Закрываем по Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isAuth = type === "auth";

  return (
    <>
      {/* Затемнение */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Шторка снизу */}
      <div style={{
        position: "fixed", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "24px 24px 40px",
        zIndex: 101,
        animation: "slideUp 0.3s ease",
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { transform: translateX(-50%) translateY(100%) } to { transform: translateX(-50%) translateY(0) } }
        `}</style>

        {/* Ручка */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "#e0e0e0", margin: "0 auto 24px",
        }} />

        {/* Иконка */}
        <div style={{ textAlign: "center", fontSize: 52, marginBottom: 12 }}>
          {isAuth ? "👤" : "⭐"}
        </div>

        {/* Заголовок */}
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24, fontWeight: 700,
          color: "#333", textAlign: "center", marginBottom: 8,
        }}>
          {isAuth ? "Нужна регистрация" : "Только для Premium"}
        </div>

        {/* Описание */}
        <div style={{
          fontSize: 14, color: "#888", textAlign: "center",
          lineHeight: 1.6, marginBottom: 24, padding: "0 8px",
        }}>
          {isAuth
            ? "Зарегистрируйтесь бесплатно чтобы добавлять рецепты в избранное, сохранять настройки и многое другое"
            : "Оформите Premium подписку чтобы получить доступ к этой функции"
          }
        </div>

        {/* Фичи */}
        <div style={{
          background: "#F5F0E8", borderRadius: 16,
          padding: "14px 16px", marginBottom: 20,
        }}>
          {isAuth ? (
            <>
              {["❤️ Сохраняйте любимые рецепты", "📊 Считайте КБЖУ под себя", "🔍 Ищите по холодильнику", "🎁 Приглашайте друзей и получайте Premium"].map(f => (
                <div key={f} style={{ fontSize: 13, color: "#555", paddingBottom: 6, lineHeight: 1.5 }}>
                  {f}
                </div>
              ))}
            </>
          ) : (
            <>
              {["📊 Калькулятор суточной нормы КБЖУ", "🚫 Стоп-слова для нежелательных продуктов", "🔍 Поиск рецептов по холодильнику", "❤️ Безлимитное избранное"].map(f => (
                <div key={f} style={{ fontSize: 13, color: "#555", paddingBottom: 6, lineHeight: 1.5 }}>
                  {f}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Кнопки */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => { onClose(); router.push(isAuth ? "/auth" : "/subscription"); }}
            style={{
              width: "100%", height: 52,
              background: "#01311C", color: "#fff",
              border: "none", borderRadius: 14,
              fontSize: 16, fontWeight: 600, cursor: "pointer",
            }}
          >
            {isAuth ? "Зарегистрироваться бесплатно →" : "Оформить Premium от 90 ₽/мес →"}
          </button>
          {isAuth && (
            <button
              onClick={() => { onClose(); router.push("/auth"); }}
              style={{
                width: "100%", height: 44,
                background: "transparent", color: "#888",
                border: "1.5px solid #ece7de", borderRadius: 14,
                fontSize: 14, cursor: "pointer",
              }}
            >
              Уже есть аккаунт? Войти
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: "100%", height: 44,
              background: "transparent", color: "#aaa",
              border: "none", fontSize: 13, cursor: "pointer",
            }}
          >
            Продолжить без регистрации
          </button>
        </div>
      </div>
    </>
  );
}