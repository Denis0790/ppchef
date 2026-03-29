"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    async function registerSW() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        console.log("[SW] registered", reg);

        // Если уже есть waiting worker — сразу просим активироваться
        if (reg.waiting) {
          console.log("[SW] found waiting worker, requesting skipWaiting");
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Проверяем наличие обновления при загрузке
        try {
          await reg.update();
        } catch (e) {
          console.warn("[SW] update() failed", e);
        }

        // Слушаем появление нового worker
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          console.log("[SW] updatefound, newWorker state:", newWorker.state);

          newWorker.addEventListener("statechange", () => {
            console.log("[SW] newWorker statechange:", newWorker.state);
            // Когда новый SW установлен и есть контроллер — просим его активироваться
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              try {
                newWorker.postMessage({ type: "SKIP_WAITING" });
                console.log("[SW] posted SKIP_WAITING to newWorker");
              } catch (err) {
                console.error("[SW] postMessage failed:", err);
              }
            }
          });
        });

        // Ждём смены контроллера — тогда новый SW уже контролирует страницу
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          console.log("[SW] controller changed — reloading page once");
          // Перезагружаем страницу один раз, чтобы применить новый код
          window.location.reload();
        });
      } catch (err) {
        console.error("[SW] registration failed:", err);
      }
    }

    registerSW();

    // cleanup при размонтировании (необязательно, но аккуратно)
    return () => {
      // ничего специфического не нужно удалять, слушатели привязаны к глобальным объектам
    };
  }, []);

  return null;
}
