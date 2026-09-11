import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COZY_SCRIPT_ATTR,
  injectCozyElements,
  cozyElementsScriptTag,
} from "./cozy-elements.ts";

describe("cozy-elements", () => {
  it("injects the runtime before </body>", () => {
    const html = injectCozyElements("<html><body><p>hi</p></body></html>");
    assert.match(html, new RegExp(COZY_SCRIPT_ATTR));
    assert.match(html, /customElements\.define/);
    assert.match(html, /cozy-card/);
    assert.ok(html.indexOf("data-cozy-elements") < html.indexOf("</body>"));
  });

  it("replaces an existing runtime instead of duplicating", () => {
    const once = injectCozyElements("<body></body>");
    const twice = injectCozyElements(once);
    assert.equal(twice.split(COZY_SCRIPT_ATTR).length - 1, 1);
    assert.equal(twice.includes(cozyElementsScriptTag().slice(0, 40)), true);
  });
});
