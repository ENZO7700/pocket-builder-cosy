import { createFileRoute } from "@tanstack/react-router";
import { PromptsView } from "@/components/app/PromptsView";

export const Route = createFileRoute("/prompts")({
  component: PromptsView,
  ssr: false,
  head: () => ({
    meta: [{ title: "Promty — Cozy" }],
  }),
});
