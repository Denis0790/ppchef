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
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, zIndex: 50,
      background: "#4F7453", color: "#fff",
      padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    }}>
      <div style={{ fontSize: 24 }}>🌿</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Установить ПП Шеф</div>
        <div style={{ fontSize: 11, opacity: 0.85 }}>Добавьте на главный экран</div>
      </div>
      <button onClick={handleInstall} style={{
        background: "#fff", color: "#4F7453",
        border: "none", borderRadius: 10,
        padding: "6px 14px", fontSize: 13,
        fontWeight: 600, cursor: "pointer",
      }}>
        Установить
      </button>
      <button onClick={handleDismiss} style={{
        background: "transparent", border: "none",
        color: "#fff", fontSize: 20, cursor: "pointer",
        opacity: 0.7, padding: "0 4px",
      }}>×</button>
    </div>
  );
}