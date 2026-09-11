import { BOUNDARY_STUB_SENTINEL } from "./assert-client-boundary.ts";

/**
 * Tooling-only stub (vite / rolldown). Not used for pg / node:module —
 * those must fail the client build instead of disappearing into `{}`.
 */
export function toolingStubSource(id: string): string {
  const spec = JSON.stringify(id);
  return `/* ${BOUNDARY_STUB_SENTINEL} */
const err = () => {
  throw new Error("[client-boundary] " + ${spec} + " is bundler tooling and is not available in the browser");
};
export default new Proxy({}, { get: err });
export const createRequire = err;
`;
}

/**
 * Last-resort guard if a Node builtin still resolves on the client.
 * createRequire is a throwing function (not undefined) so a leak surfaces as
 * a readable error instead of "createRequire is not a function".
 */
export function nodeGuardSource(id: string): string {
  const spec = JSON.stringify(id);
  return `/* ${BOUNDARY_STUB_SENTINEL} */
function fail(key) {
  throw new Error("[client-boundary] Node API " + ${spec} + (key ? "." + key : "") + " cannot run in the browser");
}
export function createRequire() {
  return new Proxy(function () {}, { apply: () => fail("createRequire()"), get: (_, key) => fail(String(key)) });
}
export default new Proxy({}, { get: (_, key) => fail(String(key)) });
`;
}

/** Client stand-in for a dual-module `import("./x.server")`. No Node APIs. */
export function emptyServerStubSource(): string {
  return "export {};\n";
}
