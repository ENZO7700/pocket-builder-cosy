import { createFileRoute } from "@tanstack/react-router";
import { BlueprintsView } from "@/components/app/BlueprintsView";

export const Route = createFileRoute("/blueprints")({
  component: BlueprintsView,
  ssr: false,
  head: () => ({
    meta: [{ title: "Blueprinty — Cozy" }],
  }),
});
