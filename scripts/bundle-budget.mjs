#!/usr/bin/env node
/**
 * Fail the job when client chunks exceed bundle-budget.json.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeFromDisk, collectClientAssets } from "./analyze-bundle.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");

export function loadBudget(root = ROOT) {
  const path = join(root, "bundle-budget.json");
  if (!existsSync(path)) throw new Error(`[check:budget] missing ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

export function classifyAssets(assets) {
  const js = assets.filter((a) => /\.m?js$/.test(a.name));
  const main =
    js.find((a) => /^index-/.test(a.name)) ??
    js.slice().sort((a, b) => b.bytes - a.bytes)[0] ??
    null;
  const studio =
    js.find((a) => /^studio-/.test(a.name) && !/^studio-store-/.test(a.name)) ??
    null;
  const total = js.reduce(
    (acc, a) => ({
      bytes: acc.bytes + a.bytes,
      gzipBytes: acc.gzipBytes + a.gzipBytes,
    }),
    { bytes: 0, gzipBytes: 0 },
  );
  return { main, studio, total };
}

export function evaluateBudget(assets, budget) {
  const { main, studio, total } = classifyAssets(assets);
  const errors = [];
  const check = (label, actual, limit) => {
    if (typeof limit !== "number") return;
    if (actual > limit) {
      errors.push(
        `${label}: ${actual} bytes > budget ${limit} bytes`,
      );
    }
  };
  if (main) {
    check("main chunk raw", main.bytes, budget.mainChunkBytes);
    check("main chunk gzip", main.gzipBytes, budget.mainChunkGzipBytes);
  } else {
    errors.push("main chunk (index-*.js) not found");
  }
  if (studio) {
    check("studio chunk raw", studio.bytes, budget.studioChunkBytes);
    check("studio chunk gzip", studio.gzipBytes, budget.studioChunkGzipBytes);
  } else {
    errors.push("studio chunk (studio-*.js) not found");
  }
  check("total client JS raw", total.bytes, budget.totalClientBytes);
  check("total client JS gzip", total.gzipBytes, budget.totalClientGzipBytes);
  return { ok: errors.length === 0, errors, main, studio, total };
}

export async function main(root = ROOT) {
  const budget = loadBudget(root);
  let assets = collectClientAssets(root);
  if (assets.length === 0 && existsSync(join(root, "dist", "bundlemeta.json"))) {
    const meta = JSON.parse(readFileSync(join(root, "dist", "bundlemeta.json"), "utf8"));
    assets = meta.assets ?? [];
  }
  if (assets.length === 0) {
    console.error("[check:budget] no client assets — run npm run build first");
    return 1;
  }
  const result = evaluateBudget(assets, budget);
  if (!result.ok) {
    console.error("[check:budget] FAILED");
    for (const err of result.errors) console.error(`  - ${err}`);
    return 1;
  }
  if (!existsSync(join(root, "dist", "report.html"))) {
    analyzeFromDisk(root);
  }
  console.log(
    `[check:budget] ok  main gzip ${result.main?.gzipBytes ?? 0}  studio gzip ${result.studio?.gzipBytes ?? 0}  total gzip ${result.total.gzipBytes}`,
  );
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
