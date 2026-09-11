import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText, downloadHtml, slugFromTitle } from "@/lib/studio/export";

export function ExportActions({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const disabled = !html.trim();

  async function onCopy() {
    if (disabled) return;
    const ok = await copyText(html);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label={copied ? "Copied" : "Copy HTML"}
        onClick={() => void onCopy()}
      >
        <Copy className="size-3.5" />
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label="Download HTML"
        onClick={() => downloadHtml(slugFromTitle(title), html)}
      >
        <Download className="size-3.5" />
        .html
      </Button>
    </div>
  );
}
