const CACHE_NAME = "practicallab-public-shell-v2";
const SHELL_PATHS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/lab-flask.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_PATHS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("practicallab-public-shell-") &&
                key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/staff/") ||
    url.pathname.startsWith("/admin/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    if (url.pathname !== "/" && url.pathname !== "/offline.html") {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            return caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, response.clone()))
              .then(() => response);
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) || caches.match("/offline.html"),
        ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              return caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, response.clone()))
                .then(() => response);
            }
            return response;
          }),
      ),
    );
  }
});
