import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getAiStatus, redeemGenerateAccess } from "@/lib/ai/generate";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function SettingsView() {
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const clearLocal = useWorkspaceStore((s) => s.clearLocal);
  const [copied, setCopied] = useState(false);
  const [locked, setLocked] = useState(false);
  const [token, setToken] = useState("");
  const [accessMsg, setAccessMsg] = useState<string | null>(null);

  useEffect(() => {
    void getAiStatus().then((s) => setLocked(s.locked));
  }, []);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(workspaceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  }

  async function redeem(e: FormEvent) {
    e.preventDefault();
    const result = await redeemGenerateAccess({ data: { token } });
    if (result.ok) {
      setToken("");
      setAccessMsg("Prístup uložený v httpOnly cookie.");
      return;
    }
    setAccessMsg(result.error);
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-muted">Workspace</p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Nastavenie</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Lokálne dáta. Žiadny model picker — poskytovateľ sa volí na serveri.
      </p>

      <dl className="mt-8 max-w-lg space-y-4">
        <div className="rounded-3xl border border-border bg-surface p-5">
          <dt className="text-xs uppercase tracking-widest text-subtle">
            Workspace ID
          </dt>
          <dd className="mt-2 break-all font-mono text-xs text-fg">{workspaceId}</dd>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void copyId()}>
            {copied ? "Skopírované" : "Kopírovať ID"}
          </Button>
        </div>
        {locked ? (
          <div className="rounded-3xl border border-border bg-surface p-5">
            <dt className="text-xs uppercase tracking-widest text-subtle">
              Prístup k generate
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted">
              Workspace je uzamknutý. Token sa overí na serveri a uloží ako
              httpOnly cookie — nie do JavaScriptu.
            </dd>
            <form className="mt-4 space-y-3" onSubmit={(e) => void redeem(e)}>
              <label className="sr-only" htmlFor="access-token">
                Prístupový token
              </label>
              <input
                id="access-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                placeholder="Invite / access token"
              />
              <Button type="submit" disabled={!token.trim()}>
                Uložiť prístup
              </Button>
            </form>
            {accessMsg ? <p className="mt-2 text-xs text-muted">{accessMsg}</p> : null}
          </div>
        ) : null}
        <div className="rounded-3xl border border-border bg-surface p-5">
          <dt className="text-xs uppercase tracking-widest text-subtle">Úložisko</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            Projekty, promty a blueprinty sú v tomto prehliadači. Vymazanie
            nenávratne zmaže lokálny stav.
          </dd>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              if (window.confirm("Vymazať lokálne projekty, promty a blueprinty?")) {
                clearLocal();
              }
            }}
          >
            Vymazať lokálne dáta
          </Button>
        </div>
      </dl>
    </div>
  );
}
