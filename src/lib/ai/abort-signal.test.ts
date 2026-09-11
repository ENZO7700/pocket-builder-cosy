import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  abortKind,
  combineAbortSignals,
  isAbortError,
} from "./abort-signal.ts";

describe("abort-signal", () => {
  it("treats AbortError as abort", () => {
    const err = new DOMException("Aborted", "AbortError");
    assert.equal(isAbortError(err), true);
    assert.equal(isAbortError(new Error("boom")), false);
  });

  it("classifies timeout vs cancel", async () => {
    const user = new AbortController();
    user.abort();
    assert.equal(abortKind(user.signal), "cancel");

    const timeout = AbortSignal.timeout(1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(timeout.aborted, true);
    assert.equal(abortKind(timeout), "timeout");
  });

  it("combineAbortSignals aborts when either fires", async () => {
    const a = new AbortController();
    const b = new AbortController();
    const combined = combineAbortSignals(a.signal, b.signal);
    assert.equal(combined.aborted, false);
    b.abort();
    assert.equal(combined.aborted, true);
  });
});
