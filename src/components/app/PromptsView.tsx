import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function PromptsView() {
  const prompts = useWorkspaceStore((s) => s.prompts);
  const addPrompt = useWorkspaceStore((s) => s.addPrompt);
  const removePrompt = useWorkspaceStore((s) => s.removePrompt);
  const setBrief = useStudioStore((s) => s.setBrief);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function save() {
    addPrompt(title, body);
    setTitle("");
    setBody("");
  }

  function run(text: string) {
    setBrief(text);
    void navigate({ to: "/studio" });
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-muted">Knižnica</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Promty</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Ulož brief a neskôr ho spusti v Projektoch. Žiadne predpripravené šablóny.
      </p>

      <form
        className="mt-8 max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="block text-xs uppercase tracking-widest text-subtle" htmlFor="ptitle">
          Názov
        </label>
        <input
          id="ptitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          placeholder="Landing pre ateliér"
        />
        <label className="block text-xs uppercase tracking-widest text-subtle" htmlFor="pbody">
          Prompt
        </label>
        <textarea
          id="pbody"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm leading-relaxed text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          placeholder="Stručný brief pre novú plochu…"
        />
        <Button type="submit" disabled={!body.trim()}>
          Uložiť prompt
        </Button>
      </form>

      <ul className="mt-10 max-w-2xl space-y-2">
        {prompts.length === 0 ? (
          <li className="text-sm text-muted">Zatiaľ žiadne promty.</li>
        ) : (
          prompts.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">
                {p.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => run(p.body)}>
                  Spustiť v Projektoch
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removePrompt(p.id)}
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
