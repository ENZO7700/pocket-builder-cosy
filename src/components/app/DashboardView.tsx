import { Link } from "@tanstack/react-router";
import { FileText, FolderOpen, ScrollText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/studio-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function DashboardView() {
  const projects = useWorkspaceStore((s) => s.projects);
  const prompts = useWorkspaceStore((s) => s.prompts);
  const blueprints = useWorkspaceStore((s) => s.blueprints);

  return (
    <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-muted">Prehľad</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Dashboard</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Lokálny workspace. Projekty, promty a blueprinty ostávajú v tomto
        prehliadači.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { to: "/studio", icon: FolderOpen, label: "Projekty", n: projects.length },
          { to: "/prompts", icon: FileText, label: "Promty", n: prompts.length },
          {
            to: "/blueprints",
            icon: ScrollText,
            label: "Blueprinty",
            n: blueprints.length,
          },
        ].map((card) => (
          <li key={card.to}>
            <Link
              to={card.to}
              className="block rounded-3xl border border-border bg-surface p-5 transition-colors duration-150 hover:bg-card"
            >
              <card.icon className="mb-3 size-4 text-accent" />
              <p className="text-2xl font-semibold tabular-nums">{card.n}</p>
              <p className="mt-1 text-sm text-muted">{card.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <h2 className="text-sm font-semibold">Nedávne projekty</h2>
        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Zatiaľ nič. Otvor Projekty a napíš brief.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {projects.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  to="/studio"
                  onClick={() => {
                    useWorkspaceStore.getState().setCurrentProjectId(p.id);
                    useStudioStore.getState().loadPreview({
                      title: p.title,
                      html: p.html,
                      code: p.code,
                    });
                  }}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm hover:bg-card"
                >
                  <span className="truncate">{p.title}</span>
                  <span className="ml-3 shrink-0 text-xs text-subtle">
                    {new Date(p.updatedAt).toLocaleDateString("sk-SK")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/studio" className={cn(buttonVariants(), "mt-6")}>
          Otvoriť Projekty
        </Link>
      </div>
    </div>
  );
}
