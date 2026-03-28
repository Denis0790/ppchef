"use client";
import { useState, useEffect } from "react";

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Показываем только на iOS Safari и только если не установлено
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("ios_banner_dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("ios_banner_dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 9999,
      background: "#fff", borderRadius: 16, padding: "16px 16px 16px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      fontFamily: "'DM Sans', sans-serif",
      animation: "slideUp 0.3s ease",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Крестик */}
      <div onClick={dismiss} style={{
        position: "absolute", top: 12, right: 12,
        width: 24, height: 24, borderRadius: "50%",
        background: "#f0f0f0", display: "flex",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 14, color: "#888",
      }}>✕</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <img src="/icon-180.png" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>ПП Шеф</div>
          <div style={{ fontSize: 12, color: "#888" }}>Добавьте на экран домой</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 4 }}>
        Нажмите{" "}
        <span style={{ display: "inline-block", background: "#f0f0f0", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
          􀈂 Поделиться
        </span>
        {" "}внизу экрана, затем{" "}
        <strong>«На экран домой»</strong>
      </div>
    </div>
  );
}