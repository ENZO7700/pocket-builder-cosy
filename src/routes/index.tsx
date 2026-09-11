import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/components/app/DashboardView";

export const Route = createFileRoute("/")({
  component: DashboardView,
  head: () => ({
    meta: [{ title: "Dashboard — Cozy" }],
  }),
});
