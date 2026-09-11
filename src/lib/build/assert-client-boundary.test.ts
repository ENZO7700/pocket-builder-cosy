import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyClientImport,
  clientChunkLeak,
  formatBoundaryError,
  isServerFileName,
  walkImportChain,
} from "./assert-client-boundary.ts";

describe("client boundary", () => {
  it("flags UI imports of *.server.ts", () => {
    const d = classifyClientImport(
      "./generate-guard.server",
      "/workspace/src/components/studio/StudioShell.tsx",
    );
    assert.equal(d.kind, "forbidden");
  });

  it("stubs createServerFn dual imports of *.server.ts on the client", () => {
    const d = classifyClientImport(
      "./generate-guard.server",
      "/workspace/src/lib/ai/generate.ts",
    );
    assert.equal(d.kind, "stub-server");
  });

  it("flags pg from a route", () => {
    const d = classifyClientImport("pg", "/workspace/src/routes/studio.tsx");
    assert.equal(d.kind, "forbidden");
  });

  it("flags node:module from src", () => {
    const d = classifyClientImport(
      "node:module",
      "/workspace/src/stores/studio-store.ts",
    );
    assert.equal(d.kind, "forbidden");
    assert.equal(isServerFileName("foo.server.ts"), true);
  });

  it("stubs vite tooling instead of failing", () => {
    const d = classifyClientImport("vite", "/workspace/src/routes/index.tsx");
    assert.equal(d.kind, "stub-tooling");
  });

  it("formats an import chain", () => {
    const edges = new Map([
      ["/a/StudioShell.tsx", "/a/studio.tsx"],
      ["/a/studio.tsx", "/a/router.tsx"],
    ]);
    const hops = walkImportChain("/a/StudioShell.tsx", edges);
    assert.deepEqual(hops, [
      "/a/StudioShell.tsx",
      "/a/studio.tsx",
      "/a/router.tsx",
    ]);
    const msg = formatBoundaryError(
      {
        kind: "forbidden",
        spec: "node:module",
        reason: "leaked",
      },
      "/a/StudioShell.tsx",
      hops,
    );
    assert.match(msg, /client-boundary/);
    assert.match(msg, /node:module/);
    assert.match(msg, /StudioShell/);
  });

  it("detects createRequire in a client chunk", () => {
    const leak = clientChunkLeak(
      'import { createRequire } from "node:module"',
      "assets/index.js",
    );
    assert.ok(leak);
    assert.match(leak ?? "", /createRequire/);
  });
});
