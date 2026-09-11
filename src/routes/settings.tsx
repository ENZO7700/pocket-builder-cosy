import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/components/app/SettingsView";

export const Route = createFileRoute("/settings")({
  component: SettingsView,
  ssr: false,
  head: () => ({
    meta: [{ title: "Nastavenie — Cozy" }],
  }),
});
