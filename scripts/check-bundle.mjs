#!/usr/bin/env node
/**
 * Fail if client JS still contains server-only symbols.
 * Scans dist/client plus the Nitro/Vercel client asset folders.
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { clientAssetDirs } from "./analyze-bundle.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");

const FORBIDDEN = [
  { id: "createRequire", re: /createRequire/ },
  { id: "node:module", re: /node:module/ },
  { id: "pg", re: /from\s*['"]pg(?:\/[^'"]*)?['"]|require\(\s*['"]pg['"]\s*\)/ },
  { id: "kysely", re: /from\s*['"]kysely(?:\/[^'"]*)?['"]|require\(\s*['"]kysely['"]\s*\)/ },
  { id: "@electric-sql/pglite", re: /@electric-sql\/pglite/ },
];

const SKIP_DIR = /(?:^|\/)(?:server|nitro|__server|_ssr|functions)(?:\/|$)/;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

export function scanFile(code, file) {
  const hits = [];
  const lines = code.split(/\n/);
  for (const rule of FORBIDDEN) {
    lines.forEach((line, idx) => {
      if (rule.re.test(line)) {
        hits.push({ file, line: idx + 1, id: rule.id, text: line.trim().slice(0, 180) });
      }
    });
  }
  return hits;
}

export function scanClientBundle(root = ROOT) {
  const hits = [];
  const dirs = [join(root, "dist", "client"), ...clientAssetDirs(root)];
  const seen = new Set();
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      if (!/\.(js|mjs|cjs)$/.test(extname(file))) continue;
      const rel = relative(root, file).replace(/\\/g, "/");
      if (SKIP_DIR.test(rel) || seen.has(rel)) continue;
      seen.add(rel);
      hits.push(...scanFile(readFileSync(file, "utf8"), rel));
    }
  }
  return { hits, files: seen.size };
}

export async function main(root = ROOT) {
  const { hits, files } = scanClientBundle(root);
  if (hits.length) {
    console.error("[check:bundle] FAILED — forbidden module in client JS");
    for (const hit of hits) {
      console.error(`  ${hit.file}:${hit.line}  ${hit.id}  ${hit.text}`);
    }
    return 1;
  }
  console.log(`[check:bundle] ok (${files} js files, no forbidden modules)`);
  return 0;
}

const entry = process.argv[1];
if (entry) {
  try {
    if (realpathSync(entry) === fileURLToPath(import.meta.url)) {
      main().then((code) => process.exit(code));
    }
  } catch {
    /* imported */
  }
}
