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

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#013125",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <style>{`
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.6);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes blink {
          0%, 100% {
            opacity: 0.25;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          animation: "popIn 0.5s ease, pulse 1.8s ease-in-out infinite",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <img
          src="/icons/logo.svg"
          alt="PP Chef"
          style={{
            width: 96,
            height: 96,
            display: "block",
          }}
        />

        <div
          style={{
            color: "#A6ED49",
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.4px",
          }}
        >
          ПП Шеф
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#A6ED49",
              animation: `blink 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}