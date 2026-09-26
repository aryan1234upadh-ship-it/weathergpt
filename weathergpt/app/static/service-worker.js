const CACHE_NAME = "weathergpt-shell-v6";
const SHELL_FILES = [
  "/static/index.html",
  "/static/app.js",
  "/static/styles.css",
  "/static/manifest.webmanifest",
  "/static/icons/app-icon.svg",
  "/static/vendor/maplibre-gl.css",
  "/static/vendor/maplibre-gl.mjs",
  "/static/vendor/maplibre-gl-shared.mjs",
  "/static/vendor/maplibre-gl-worker.mjs"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("weathergpt-shell-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  // Do not cache API responses, map tiles, or other personalized/live data.
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith("/static/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/static/index.html")));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
