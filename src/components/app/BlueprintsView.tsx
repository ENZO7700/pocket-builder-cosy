import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function BlueprintsView() {
  const html = useStudioStore((s) => s.html);
  const title = useStudioStore((s) => s.title);
  const applyResult = useStudioStore((s) => s.applyResult);
  const blueprints = useWorkspaceStore((s) => s.blueprints);
  const addBlueprint = useWorkspaceStore((s) => s.addBlueprint);
  const removeBlueprint = useWorkspaceStore((s) => s.removeBlueprint);
  const upsertProject = useWorkspaceStore((s) => s.upsertProject);
  const navigate = useNavigate();

  function apply(bp: { title: string; html: string }) {
    applyResult({
      title: bp.title,
      html: bp.html,
      code: bp.html,
      assistantText: "Blueprint loaded.",
      provider: "local",
    });
    upsertProject({ title: bp.title, html: bp.html, code: bp.html });
    void navigate({ to: "/studio" });
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-muted">Vlastné</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Blueprinty</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Ulož aktuálny náhľad ako blueprint. Kanban, chat, habits, calendar a
        notes šablóny sú preč — ostávajú len tvoje.
      </p>

      <div className="mt-8">
        <Button
          type="button"
          disabled={!html}
          onClick={() => addBlueprint(title, html)}
        >
          Uložiť aktuálny náhľad
        </Button>
        {!html ? (
          <p className="mt-2 text-xs text-subtle">
            Najprv vygeneruj plochu v Projektoch.
          </p>
        ) : null}
      </div>

      <ul className="mt-10 max-w-2xl space-y-2">
        {blueprints.length === 0 ? (
          <li className="text-sm text-muted">Zatiaľ žiadne blueprinty.</li>
        ) : (
          blueprints.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-subtle">
                  {new Date(b.updatedAt).toLocaleString("sk-SK")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => apply(b)}>
                  Použiť
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBlueprint(b.id)}
                >
                  Zmazať
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
