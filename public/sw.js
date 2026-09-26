// The Vite build replaces this marker whenever the app bundle changes.
const ROOT = new URL("./", self.location).pathname;
const PREFIX = `amber-shell:${ROOT}:`;
const CACHE = `${PREFIX}__BUILD_VERSION__`;
async function cacheShell(response) {
  if (!response.ok) return;
  const cache = await caches.open(CACHE);
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], new URL(ROOT, self.location.origin)))
    .filter(
      (url) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith(`${ROOT}assets/`),
    )
    .map((url) => url.href);
  // Commit HTML only after its exact bundle is cached, including on an upgrade.
  await cache.addAll([
    ...new Set(assets),
    `${ROOT}icon.svg`,
    `${ROOT}icon-192.png`,
    `${ROOT}icon-512.png`,
    `${ROOT}manifest.webmanifest`,
  ]);
  await cache.put(ROOT, response);
}
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(ROOT, { cache: "reload" }).then((response) => {
      if (!response.ok) throw new Error("App shell is unavailable");
      return cacheShell(response);
    }),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(ROOT) ||
    url.pathname.startsWith(`${ROOT}api/`)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok)
            event.waitUntil(cacheShell(response.clone()).catch(() => {}));
          return response;
        })
        .catch(async () => (await caches.open(CACHE)).match(ROOT)),
    );
  } else {
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) =>
            (await cache.match(event.request)) || fetch(event.request),
        ),
    );
  }
});
