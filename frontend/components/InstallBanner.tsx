"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("installDismissed");
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setShow(false);
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("installDismissed", "1");
  }

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes ib-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ib-slide {
          from { transform: translateX(-50%) translateY(100%) }
          to   { transform: translateX(-50%) translateY(0) }
        }
      `}</style>

      {/* Затемнение */}
      <div
        onClick={handleDismiss}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          animation: "ib-fade 0.2s ease",
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
        animation: "ib-slide 0.3s ease",
      }}>

        {/* Ручка */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "rgba(248,255,238,0.2)",
          margin: "0 auto 24px",
        }} />

        {/* Иконка + заголовок */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
          marginBottom: 8,
        }}>
          {/* TODO: <img src="/icon_install/app.svg" alt="" width={20} height={20} style={{ objectFit: "contain" }} /> */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#A6ED49" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v13M8 11l4 4 4-4"/>
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
          </svg>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: 16, color: "#A6ED49",
          }}>
            установить пп шеф
          </span>
        </div>

        {/* Описание */}
        <div style={{
          fontFamily: "'Montserrat', sans-serif",
          fontStyle: "italic", fontWeight: 400,
          fontSize: 12, color: "#F8FFEE", opacity: 0.6,
          textAlign: "center", lineHeight: 1.6,
          marginBottom: 24,
        }}>
          добавьте приложение на главный экран — быстрый доступ к рецептам без браузера
        </div>

        {/* Кнопки */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          <button onClick={handleInstall} style={{
            width: "100%", height: 48,
            background: "#A6ED49", color: "#013125",
            border: "none", borderRadius: 100,
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: 13, cursor: "pointer",
          }}>
            установить →
          </button>

          <button onClick={handleDismiss} style={{
            width: "100%", height: 44,
            background: "transparent", color: "#F8FFEE",
            border: "none",
            fontFamily: "'Montserrat', sans-serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: 12, cursor: "pointer",
            opacity: 0.6,
          }}>
            не сейчас
          </button>

        </div>
      </div>
    </>
  );
}