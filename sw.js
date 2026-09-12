/* Dank Recipes service worker — served from the deploy subpath so its scope
   covers the whole app. Network-first for navigations (falling back to the
   cached shell), stale-while-revalidate for same-origin static assets. */
const CACHE = "dank-recipes-v1";

self.addEventListener("install", (e) => {
  // Pre-cache the shell AND the hashed assets it references, so the app
  // works offline after a single online visit (first-load requests happen
  // before this worker controls the page).
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const res = await fetch("./index.html", { cache: "no-cache" });
      await cache.put("./index.html", res.clone());
      const html = await res.text();
      const refs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => "./" + m[1]);
      await cache.addAll([...new Set(refs)]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // recipe images, sheet API: straight to network

  if (req.mode === "navigate") {
    // Network-first so deploys land; offline falls back to the cached shell
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Static assets: cached copy immediately, refresh in the background
  e.respondWith(
    caches.match(req).then((cached) => {
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || refresh;
    })
  );
});
