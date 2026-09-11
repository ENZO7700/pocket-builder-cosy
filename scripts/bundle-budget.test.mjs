import assert from "node:assert/strict";
import test from "node:test";
import { evaluateBudget } from "./bundle-budget.mjs";

const budget = {
  mainChunkBytes: 1000,
  mainChunkGzipBytes: 400,
  studioChunkBytes: 500,
  studioChunkGzipBytes: 200,
  totalClientBytes: 2000,
  totalClientGzipBytes: 800,
};

test("evaluateBudget passes under the cap", () => {
  const result = evaluateBudget(
    [
      { name: "index-aaaa.js", bytes: 800, gzipBytes: 300, brotliBytes: 250 },
      { name: "studio-bbbb.js", bytes: 200, gzipBytes: 80, brotliBytes: 70 },
    ],
    budget,
  );
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("evaluateBudget fails when main gzip exceeds the cap", () => {
  const result = evaluateBudget(
    [
      { name: "index-aaaa.js", bytes: 800, gzipBytes: 900, brotliBytes: 250 },
      { name: "studio-bbbb.js", bytes: 200, gzipBytes: 80, brotliBytes: 70 },
    ],
    budget,
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("main chunk gzip")));
});
