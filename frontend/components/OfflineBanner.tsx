"use client";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => {
    if (typeof window === "undefined") return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        zIndex: 9998,

        background: "#e05555",
        color: "#fff",

        padding: "10px 16px",
        textAlign: "center",

        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      📡 Нет интернета — показываем сохранённые данные
    </div>
  );
}