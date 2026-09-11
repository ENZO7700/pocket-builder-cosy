/* Cozy AI Studio offline shell. Bump CACHE when precache URLs change. */
const SHELL = "cozy-shell-v3";
const PREVIEW = "cozy-preview-v1";
const PREVIEW_URL = "/__offline/last-preview.json";

const PRECACHE = [
  "/",
  "/studio",
  "/settings",
  "/prompts",
  "/blueprints",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/__grok/icon-180.png",
  "/manifest.webmanifest",
  "/__grok/manifest.webmanifest",
];

function bypass(url) {
  const path = url.pathname;
  return (
    path.startsWith("/@") ||
    path.startsWith("/src/") ||
    path.startsWith("/node_modules") ||
    path.startsWith("/api/") ||
    path.startsWith("/_server") ||
    path.startsWith("/auth/") ||
    path.includes("hot-update") ||
    path.includes("__vite")
  );
}

function isImmutable(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    /-[A-Za-z0-9_-]{6,}\.[a-z0-9]+$/i.test(url.pathname)
  );
}

async function putCopy(cache, request, response) {
  if (!response || response.status !== 200 || response.type === "opaqueredirect") {
    return;
  }
  const copy = new Response(await response.clone().blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  await cache.put(request, copy);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    await putCopy(cache, request, response);
    return response;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      return (
        (await cache.match("/")) ||
        (await cache.match("/studio")) ||
        new Response(
          "<!doctype html><html><body style=\"margin:0;background:#12110F;color:#F4EFE6;font-family:Georgia,serif;padding:2rem\">Cozy Studio is offline. Open it once online so the shell can cache.</body></html>",
          { headers: { "content-type": "text/html; charset=utf-8" } },
        )
      );
    }
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  await putCopy(cache, request, response);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await Promise.all(
        PRECACHE.map(async (path) => {
          try {
            const response = await fetch(path, { credentials: "same-origin" });
            if (response.ok) await cache.put(path, response);
          } catch {
            /* first visit may miss a path; runtime caching fills it in */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, PREVIEW]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("cozy-") && !keep.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PREVIEW);
      if (data.type === "CLEAR_PREVIEW") {
        await cache.delete(PREVIEW_URL);
        return;
      }
      if (data.type === "CACHE_PREVIEW" && data.payload) {
        await cache.put(
          PREVIEW_URL,
          new Response(JSON.stringify(data.payload), {
            headers: { "content-type": "application/json" },
          }),
        );
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (bypass(url)) return;

  if (url.pathname === PREVIEW_URL) {
    event.respondWith(
      caches.open(PREVIEW).then((cache) => cache.match(PREVIEW_URL)).then((hit) => hit || fetch(request)),
    );
    return;
  }

  if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirst(request, SHELL));
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(cacheFirst(request, SHELL));
    return;
  }

  event.respondWith(networkFirst(request, SHELL));
});
