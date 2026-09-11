#!/usr/bin/env node
/**
 * Client bundle analyzer. Writes dist/report.html (treemap + gzip/brotli)
 * and dist/bundlemeta.json from the files Vite actually emitted.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(SCRIPT_DIR, "..");

const SKIP_DIR = /(?:^|\/)(?:server|nitro|__server|_ssr|functions)(?:\/|$)/;

export function clientAssetDirs(root = ROOT) {
  return [
    join(root, "dist", "client"),
    join(root, "dist", "assets"),
    join(root, ".vercel", "output", "static", "assets"),
    join(root, ".output", "public", "assets"),
  ];
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

export function measureBytes(source) {
  const buf = Buffer.isBuffer(source) ? source : Buffer.from(source);
  return {
    bytes: buf.byteLength,
    gzipBytes: gzipSync(buf).byteLength,
    brotliBytes: brotliCompressSync(buf).byteLength,
  };
}

export function collectClientAssets(root = ROOT) {
  const seen = new Set();
  const assets = [];
  for (const dir of clientAssetDirs(root)) {
    for (const file of walk(dir)) {
      const rel = relative(root, file).replace(/\\/g, "/");
      if (SKIP_DIR.test(rel)) continue;
      if (!/\.(js|mjs|cjs|css)$/.test(extname(file))) continue;
      if (seen.has(rel)) continue;
      seen.add(rel);
      const buf = readFileSync(file);
      assets.push({
        name: rel.split("/").pop() ?? rel,
        path: rel,
        ...measureBytes(buf),
      });
    }
  }
  return assets.sort((a, b) => b.bytes - a.bytes);
}

export function collectFromChunks(records) {
  return records
    .map((record) => ({
      name: record.name.split("/").pop() ?? record.name,
      path: record.name,
      ...measureBytes(record.code),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function kb(n) {
  return `${(n / 1024).toFixed(2)} kB`;
}

function renderReport(assets) {
  const total = assets.reduce(
    (acc, a) => ({
      bytes: acc.bytes + a.bytes,
      gzipBytes: acc.gzipBytes + a.gzipBytes,
      brotliBytes: acc.brotliBytes + a.brotliBytes,
    }),
    { bytes: 0, gzipBytes: 0, brotliBytes: 0 },
  );
  const payload = JSON.stringify({ assets, total }).replace(/</g, "\\u003c");
  const rows = assets
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.name)}</td><td>${kb(a.bytes)}</td><td>${kb(a.gzipBytes)}</td><td>${kb(a.brotliBytes)}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Cozy AI Studio — bundle report</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font: 14px/1.45 ui-sans-serif, system-ui, sans-serif; background: #f4efe6; color: #1c1915; }
    header { padding: 20px 24px 8px; }
    h1 { font: 700 22px/1.2 ui-serif, Georgia, serif; margin: 0 0 8px; }
    .meta { color: #6b645b; font-size: 13px; }
    #treemap { margin: 12px 24px 20px; height: 420px; border: 1px solid #ddd4c6; background: #fffdf8; position: relative; overflow: hidden; }
    .cell { position: absolute; box-sizing: border-box; border: 1px solid #f4efe6; overflow: hidden; padding: 6px 8px; color: #fffdf8; cursor: default; }
    .cell span { display: block; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    table { width: calc(100% - 48px); margin: 0 24px 32px; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd4c6; }
    th { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #6b645b; }
    td:nth-child(2), td:nth-child(3), td:nth-child(4), th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <header>
    <h1>Bundle report</h1>
    <p class="meta">Raw ${kb(total.bytes)} · gzip ${kb(total.gzipBytes)} · brotli ${kb(total.brotliBytes)} · ${assets.length} assets</p>
  </header>
  <div id="treemap" role="img" aria-label="Bundle treemap"></div>
  <table>
    <thead><tr><th>Asset</th><th>Raw</th><th>Gzip</th><th>Brotli</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>
    const DATA = ${payload};
    const root = document.getElementById("treemap");
    const palette = ["#c45c38", "#1c1915", "#8a5a3a", "#4a433c", "#b07050", "#2c2824"];
    function squarify(items, x, y, w, h) {
      const total = items.reduce((s, i) => s + i.bytes, 0) || 1;
      let offset = 0;
      const vertical = w >= h;
      items.forEach((item, idx) => {
        const share = item.bytes / total;
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.background = palette[idx % palette.length];
        if (vertical) {
          const cw = share * w;
          cell.style.left = x + offset + "px";
          cell.style.top = y + "px";
          cell.style.width = cw + "px";
          cell.style.height = h + "px";
          offset += cw;
        } else {
          const ch = share * h;
          cell.style.left = x + "px";
          cell.style.top = y + offset + "px";
          cell.style.width = w + "px";
          cell.style.height = ch + "px";
          offset += ch;
        }
        cell.title = item.name + " — raw " + (item.bytes/1024).toFixed(2) + " kB, gzip " + (item.gzipBytes/1024).toFixed(2) + " kB, brotli " + (item.brotliBytes/1024).toFixed(2) + " kB";
        cell.innerHTML = "<span>" + item.name + "</span><span>" + (item.gzipBytes/1024).toFixed(1) + " kB gz</span>";
        root.appendChild(cell);
      });
    }
    const rect = root.getBoundingClientRect();
    squarify(DATA.assets, 0, 0, rect.width, rect.height);
  </script>
</body>
</html>
`;
}

export function writeBundleReport(assets, root = ROOT) {
  const dist = join(root, "dist");
  mkdirSync(dist, { recursive: true });
  const meta = {
    generatedAt: new Date().toISOString(),
    assets,
    total: assets.reduce(
      (acc, a) => ({
        bytes: acc.bytes + a.bytes,
        gzipBytes: acc.gzipBytes + a.gzipBytes,
        brotliBytes: acc.brotliBytes + a.brotliBytes,
      }),
      { bytes: 0, gzipBytes: 0, brotliBytes: 0 },
    ),
  };
  writeFileSync(join(dist, "bundlemeta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  writeFileSync(join(dist, "report.html"), renderReport(assets));
  return meta;
}

export function writeBundleReportFromChunks(records, root = ROOT) {
  return writeBundleReport(collectFromChunks(records), root);
}

export function analyzeFromDisk(root = ROOT) {
  const assets = collectClientAssets(root);
  if (assets.length === 0) {
    throw new Error("[analyze] no client assets found — run npm run build first");
  }
  return writeBundleReport(assets, root);
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    const meta = analyzeFromDisk();
    console.log(
      `[analyze] dist/report.html (${meta.assets.length} assets, gzip ${(meta.total.gzipBytes / 1024).toFixed(1)} kB)`,
    );
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
