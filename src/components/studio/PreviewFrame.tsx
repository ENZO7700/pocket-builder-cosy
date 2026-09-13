import { useEffect, useRef } from "react";
import { injectCozyElements } from "@/lib/preview/cozy-elements";
import { PREVIEW_SANDBOX } from "@/lib/preview/sandbox";
import { morphIframeDocument } from "@/lib/preview/live-morpher";
import { shouldReloadPreview } from "@/lib/preview/dom-patch-utils";

export { PREVIEW_SANDBOX };

/** Opaque-origin blob preview. See PREVIEW_SANDBOX — no allow-same-origin. */

export function PreviewFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const urlRef = useRef("");
  const previousHtmlRef = useRef("");

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    if (!html.trim()) {
      iframe.removeAttribute("src");
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = "";
      }
      previousHtmlRef.current = "";
      return;
    }

    const next = injectCozyElements(html);
    const previous = previousHtmlRef.current;
    if (
      iframe.contentDocument?.body &&
      previous &&
      !shouldReloadPreview(previous, html) &&
      morphIframeDocument(iframe, html)
    ) {
      previousHtmlRef.current = html;
      iframe.dataset.patch = "morphed";
      iframe.dataset.patchReason = "html-changed";
      return;
    }

    const blob = new Blob([next], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const previousUrl = urlRef.current;
    urlRef.current = url;
    previousHtmlRef.current = html;
    iframe.dataset.patch = "reloaded";
    iframe.dataset.patchReason = previousUrl ? "html-changed" : "first";
    iframe.src = url;
    if (previousUrl) URL.revokeObjectURL(previousUrl);

    return () => {
      if (urlRef.current === url) {
        URL.revokeObjectURL(url);
        urlRef.current = "";
      }
    };
  }, [html]);

  return (
    <iframe
      ref={ref}
      title={title}
      sandbox={PREVIEW_SANDBOX}
      referrerPolicy="no-referrer"
      className="h-full min-h-0 w-full border-0 bg-fg"
      data-preview="live"
    />
  );
}
