"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    const shown = sessionStorage.getItem("splash_shown");
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (!isStandalone || shown) return false;
    sessionStorage.setItem("splash_shown", "1");
    return true;
  });

  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    const fadeTimer = setTimeout(() => setFading(true), 2400);
    const hideTimer = setTimeout(() => setShow(false), 2800);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [show]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#013125",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.4s ease",
    }}>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }
        .splash-logo {
          animation: popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards,
                     pulse 2s ease-in-out 0.6s infinite;
          opacity: 0;
        }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 18,
      }}>
        <img
          src="/logo.png"
          alt="ПП Шеф"
          className="splash-logo"
          style={{ width: 200, height: "auto", display: "block" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#A6ED49", display: "block",
            animation: `blink 1s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.2,
          }} />
        ))}
      </div>
    </div>
  );
}