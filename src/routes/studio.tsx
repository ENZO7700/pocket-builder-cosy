import { createFileRoute } from "@tanstack/react-router";
import { StudioShell } from "@/components/studio/StudioShell";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  ssr: false,
  head: () => ({
    meta: [{ title: "Studio — Cozy AI Studio" }],
  }),
});

function StudioPage() {
  return <StudioShell />;
}
