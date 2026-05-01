"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  type: "auth" | "premium";
  onClose: () => void;
  desktop?: boolean;
}

export default function AuthPrompt({ type, onClose, desktop }: Props) {
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
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
      `}</style>

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

      {/* Шторка / модалка */}
      <div style={{
        position: "fixed",
        zIndex: 101,
        background: "#013125",
        padding: "20px 20px 40px",
        ...(desktop ? {
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%", maxWidth: 480,
          borderRadius: 24,
          border: "1.5px solid rgba(166,237,73,0.3)",
          boxShadow: "0 0 60px rgba(0,0,0,0.3)",
          animation: "scaleIn 0.25s ease",
        } : {
          bottom: 0,
          left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          animation: "slideUp 0.3s ease",
        }),
      }}>

        {/* Ручка — только мобилка */}
        {!desktop && (
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: "rgba(248,255,238,0.2)",
            margin: "0 auto 24px",
          }} />
        )}

        {/* Крестик — только десктоп */}
        {desktop && (
          <div onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 28, height: 28, borderRadius: "50%",
            border: "1px solid rgba(166,237,73,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16, color: "#F8FFEE", opacity: 0.6,
          }}>×</div>
        )}

        {/* ── AUTH вариант ── */}
        {isAuth && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
              <img src="/icon_auth/log.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
                необходима регистрация
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => { onClose(); router.push("/auth"); }}
                style={{ width: "100%", height: 48, background: "#A6ED49", color: "#013125", border: "none", borderRadius: 100, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, cursor: "pointer" }}
              >
                зарегистрироваться бесплатно →
              </button>
              <button
                onClick={() => { onClose(); router.push("/auth"); }}
                style={{ width: "100%", height: 48, background: "transparent", color: "#F8FFEE", border: "1px solid rgba(166,237,73,0.3)", borderRadius: 100, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, cursor: "pointer" }}
              >
                уже есть аккаунт? войти →
              </button>
              <button
                onClick={onClose}
                style={{ width: "100%", height: 44, background: "transparent", color: "#F8FFEE", border: "none", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, cursor: "pointer", opacity: 0.5 }}
              >
                продолжить без регистрации →
              </button>
            </div>
          </>
        )}

        {/* ── PREMIUM вариант ── */}
        {!isAuth && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <img src="/icon_profile/diamond.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#A6ED49" }}>
                premium функция
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {[
                { icon: "/icon_profile/stop2.svg", title: "стоп-слова", desc: "скрывай нежелательные ингредиенты" },
                { icon: "/icon_profile/kbju2.svg", title: "расчет нормы в %", desc: "суточная норма блюда в каждом рецепте" },
                { icon: "/icon_profile/like2.svg", title: "неограниченное избранное", desc: "добавляй в избранное без ограничений" },
                { icon: "/icon_profile/search2.svg", title: "холодильник", desc: "поиск по имеющимся продуктам" },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
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

            <button
              onClick={() => { onClose(); router.push("/subscription"); }}
              style={{ width: "100%", height: 48, background: "#A6ED49", color: "#013125", border: "none", borderRadius: 100, fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 13, cursor: "pointer", marginBottom: 12 }}
            >
              попробовать за 90 Р / мес →
            </button>

            <div
              onClick={() => { onClose(); router.push("/subscription"); }}
              style={{ textAlign: "center", fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: 12, color: "#A6ED49", opacity: 0.7, cursor: "pointer" }}
            >
              или 790 Р / год — выгоднее на 27% →
            </div>
          </>
        )}
      </div>
    </>
  );
}