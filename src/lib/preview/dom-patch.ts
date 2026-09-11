import { Idiomorph } from "idiomorph";
import { ensureCozyElements, injectCozyElements } from "@/lib/preview/cozy-elements";

export type PatchResult = "patched" | "reloaded";

export { scriptSignature, shouldReloadPreview } from "@/lib/preview/dom-patch-utils";

function isScript(node: Node): boolean {
  return node instanceof Element && node.tagName === "SCRIPT";
}

/**
 * In-document morph. Requires a same-origin `contentDocument`.
 *
 * Do not call this from the live studio iframe. That frame is sandboxed
 * without `allow-same-origin` (see PreviewFrame) so parent JS cannot — and
 * must not — reach the preview document. Tests may still morph an in-memory
 * iframe that they created as same-origin.
 */
export function applyPreviewHtml(
  iframe: HTMLIFrameElement,
  nextHtml: string,
  prevHtml: string,
): PatchResult {
  const html = injectCozyElements(nextHtml);
  const doc = iframe.contentDocument;
  if (!prevHtml || !doc?.documentElement || !doc.body || !doc.head) {
    iframe.dataset.patch = "reloaded";
    iframe.dataset.patchReason = "no-doc";
    return "reloaded";
  }

  let parsed: Document;
  try {
    parsed = new DOMParser().parseFromString(html, "text/html");
  } catch {
    iframe.dataset.patch = "reloaded";
    iframe.dataset.patchReason = "parse";
    return "reloaded";
  }
  if (!parsed.body) {
    iframe.dataset.patch = "reloaded";
    iframe.dataset.patchReason = "empty";
    return "reloaded";
  }

  const view = doc.defaultView;
  const scrollX = view?.scrollX ?? 0;
  const scrollY = view?.scrollY ?? 0;

  try {
    ensureCozyElements(doc);
    const root = parsed.documentElement;
    if (root) {
      if (root.lang) doc.documentElement.lang = root.lang;
      const cls = root.getAttribute("class");
      if (cls) doc.documentElement.className = cls;
    }

    const css = [...parsed.querySelectorAll("style")]
      .map((el) => el.textContent ?? "")
      .join("\n");
    let styleEl = doc.querySelector("style[data-preview-css]");
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.setAttribute("data-preview-css", "");
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

    Idiomorph.morph(doc.body, parsed.body.innerHTML, {
      morphStyle: "innerHTML",
      restoreFocus: true,
      ignoreActiveValue: true,
      callbacks: {
        beforeNodeAdded: (node) => !isScript(node),
        beforeNodeRemoved: (node) => !isScript(node),
        beforeNodeMorphed: (oldNode) => !isScript(oldNode),
      },
    });

    if (parsed.title) doc.title = parsed.title;
    ensureCozyElements(doc);
  } catch {
    iframe.dataset.patch = "reloaded";
    iframe.dataset.patchReason = "morph";
    return "reloaded";
  }

  view?.scrollTo(scrollX, scrollY);
  iframe.dataset.patch = "patched";
  iframe.dataset.patchReason = "ok";
  return "patched";
}
