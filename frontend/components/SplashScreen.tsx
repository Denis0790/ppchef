"use client";
import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [show, setShow] = useState(false);

    useEffect(() => {
    const shown = sessionStorage.getItem("splash_shown");

    if (shown) return;

    const id = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem("splash_shown", "1");

        setTimeout(() => setShow(false), 2000);
    }, 0);

    return () => clearTimeout(id);
    }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#013125",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32,
      transition: "opacity 0.4s ease",
    }}>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }
        .splash-logo {
          animation: popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards,
                     pulse 2.4s ease 0.8s infinite;
          opacity: 0;
        }
        .splash-dot { width: 8px; height: 8px; border-radius: 50%; background: #A6ED49; }
        .splash-dot1 { animation: blink 1.2s ease 0.9s infinite; opacity: 0.2; }
        .splash-dot2 { animation: blink 1.2s ease 1.1s infinite; opacity: 0.2; }
        .splash-dot3 { animation: blink 1.2s ease 1.3s infinite; opacity: 0.2; }
      `}</style>

      <img
        src="/logo.png"
        alt="ПП Шеф"
        className="splash-logo"
        style={{ width: 220, height: "auto" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <div className="splash-dot splash-dot1" />
        <div className="splash-dot splash-dot2" />
        <div className="splash-dot splash-dot3" />
      </div>
    </div>
  );
}