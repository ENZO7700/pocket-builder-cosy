import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { scanClientBundle, scanFile } from "./check-bundle.mjs";

test("scanFile reports file and line for createRequire", () => {
  const hits = scanFile("const x = 1;\nimport { createRequire } from 'module';\n", "chunk.js");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 2);
  assert.equal(hits[0].id, "createRequire");
});

test("scanClientBundle fails a planted leak under dist/client", () => {
  const root = mkdtempSync(join(tmpdir(), "bundle-"));
  const dir = join(root, "dist", "client");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "app.js"), "export const ok = 1;\nimport { createRequire } from 'node:module';\n");
  const { hits } = scanClientBundle(root);
  assert.ok(hits.some((h) => h.id === "createRequire" && h.line === 2));
});

test("clean client JS passes", () => {
  const hits = scanFile("export const n = 1;\n", "clean.js");
  assert.equal(hits.length, 0);
});
