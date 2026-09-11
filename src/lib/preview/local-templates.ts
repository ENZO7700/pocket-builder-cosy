/** Client-safe HTML templates. Never import vite / Node here. */

import { injectCozyElements } from "@/lib/preview/cozy-elements";

export function localPreviewHtml(brief: string): { title: string; html: string; code: string } {
  const title = titleFromBrief(brief);
  const html = injectCozyElements(landing(title, brief));
  const code = `/* local preview — no Node APIs */\n` + html;
  return { title, html, code };
}

const BASE_CSS = `
:root { color-scheme: light; --paper:#f4efe6; --ink:#1c1915; --muted:#4a433a; --line:#ddd4c6; --terra:#c45c38; --cream:#fff7f0; }
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--paper); color: var(--ink); font-family: "Iowan Old Style", Palatino, Georgia, serif; }
body { padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom); }
button, input, textarea { font: inherit; }
button { cursor: pointer; }
.app { max-width: 1080px; margin: 0 auto; padding: 20px 16px 40px; }
.kicker { letter-spacing: 0.16em; text-transform: uppercase; font-size: 11px; color: #8a7f70; margin: 0 0 8px; font-family: system-ui, sans-serif; }
h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); line-height: 1.12; margin: 0 0 8px; font-weight: 600; }
.lede { font-family: system-ui, sans-serif; color: var(--muted); font-size: 15px; line-height: 1.5; margin: 0 0 22px; }
.btn { font-family: system-ui, sans-serif; font-weight: 600; font-size: 13px; background: var(--terra); color: var(--cream); border: 0; padding: 10px 14px; border-radius: 12px; }
`;

function landing(title: string, brief: string): string {
  return `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${escapeHtml(title)}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<cozy-app kicker="Cozy Studio" heading="${escapeHtml(title)}" lede="${escapeHtml(brief.slice(0, 320) || "Pokojný produktový povrch.")}">
  <cozy-btn type="button" id="cta">Pokračovať</cozy-btn>
</cozy-app>
<script>document.getElementById("cta").addEventListener("click",function(){this.textContent="Pripravené"});</script>
</body>
</html>`;
}

function titleFromBrief(brief: string): string {
  const t = brief.trim();
  if (!t) return "Nový náhľad";
  const first = t.split(/[.!?]/)[0]?.trim() ?? t;
  return first.slice(0, 48) || "Nový náhľad";
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "\u0026amp;",
    "<": "\u0026lt;",
    ">": "\u0026gt;",
    '"': "\u0026quot;",
  };
  return s.replace(/[&<>"]/g, (ch) => map[ch] ?? ch);
}
