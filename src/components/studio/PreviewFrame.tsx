import { useEffect, useRef } from "react";
import { injectCozyElements } from "@/lib/preview/cozy-elements";
import { PREVIEW_SANDBOX } from "@/lib/preview/sandbox";

export { PREVIEW_SANDBOX };

/** Opaque-origin blob preview. See PREVIEW_SANDBOX — no allow-same-origin. */

export function PreviewFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const urlRef = useRef("");

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    if (!html.trim()) {
      iframe.removeAttribute("src");
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = "";
      }
      return;
    }

    const next = injectCozyElements(html);
    const blob = new Blob([next], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const previous = urlRef.current;
    urlRef.current = url;
    iframe.dataset.patch = "reloaded";
    iframe.dataset.patchReason = previous ? "html-changed" : "first";
    iframe.src = url;
    if (previous) URL.revokeObjectURL(previous);

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
