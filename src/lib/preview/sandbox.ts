/**
 * Sandbox for generated preview HTML.
 *
 * NEVER add `allow-same-origin` next to `allow-scripts`. Together they undo
 * the unique origin and the iframe inherits the parent origin — generated
 * markup could then read `cozy-studio-v1` / `cozy-workspace-v1` from
 * localStorage (classic sandbox bypass).
 *
 * `allow-scripts` is required: Cozy injects a Web Components runtime and
 * generated pages have buttons/forms. `allow-forms` keeps native submits.
 * Origin isolation comes from omitting `allow-same-origin`.
 *
 * A `blob:` URL is created by this document (would inherit our origin), but
 * the sandbox forces an opaque unique origin (`null`). Parent JS cannot
 * read `contentDocument`; preview JS cannot read parent storage.
 */
export const PREVIEW_SANDBOX = "allow-scripts allow-forms";
