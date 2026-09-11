import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";

export function StopButton() {
  const stopGenerate = useStudioStore((s) => s.stopGenerate);

  return (
    <Button
      type="button"
      className="mt-2 w-full"
      onClick={() => stopGenerate()}
    >
      Stop
      <Square className="size-3 fill-current" />
    </Button>
  );
}
