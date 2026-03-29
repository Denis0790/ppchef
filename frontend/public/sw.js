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
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((e) => {
        console.error("Precache failed:", e);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .catch((e) => console.error("Activate cleanup failed:", e))
  );
  self.clients.claim();
});

// Обработка сообщений от клиента
self.addEventListener("message", (event) => {
  try {
    const data = event.data;
    if (!data) return;
    // Поддерживаем и строку, и объект
    if (data === "skipWaiting" || data?.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  } catch (e) {
    console.error("Message handler error:", e);
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API: network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (event.request.method === "GET" && response && response.ok) {
          const clone = response.clone();
          // Не кэшируем запросы с авторизацией
          if (!event.request.headers.get("authorization")) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, clone).catch((e) => console.error("Cache put failed:", e));
          }
        }
        return response;
      } catch (e) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(null, { status: 503, statusText: "Service Unavailable" });
      }
    })());
    return;
  }

  // Остальное: cache first, затем сеть, fallback на offline.html для документов
  event.respondWith((async () => {
    try {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response && response.ok && event.request.method === "GET") {
        const clone = response.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, clone).catch((e) => console.error("Cache put failed:", e));
      }
      return response;
    } catch (e) {
      // Если это навигация — возвращаем офлайн страницу
      if (event.request.destination === "document") {
        const offline = await caches.match("/offline.html");
        if (offline) return offline;
      }
      return new Response(null, { status: 503, statusText: "Service Unavailable" });
    }
  })());
});
