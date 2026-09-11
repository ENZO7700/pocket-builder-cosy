const PREVIEW_CACHE = "cozy-preview-v1";
const PREVIEW_URL = "/__offline/last-preview.json";

export type OfflinePreview = {
  title: string;
  code: string;
  html: string;
};

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }
  const go = () => {
    void navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

export async function persistOfflinePreview(payload: OfflinePreview) {
  if (!payload.html || typeof caches === "undefined") return;
  try {
    const cache = await caches.open(PREVIEW_CACHE);
    await cache.put(
      PREVIEW_URL,
      new Response(JSON.stringify(payload), {
        headers: { "content-type": "application/json" },
      }),
    );
    navigator.serviceWorker?.controller?.postMessage({
      type: "CACHE_PREVIEW",
      payload,
    });
  } catch {
    /* quota / private mode */
  }
}

export async function readOfflinePreview(): Promise<OfflinePreview | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(PREVIEW_CACHE);
    const hit = await cache.match(PREVIEW_URL);
    if (!hit) return null;
    const data = (await hit.json()) as Partial<OfflinePreview>;
    if (!data.html) return null;
    return {
      title: data.title || "Last preview",
      code: data.code || data.html,
      html: data.html,
    };
  } catch {
    return null;
  }
}

export async function clearOfflinePreview() {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(PREVIEW_CACHE);
    await cache.delete(PREVIEW_URL);
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PREVIEW" });
  } catch {
    /* ignore */
  }
}
