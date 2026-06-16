const CACHE_NAME = "mdb-v0-7-1";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/styles/foundation.css",
  "./assets/styles/components.css",
  "./assets/styles/screens/home.css",
  "./assets/styles/screens/manager.css",
  "./assets/styles/screens/game.css",
  "./assets/styles/screens/results.css",
  "./assets/styles/screens/drawing.css",
  "./assets/styles/screens/multiplayer.css",
  "./data/lyrics.json",
  "./data/mimes.json",
  "./data/words.json",
  "./data/drawings.json",
  "./src/main.js",
  "./src/config/config.js",
  "./src/core/state.js",
  "./src/core/dom.js",
  "./src/core/storage.js",
  "./src/core/utils.js",
  "./src/services/libraries.js",
  "./src/services/backup.js",
  "./src/services/diagnostics.js",
  "./src/features/home.js",
  "./src/features/game/game-controller.js",
  "./src/features/game/timer.js",
  "./src/features/game/swipe.js",
  "./src/features/game/results.js",
  "./src/features/drawing/drawing-controller.js",
  "./src/features/drawing/mixed-drawing.js",
  "./src/features/drawing/canvas.js",
  "./src/features/drawing/hold-actions.js",
  "./src/features/drawing/paper-mode.js",
  "./src/features/card-manager/manager-controller.js",
  "./src/features/card-manager/card-editor.js",
  "./src/features/card-manager/category-manager.js",
  "./src/features/multiplayer/multiplayer-controller.js",
  "./src/features/multiplayer/schedule.js",
  "./src/features/multiplayer/scoreboard.js",
  "./src/features/multiplayer/session.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES.map(url => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type !== "opaque") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      })
  );
});
