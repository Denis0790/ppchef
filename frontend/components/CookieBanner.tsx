"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_accepted");
    if (!accepted) setTimeout(() => setVisible(true), 1500);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: 448,
      background: "#01311C", color: "#fff",
      borderRadius: 16, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      zIndex: 30, boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
    }}>
      <div style={{ flex: 1, fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>
        Мы используем cookies для улучшения работы сайта.
      </div>
      <button
        onClick={() => { localStorage.setItem("cookies_accepted", "1"); setVisible(false); }}
        style={{
          flexShrink: 0, background: "#A6ED49", color: "#01311C",
          border: "none", borderRadius: 10, padding: "8px 14px",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        Понятно
      </button>
    </div>
  );
}