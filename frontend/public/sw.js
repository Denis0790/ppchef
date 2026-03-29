const CACHE_NAME = "ppchef-v1";
const STATIC_CACHE = "ppchef-static-v1";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-180.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => {
        console.error("[SW] install failed:", err);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .catch((err) => {
        console.error("[SW] activate cleanup failed:", err);
      })
  );
  self.clients.claim();
});

// Обработка сообщений от клиента (вынесена на верхний уровень)
self.addEventListener("message", (event) => {
  try {
    const data = event.data;
    if (!data) return;
    // Поддерживаем и строку, и объектный формат
    if (data === "skipWaiting" || data?.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  } catch (err) {
    console.error("[SW] message handler error:", err);
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Никогда не кэшируем запросы к API/auth или запросы с авторизацией/credentials
  const isApi = url.pathname.startsWith("/api/");
  const hasAuthHeader = !!event.request.headers.get("authorization");
  const usesCredentials = event.request.credentials === "include";

  if (isApi || hasAuthHeader || usesCredentials) {
    // Network-first для API/auth: если сеть недоступна — вернуть кэш (если есть)
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          // Кэшируем только успешные GET JSON ответы без авторизации
          if (
            event.request.method === "GET" &&
            response &&
            response.ok &&
            response.headers.get("content-type")?.includes("application/json")
          ) {
            try {
              const clone = response.clone();
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, clone);
            } catch (e) {
              console.error("[SW] cache put failed for API:", e);
            }
          }
          return response;
        } catch (err) {
          // fallback to cache if available
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(null, { status: 503, statusText: "Service Unavailable" });
        }
      })()
    );
    return;
  }

  // Для остальных ресурсов — cache-first, затем сеть
  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        // Кэшируем только успешные GET ответы и только безопасные типы (скрипты, стили, json, изображения)
        if (
          event.request.method === "GET" &&
          response &&
          response.ok
        ) {
          const ct = response.headers.get("content-type") || "";
          const shouldCache =
            ct.includes("application/javascript") ||
            ct.includes("text/css") ||
            ct.includes("application/json") ||
            ct.startsWith("image/") ||
            event.request.destination === "script" ||
            event.request.destination === "style" ||
            event.request.destination === "image";

          if (shouldCache) {
            try {
              const clone = response.clone();
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, clone);
            } catch (e) {
              console.error("[SW] cache put failed:", e);
            }
          }
        }
        return response;
      } catch (err) {
        // Если навигация и нет сети — вернуть офлайн страницу
        if (event.request.destination === "document") {
          const offline = await caches.match("/offline.html");
          if (offline) return offline;
        }
        return new Response(null, { status: 503, statusText: "Service Unavailable" });
      }
    })()
  );
});
