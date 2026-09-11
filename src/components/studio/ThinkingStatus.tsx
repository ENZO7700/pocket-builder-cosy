import { useEffect, useMemo, useState } from "react";
import { Bot, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { filesForBrief } from "@/lib/studio/thinking";

type ThinkingStatusProps = {
  brief: string;
  variant?: "thread" | "stage" | "chip";
  mode?: "create" | "revise";
};

export function ThinkingStatus({
  brief,
  variant = "thread",
  mode = "create",
}: ThinkingStatusProps) {
  const files = useMemo(() => filesForBrief(brief), [brief]);
  const [index, setIndex] = useState(0);
  const file = files[index] ?? files[0];
  const label = mode === "revise" ? "Upravujem" : "Premýšľanie";

  useEffect(() => {
    setIndex(0);
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % files.length);
    }, 1600);
    return () => window.clearInterval(id);
  }, [files]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${label}, ${file}`}
      className={cn(
        "flex items-start gap-3",
        variant === "thread" &&
          "mr-6 rounded-xl border border-border bg-card px-3 py-3",
        variant === "stage" && "flex-col items-center gap-5 text-center",
        variant === "chip" &&
          "rounded-xl border border-border bg-bg/95 px-3 py-2 shadow-sm",
      )}
    >
      <span className="think-mark" aria-hidden>
        <span className="think-arc" />
        <Bot className="size-3.5 text-accent" strokeWidth={1.75} />
      </span>
      <div
        className={cn(
          "min-w-0",
          variant === "stage" && "flex flex-col items-center",
        )}
      >
        <p className="think-label text-sm font-medium tracking-tight">
          {label}
          <span className="think-dots" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        <p
          key={file}
          className="think-file mt-1 flex items-center gap-1.5 font-mono text-xs text-muted"
        >
          <FileCode className="size-3 shrink-0 text-subtle" strokeWidth={1.75} />
          <span className="truncate">{file}</span>
          <span className="think-caret" aria-hidden />
        </p>
      </div>
    </div>
  );
}
