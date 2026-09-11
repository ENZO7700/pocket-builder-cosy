import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanDist, scanSrc } from "./check-client-boundary.mjs";

describe("check-client-boundary script", () => {
  it("passes the real src graph", () => {
    const result = scanSrc();
    assert.equal(result.ok, true, result.errors.join("\n"));
    assert.ok(result.files > 5);
  });

  it("fails dist JS that contains createRequire", () => {
    const dir = mkdtempSync(join(tmpdir(), "boundary-"));
    const assets = join(dir, "assets");
    mkdirSync(assets);
    writeFileSync(
      join(assets, "index.js"),
      'import { createRequire } from "node:module";\n',
    );
    const result = scanDist([dir]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("createRequire")));
  });
});
