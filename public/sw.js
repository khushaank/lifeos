const CACHE = "lifeos-shell-v3";

const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png"];

async function precache(cache) {
  for (const url of PRECACHE) {
    try {
      await cache.add(new Request(url, { cache: "reload" }));
    } catch {
      // Ignore missing assets during install
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => precache(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isDocumentRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (isDocumentRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return (
          cached ||
          new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        );
      })
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      try {
        const response = await fetch(event.request);
        if (response.ok && url.pathname.startsWith("/_next/static/")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      } catch {
        if (cached) return cached;
        return new Response("Network error", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});
