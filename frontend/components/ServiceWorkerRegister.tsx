"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Проверяем обновление каждый раз при загрузке
        reg.update();

        // Если есть новый SW — применяем сразу
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage("skipWaiting");
              // Перезагружаем страницу чтобы применить новый код
              window.location.reload();
            }
          });
        });
      });
    }
  }, []);
  return null;
}