import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Globe, Image, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authEnabled } from "@/lib/auth/client";
import {
  createWordPressContent,
  deleteWordPressContent,
  exportToWordPress,
  listWordPressConnections,
  listWordPressContent,
  listWordPressMedia,
  type WordPressConnection,
  type WordPressContent,
} from "@/lib/wordpress";
import { useStudioStore } from "@/stores/studio-store";

type Tab = "posts" | "pages" | "media";

export function WordPressView() {
  const html = useStudioStore((s) => s.html);
  const title = useStudioStore((s) => s.title);
  const [connections, setConnections] = useState<WordPressConnection[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [tab, setTab] = useState<Tab>("posts");
  const [items, setItems] = useState<WordPressContent[]>([]);
  const [media, setMedia] = useState<Array<{ id: number; link: string | null; title: string }>>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WordPressContent | null>(null);
  const [editor, setEditor] = useState({ title: "", content: "", status: "draft" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async (id = connectionId, nextTab = tab) => {
    if (!id) return;
    setBusy(true);
    setMessage(null);
    try {
      if (nextTab === "media") {
        setMedia(await listWordPressMedia({ data: { id } }));
      } else {
        setItems(await listWordPressContent({ data: { id, type: nextTab === "posts" ? "post" : "page" } }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WordPress sa nepodarilo načítať.");
    } finally {
      setBusy(false);
    }
  }, [connectionId, tab]);

  useEffect(() => {
    if (!authEnabled) return;
    void listWordPressConnections()
      .then((sites) => {
        setConnections(sites);
        if (sites[0]) {
          setConnectionId(sites[0].id);
          void refresh(sites[0].id, tab);
        }
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Prihlásenie je potrebné."));
  }, [refresh, tab]);

  const filtered = useMemo(
    () => items.filter((item) => item.title.toLocaleLowerCase("sk").includes(search.toLocaleLowerCase("sk"))),
    [items, search],
  );

  if (!authEnabled) {
    return <EmptyState title="WordPress connector vyžaduje prihlásenie" detail="Zapnite autentifikáciu, aby boli WordPress credentials oddelené podľa používateľa." />;
  }
  if (!connections.length) {
    return (
      <EmptyState
        title="Pripoj svoj WordPress web"
        detail="Spravuj články, stránky a médiá priamo z Cosy."
        action={<Link className="text-accent underline-offset-4 hover:underline" to="/settings">Prejsť do Nastavenia</Link>}
      />
    );
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!connectionId || !editor.title.trim()) return;
    setBusy(true);
    try {
      if (selected) {
        const { updateWordPressContent } = await import("@/lib/wordpress");
        await updateWordPressContent({ data: { id: connectionId, type: selected.type, contentId: selected.id, ...editor } });
        setMessage("Obsah aktualizovaný");
      } else {
        await createWordPressContent({ data: { id: connectionId, type: tab === "pages" ? "page" : "post", ...editor } });
        setMessage(editor.status === "publish" ? "Obsah publikovaný" : "Koncept uložený");
      }
      setSelected(null);
      setEditor({ title: "", content: "", status: "draft" });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Uloženie zlyhalo.");
    } finally {
      setBusy(false);
    }
  }

  async function exportProject() {
    if (!html || !connectionId) return;
    setBusy(true);
    try {
      await exportToWordPress({ data: { id: connectionId, type: "post", title, content: html, publish: false } });
      setMessage("Projekt bol uložený ako koncept vo WordPress.");
      await refresh(connectionId, "posts");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export zlyhal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Connector</p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">WordPress</h1>
            <p className="mt-2 text-sm text-muted">Články, stránky a médiá bezpečne z jedného workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={connectionId} onChange={(event) => { setConnectionId(event.target.value); void refresh(event.target.value); }} className="h-11 rounded-xl border border-border bg-card px-3 text-sm">
              {connections.map((site) => <option key={site.id} value={site.id}>{site.label || site.siteUrl}</option>)}
            </select>
            <Button type="button" variant="outline" onClick={() => void refresh()} disabled={busy}><RefreshCw className="size-4" /> Obnoviť</Button>
            <Button type="button" onClick={() => void exportProject()} disabled={!html || busy}><Globe className="size-4" /> Exportovať projekt</Button>
          </div>
        </div>
        {message ? <p role="status" className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-muted">{message}</p> : null}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
          {([["posts", "Články", FileText], ["pages", "Stránky", FileText], ["media", "Médiá", Image]] as const).map(([value, label, Icon]) => (
            <button key={value} type="button" onClick={() => { setTab(value); void refresh(connectionId, value); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm ${tab === value ? "border-accent text-fg" : "border-transparent text-muted"}`}><Icon className="size-4" />{label}</button>
          ))}
        </div>
        {tab === "media" ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {media.map((item) => <div key={item.id} className="rounded-2xl border border-border bg-surface p-3"><div className="flex h-28 items-center justify-center rounded-xl bg-card">{item.link ? <img src={item.link} alt={item.title} className="max-h-full max-w-full object-contain" /> : <Image className="text-subtle" />}</div><p className="mt-2 truncate text-xs text-muted">{item.title || "Médium"}</p></div>)}
            {!media.length && !busy ? <p className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">Žiadne médiá.</p> : null}
          </div>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section>
              <div className="flex flex-wrap gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Hľadať ${tab === "posts" ? "články" : "stránky"}…`} className="h-11 min-w-52 flex-1 rounded-xl border border-border bg-card px-3 text-sm" /><Button type="button" onClick={() => { setSelected(null); setEditor({ title: "", content: "", status: "draft" }); }}><Plus className="size-4" /> Nový</Button></div>
              <div className="mt-4 space-y-2">{filtered.map((item) => <article key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"><button type="button" className="min-w-0 text-left" onClick={() => { setSelected(item); setEditor({ title: item.title, content: item.content, status: item.status === "publish" ? "publish" : "draft" }); }}><strong className="block truncate">{item.title || "(bez názvu)"}</strong><span className="text-xs text-muted">{item.status} · {item.modified ? new Date(item.modified).toLocaleDateString("sk-SK") : "bez dátumu"}</span></button><Button type="button" variant="ghost" size="icon" aria-label="Zmazať obsah" onClick={() => { if (window.confirm("Naozaj chceš zmazať tento obsah?")) void deleteWordPressContent({ data: { id: connectionId, type: item.type, contentId: item.id } }).then(() => void refresh()); }}><Trash2 className="size-4" /></Button></article>)}</div>
              {!filtered.length && !busy ? <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">Nenašli sa žiadne výsledky.</p> : null}
            </section>
            <form onSubmit={(event) => void save(event)} className="rounded-3xl border border-border bg-surface p-5">
              <h2 className="font-semibold">{selected ? "Upraviť obsah" : `Nový ${tab === "posts" ? "článok" : "stránka"}`}</h2>
              <input required value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} placeholder="Nadpis" className="mt-4 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm" />
              <select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })} className="mt-3 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"><option value="draft">Koncept</option><option value="publish">Publikovať</option></select>
              <textarea value={editor.content} onChange={(event) => setEditor({ ...editor, content: event.target.value })} placeholder="HTML obsah" rows={12} className="mt-3 w-full rounded-xl border border-border bg-card p-3 font-mono text-xs" />
              <div className="mt-3 flex gap-2"><Button type="submit" disabled={busy}>{selected ? "Aktualizovať" : "Uložiť"}</Button><Button type="button" variant="ghost" onClick={() => { setSelected(null); setEditor({ title: "", content: "", status: "draft" }); }}>Zrušiť</Button></div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6"><div className="max-w-md rounded-3xl border border-dashed border-border bg-surface p-10 text-center"><Globe className="mx-auto size-10 text-accent" /><h1 className="mt-4 font-serif text-2xl">{title}</h1><p className="mt-2 text-sm text-muted">{detail}</p>{action ? <div className="mt-5">{action}</div> : null}</div></div>;
}
