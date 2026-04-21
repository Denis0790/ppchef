"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  type: "auth" | "premium";
  onClose: () => void;
}

export default function AuthPrompt({ type, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isAuth = type === "auth";

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%) }
          to   { transform: translateX(-50%) translateY(0) }
        }
      `}</style>

      {/* Затемнение */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
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
        background: "#013125",
        borderRadius: "24px 24px 0 0",
        padding: "20px 20px 40px",
        zIndex: 101,
        animation: "slideUp 0.3s ease",
      }}>

        {/* Ручка */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "rgba(248,255,238,0.2)",
          margin: "0 auto 24px",
        }} />

        {/* ── AUTH вариант ── */}
        {isAuth && (
          <>
            {/* Иконка + заголовок */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
              {/* TODO: <img src="/icon_auth/log.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} /> */}
              <img src="/icon_auth/log.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
                необходима регистрация
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => { onClose(); router.push("/auth"); }}
                style={{ width: "100%", height: 48, background: "#A6ED49", color: "#013125", border: "none", borderRadius: 100, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 13, cursor: "pointer" }}
              >
                зарегистрироваться бесплатно →
              </button>
              <button
                onClick={() => { onClose(); router.push("/auth"); }}
                style={{ width: "100%", height: 48, background: "#A6ED49", color: "#013125", border: "none", borderRadius: 100, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 13, cursor: "pointer" }}
              >
                уже есть аккаунт? войти →
              </button>
              <button
                onClick={() => { onClose(); router.push("/"); }}
                style={{ width: "100%", height: 44, background: "transparent", color: "#F8FFEE", border: "none", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, cursor: "pointer", opacity: 0.6 }}
              >
                продолжить без регистрации →
              </button>
            </div>
          </>
        )}

        {/* ── PREMIUM вариант ── */}
        {!isAuth && (
          <>
            {/* Иконка + заголовок */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <img src="/icon_profile/diamond.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
                premium функция
              </span>
            </div>

            {/* Список фич
                TODO: замените SVG заглушки на свои иконки
            */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {[
                {
                  icon: "/icon_premium/stop.svg",       /* TODO: путь к иконке */
                  title: "стоп-слова",
                  desc: "скрывай нежелательные ингредиенты",
                },
                {
                  icon: "/icon_premium/norm.svg",        /* TODO: путь к иконке */
                  title: "расчет нормы в %",
                  desc: "суточная норма блюда в каждом рецепте",
                },
                {
                  icon: "/icon_premium/fav.svg",         /* TODO: путь к иконке */
                  title: "неограниченное избранное",
                  desc: "добавляй в избранное без ограничений",
                },
                {
                  icon: "/icon_premium/fridge.svg",      /* TODO: путь к иконке */
                  title: "холодильник",
                  desc: "поиск по имеющимся продуктам",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {/* Иконка фичи
                      TODO: замените на <img src={icon} alt="" width={20} height={20} style={{ objectFit: "contain", flexShrink: 0, marginTop: 2 }} />
                  */}
                  <img src={icon} alt="" width={19} height={19} style={{ objectFit: "contain", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 500, fontSize: 13, color: "#F8FFEE", marginBottom: 2 }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 11, color: "#F8FFEE", opacity: 0.6 }}>
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка попробовать */}
            <button
              onClick={() => { onClose(); router.push("/subscription"); }}
              style={{ width: "100%", height: 48, background: "#A6ED49", color: "#013125", border: "none", borderRadius: 100, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 13, cursor: "pointer", marginBottom: 12 }}
            >
              попробовать за 90 Р / мес →
            </button>

            {/* Ссылка на годовую подписку */}
            <div
              onClick={() => { onClose(); router.push("/subscription"); }}
              style={{ textAlign: "center", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 12, color: "#A6ED49", opacity: 0.7, cursor: "pointer" }}
            >
              или 790 Р / год — выгоднее на 27% →
            </div>
          </>
        )}

      </div>
    </>
  );
}