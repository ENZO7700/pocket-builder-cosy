import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PREVIEW_SANDBOX } from "../../lib/preview/sandbox.ts";

describe("PreviewFrame sandbox", () => {
  it("never grants allow-same-origin next to allow-scripts", () => {
    const tokens = PREVIEW_SANDBOX.split(/\s+/);
    assert.equal(tokens.includes("allow-scripts"), true);
    assert.equal(tokens.includes("allow-forms"), true);
    assert.equal(tokens.includes("allow-same-origin"), false);
  });
});
