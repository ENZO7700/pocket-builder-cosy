/** Cozy preview Web Components runtime. Injected into generated HTML. No CDNs. */

export const COZY_SCRIPT_ATTR = "data-cozy-elements";

export const COZY_ELEMENTS_SOURCE = `(() => {
  const def = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };
  const sheet = (css) => "<style>" + css + "</style>";

  class CozyApp extends HTMLElement {
    constructor() {
      super();
      const r = this.attachShadow({ mode: "open" });
      r.innerHTML = sheet(\`:host{display:block;min-height:100%;background:#f4efe6;color:#1c1915;font-family:Palatino,Georgia,serif}
.wrap{max-width:1080px;margin:0 auto;padding:20px 16px 40px}
.kicker{letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:#8a7f70;margin:0 0 8px;font-family:system-ui,sans-serif}
h1{font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.12;margin:0 0 8px;font-weight:600}
.lede{font-family:system-ui,sans-serif;color:#4a433a;font-size:15px;line-height:1.5;margin:0 0 22px}\`) +
        '<div class="wrap"><p class="kicker"></p><h1></h1><p class="lede"></p><slot></slot></div>';
    }
    static get observedAttributes() { return ["kicker", "heading", "lede"]; }
    connectedCallback() { this._sync(); }
    attributeChangedCallback() { this._sync(); }
    _sync() {
      const r = this.shadowRoot;
      const k = this.getAttribute("kicker") || "";
      const h = this.getAttribute("heading") || "";
      const l = this.getAttribute("lede") || "";
      r.querySelector(".kicker").textContent = k;
      r.querySelector(".kicker").hidden = !k;
      r.querySelector("h1").textContent = h;
      r.querySelector("h1").hidden = !h;
      r.querySelector(".lede").textContent = l;
      r.querySelector(".lede").hidden = !l;
    }
  }

  class CozyBoard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).innerHTML =
        sheet(\`:host{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}\`) + "<slot></slot>";
    }
  }

  class CozyColumn extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).innerHTML =
        sheet(\`:host{display:block;flex:1;min-width:200px;background:#fbf7f0;border:1px solid #ddd4c6;border-radius:16px;padding:14px}
h2{margin:0 0 10px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8a7f70;font-family:system-ui,sans-serif}\`) +
        "<h2></h2><slot></slot>";
    }
    static get observedAttributes() { return ["name"]; }
    connectedCallback() { this._sync(); }
    attributeChangedCallback() { this._sync(); }
    _sync() { this.shadowRoot.querySelector("h2").textContent = this.getAttribute("name") || ""; }
  }

  class CozyCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).innerHTML =
        sheet(\`:host{display:block;margin-top:10px;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #ddd4c6;font-family:system-ui,sans-serif;font-size:14px;line-height:1.4}
.p{display:inline-block;margin:0 0 6px;padding:2px 8px;border-radius:999px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:#c45c38;color:#fff7f0}
.p[hidden]{display:none}\`) +
        '<span class="p" hidden></span><slot></slot>';
    }
    static get observedAttributes() { return ["priority"]; }
    connectedCallback() { this._sync(); }
    attributeChangedCallback() { this._sync(); }
    _sync() {
      const p = (this.getAttribute("priority") || "").trim();
      const el = this.shadowRoot.querySelector(".p");
      el.textContent = p;
      el.hidden = !p;
    }
  }

  class CozyChip extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).innerHTML =
        sheet(\`:host{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#c45c38;color:#fff7f0;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.08em;text-transform:uppercase}\`) +
        "<slot></slot>";
    }
  }

  class CozyBtn extends HTMLElement {
    static formAssociated = true;
    constructor() {
      super();
      this._i = this.attachInternals();
      const r = this.attachShadow({ mode: "open" });
      r.innerHTML = sheet(\`:host{display:inline-flex}button{font-family:system-ui,sans-serif;font-weight:600;font-size:13px;border:0;padding:10px 14px;border-radius:12px;min-height:40px;cursor:pointer;background:#c45c38;color:#fff7f0}button.ghost{background:transparent;color:#1c1915;box-shadow:0 0 0 1px #ddd4c6}button:disabled{opacity:.5;cursor:default}\`) +
        '<button part="btn" type="button"><slot></slot></button>';
      this._btn = r.querySelector("button");
      this._btn.addEventListener("click", () => {
        if ((this.getAttribute("type") || "button") === "submit") this._i.form && this._i.form.requestSubmit();
      });
    }
    static get observedAttributes() { return ["variant", "disabled"]; }
    connectedCallback() { this._sync(); }
    attributeChangedCallback() { this._sync(); }
    _sync() {
      this._btn.className = this.getAttribute("variant") === "ghost" ? "ghost" : "";
      this._btn.disabled = this.hasAttribute("disabled");
    }
  }

  class CozyMsg extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).innerHTML =
        sheet(\`:host{display:block;max-width:80%;padding:10px 12px;border-radius:14px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;background:#fff;border:1px solid #ddd4c6}
:host([role="user"]){margin-left:auto;background:#c45c38;color:#fff7f0;border-color:#c45c38}\`) +
        "<slot></slot>";
    }
  }

  def("cozy-app", CozyApp);
  def("cozy-board", CozyBoard);
  def("cozy-column", CozyColumn);
  def("cozy-card", CozyCard);
  def("cozy-chip", CozyChip);
  def("cozy-btn", CozyBtn);
  def("cozy-msg", CozyMsg);
})();`;

const SCRIPT_RE = /<script\s+data-cozy-elements\b[^>]*>[\s\S]*?<\/script>/i;

export function cozyElementsScriptTag(): string {
  return `<script ${COZY_SCRIPT_ATTR}>\n${COZY_ELEMENTS_SOURCE}\n</script>`;
}

export function injectCozyElements(html: string): string {
  const tag = cozyElementsScriptTag();
  if (SCRIPT_RE.test(html)) return html.replace(SCRIPT_RE, tag);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}</body>`);
  return `${html}\n${tag}`;
}

export function ensureCozyElements(doc: Document) {
  const win = doc.defaultView;
  if (!win || win.customElements.get("cozy-app")) {
    try {
      win?.customElements.upgrade(doc.body);
    } catch {
      /* ignore */
    }
    return;
  }
  const script = doc.createElement("script");
  script.setAttribute(COZY_SCRIPT_ATTR, "");
  script.textContent = COZY_ELEMENTS_SOURCE;
  (doc.head || doc.documentElement).appendChild(script);
  try {
    win.customElements.upgrade(doc.body);
  } catch {
    /* ignore */
  }
}
