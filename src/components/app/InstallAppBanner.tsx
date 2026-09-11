import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallAppBanner() {
  const { canInstall, promptInstall, dismiss } = usePwaInstall();
  if (!canInstall) return null;

  return (
    <div
      role="region"
      aria-label="Nainštalovať aplikáciu"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-[0_12px_40px_rgba(12,11,10,0.45)]">
        <p className="min-w-0 flex-1 text-sm leading-snug text-fg">
          Nainštalovať Cozy AI Studio na plochu.
        </p>
        <Button type="button" className="shrink-0" onClick={() => void promptInstall()}>
          <Download className="size-4" aria-hidden />
          Inštalovať
        </Button>
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-card hover:text-fg"
          aria-label="Zavrieť"
          onClick={dismiss}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
