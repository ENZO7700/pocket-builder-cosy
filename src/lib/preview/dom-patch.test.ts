import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scriptSignature, shouldReloadPreview } from "./dom-patch-utils.ts";

describe("dom-patch", () => {
  it("keeps the frame when only markup and css change", () => {
    const prev = `<!doctype html><html><head><style>h1{font-size:32px}</style></head><body><h1>Board</h1><script>const n=1</script></body></html>`;
    const next = `<!doctype html><html><head><style>h1{font-size:24px}</style></head><body><h1>Board</h1><script>const n=1</script></body></html>`;
    assert.equal(scriptSignature(prev), scriptSignature(next));
    assert.equal(shouldReloadPreview(prev, next), false);
  });

  it("reloads when script bodies change", () => {
    const prev = `<html><body><script>bind()</script></body></html>`;
    const next = `<html><body><script>bind(); extra()</script></body></html>`;
    assert.equal(shouldReloadPreview(prev, next), true);
  });

  it("reloads on empty previous html", () => {
    assert.equal(shouldReloadPreview("", "<html></html>"), true);
  });
});
