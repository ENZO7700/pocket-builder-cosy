import { PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateButton({
  disabled,
  hasHtml,
  online,
}: {
  disabled: boolean;
  hasHtml: boolean;
  online: boolean;
}) {
  return (
    <Button type="submit" className="mt-2 w-full" disabled={disabled}>
      {hasHtml ? (
        <>
          Upraviť
          <PenLine className="size-4" />
        </>
      ) : (
        <>
          {online ? "Generate" : "Generate locally"}
          <Send className="size-4" />
        </>
      )}
    </Button>
  );
}
