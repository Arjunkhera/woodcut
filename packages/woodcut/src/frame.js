/*
 * woodcut — the shared figure frame.
 *
 * Every diagram type extends WoodcutFigure and inherits the full
 * interaction chrome: hover cards, fullscreen expand with a detail
 * rail and zoom, the variant dropdown, and scenario replay with the
 * numbered dial. A new diagram type is not done until it carries all
 * four; extending this class is how it carries them.
 */

const EASE = 'cubic-bezier(.23, 1, .32, 1)';
const SVG_NS = 'http://www.w3.org/2000/svg';
const ZOOMS = [1, 1.4, 1.8, 2.2];

const STYLE = `
:host { display: block; font-family: var(--wc-serif, Georgia, serif); color: var(--wc-ink, #1f1f1f); }
* { box-sizing: border-box; }
.mono { font-family: var(--wc-mono, ui-monospace, Menlo, monospace); }
.rule { height: 1px; background: var(--wc-line, #ddd6c8); }
.head { display: flex; justify-content: space-between; align-items: center; padding: 10px 2px; }
.figlabel { font-size: 11px; letter-spacing: 0.12em; color: var(--wc-accent, #6b5640); }
.headright { display: flex; align-items: center; gap: 12px; }
.hint { font-size: 10.5px; color: var(--wc-faint, #9a9a90); }
.iconbtn { width: 28px; height: 28px; border: 1px solid var(--wc-line-strong, #cfc8b8); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--wc-muted, #6d6a60); background: var(--wc-paper, #ffffff); }
.iconbtn.on { border-color: var(--wc-accent, #6b5640); color: var(--wc-accent, #6b5640); background: var(--wc-panel, #f2efe6); }
.variantrow { display: flex; align-items: center; gap: 10px; padding: 2px 2px 12px 2px; }
.klabel { font-size: 10px; letter-spacing: 0.12em; color: var(--wc-faint, #9a9a90); }
.selwrap { position: relative; display: inline-flex; align-items: center; }
.selwrap > svg { position: absolute; right: 10px; pointer-events: none; }
select { appearance: none; -webkit-appearance: none; font-family: var(--wc-mono, ui-monospace, monospace); font-size: 11px; color: var(--wc-body, #33312c); background: var(--wc-paper, #ffffff); border: 1px solid var(--wc-line-strong, #cfc8b8); border-radius: 8px; padding: 5px 28px 5px 12px; cursor: pointer; }
.svgwrap { position: relative; }
svg.diagram { width: 100%; height: auto; display: block; }
.card { position: absolute; width: 260px; background: var(--wc-card, #ffffff); border: 1px solid var(--wc-line, #ddd6c8); border-radius: 8px; box-shadow: 0 3px 12px rgba(20, 16, 8, 0.12); padding: 10px 14px 12px 14px; display: flex; flex-direction: column; gap: 5px; pointer-events: none; z-index: 3; }
.card .t { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; color: var(--wc-accent, #6b5640); }
.card .b { font-size: 13.5px; line-height: 1.5; color: var(--wc-body, #33312c); }
.controls { display: flex; align-items: center; gap: 6px; padding: 10px 2px 4px 2px; }
.nav { width: 22px; height: 22px; border: 1px solid var(--wc-line-strong, #cfc8b8); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--wc-muted, #6d6a60); background: var(--wc-paper, #ffffff); cursor: pointer; }
.nav.off { opacity: 0.4; cursor: default; }
.dial { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; width: 144px; flex-shrink: 0; }
.pip { width: 22px; height: 22px; flex-shrink: 0; border: 1px solid transparent; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10.5px; color: var(--wc-muted, #6d6a60); cursor: pointer; transition: opacity var(--wc-dur-fast, 150ms) ${EASE}; }
.pip.cur { border-color: var(--wc-accent, #6b5640); background: var(--wc-panel, #f2efe6); color: var(--wc-accent, #6b5640); font-weight: 500; }
.pip.fut { opacity: 0.5; }
.stepname { font-size: 11px; color: var(--wc-muted, #6d6a60); margin-left: auto; }
.log { display: flex; flex-direction: column-reverse; gap: 6px; margin: 12px 2px 2px 2px; min-height: 54px; max-height: 62px; overflow-y: auto; scrollbar-width: thin; }
.logrow { display: flex; align-items: baseline; gap: 12px; }
.logrow .n { width: 20px; flex-shrink: 0; font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; color: var(--wc-faint, #9a9a90); }
.logrow .x { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 12px; flex-grow: 1; color: var(--wc-faint, #9a9a90); }
.logrow.cur .n { color: var(--wc-accent, #6b5640); font-weight: 500; }
.logrow.cur .x { color: var(--wc-body, #33312c); }
.caption { font-size: 13px; font-style: italic; color: var(--wc-muted, #6d6a60); padding: 12px 2px 12px 2px; line-height: 1.5; }
.footnote { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10.5px; color: var(--wc-faint, #9a9a90); padding: 0 2px 12px 2px; line-height: 1.6; }
.overlay { position: fixed; inset: 0; background: var(--wc-paper, #ffffff); z-index: 1000; padding: 24px 28px; display: flex; flex-direction: column; gap: 12px; }
.orow { display: flex; gap: 14px; flex-grow: 1; min-height: 0; align-items: stretch; }
.oviewport { flex-grow: 1; min-width: 0; overflow: auto; border: 1px solid var(--wc-line, #ddd6c8); border-radius: 6px; scrollbar-width: thin; }
.rail { width: 220px; flex-shrink: 0; border-left: 2px solid var(--wc-line, #ddd6c8); padding-left: 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
.railhead { display: flex; justify-content: space-between; align-items: center; }
.railtag { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; color: var(--wc-muted, #6d6a60); }
.railt { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; color: var(--wc-accent, #6b5640); }
.railb { font-size: 13.5px; line-height: 1.5; color: var(--wc-body, #33312c); }
.railmin { width: 28px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
.dash { cursor: pointer; padding: 2px; color: var(--wc-faint, #9a9a90); }
.zpct { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 11px; color: var(--wc-muted, #6d6a60); width: 42px; text-align: center; font-variant-numeric: tabular-nums; }
.fitbtn { width: auto; padding: 0 8px; font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; }
svg.diagram [data-card-id] { cursor: help; }
svg.diagram .wc-el { transition: opacity var(--wc-dur-base, 220ms) ${EASE}; }
svg.diagram .wc-el.future { opacity: 0.55; }
svg.diagram .wc-node .body { fill: none; stroke: var(--wc-line-strong, #cfc8b8); stroke-width: 1.4; transition: fill var(--wc-dur-base, 220ms) ${EASE}, stroke var(--wc-dur-base, 220ms) ${EASE}; }
svg.diagram .wc-node.k-focus .body, svg.diagram .wc-node.active .body { fill: var(--wc-panel, #f2efe6); stroke: var(--wc-accent, #6b5640); stroke-width: 1.5; }
svg.diagram .wc-node.k-dim { opacity: 0.55; }
svg.diagram .wc-node .lbl { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 11px; font-weight: 500; fill: var(--wc-ink, #1f1f1f); }
svg.diagram .wc-node .sub { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 9.5px; fill: var(--wc-faint, #9a9a90); }
svg.diagram .wc-node .ring { fill: none; stroke: var(--wc-line-strong, #cfc8b8); stroke-width: 1; transition: stroke var(--wc-dur-base, 220ms) ${EASE}; }
svg.diagram .wc-node.active .ring { stroke: var(--wc-accent, #6b5640); }
svg.diagram .wc-node .dot { fill: var(--wc-line-strong, #cfc8b8); transition: fill var(--wc-dur-base, 220ms) ${EASE}; }
svg.diagram .wc-node.active .dot { fill: var(--wc-accent, #6b5640); }
svg.diagram .wc-edge { color: var(--wc-faint, #9a9a90); }
svg.diagram .wc-edge.k-accent, svg.diagram .wc-edge.active { color: var(--wc-accent, #6b5640); }
svg.diagram .wc-edge.future { opacity: 0.5; }
svg.diagram .wc-edge .stroke { stroke: currentColor; fill: none; stroke-width: 1.4; transition: stroke-width var(--wc-dur-fast, 150ms) ${EASE}; }
svg.diagram .wc-edge:hover .stroke { stroke-width: 2.2; }
svg.diagram .wc-edge .tip { fill: currentColor; }
svg.diagram .wc-edge .elbl { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 9.5px; font-weight: 500; fill: currentColor; }
svg.diagram .hit { stroke: transparent; stroke-width: 14; fill: none; }
svg.diagram .grp { fill: none; stroke: var(--wc-faint, #9a9a90); stroke-width: 1; stroke-dasharray: 4 4; }
svg.diagram .grplbl { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 9.5px; letter-spacing: 0.12em; fill: var(--wc-faint, #9a9a90); }
svg.diagram .grpbg { fill: var(--wc-paper, #ffffff); }
svg.diagram .badge { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; font-weight: 500; fill: var(--wc-faint, #9a9a90); opacity: 0; transition: opacity var(--wc-dur-base, 220ms) ${EASE}; }
svg.diagram .badge.show { opacity: 1; }
svg.diagram .badge.cur { fill: var(--wc-accent, #6b5640); }
@media (prefers-reduced-motion: reduce) {
  svg.diagram .wc-el, svg.diagram .wc-node .body, svg.diagram .badge, .pip { transition: none !important; }
}
`;

const icon = (path, size = 13) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">${path}</svg>`;
const EXPAND_ICON = icon('<path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9.5 6.5M2.5 13.5l4-4"></path>');
const CLOSE_ICON = icon('<path d="M4 4l8 8M12 4l-8 8"></path>');
const PLAY_ICON = icon('<path d="M5.5 3.5v9l7-4.5z"></path>');
const PREV_ICON = icon('<path d="M10 3l-5 5 5 5"></path>', 11);
const NEXT_ICON = icon('<path d="M6 3l5 5-5 5"></path>', 11);
const RAIL_ICON = icon('<rect x="2" y="3" width="12" height="10" rx="1.5"></rect><path d="M10.5 3v10"></path>');

export class WoodcutFigure extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.st = { variant: 0, step: 1, playing: false, expanded: false, railOpen: true, zoom: 0, detail: null };
    this.timer = null;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.onKey = (e) => { if (e.key === 'Escape') this.setExpanded(false); };
  }

  connectedCallback() {
    const script = this.querySelector('script[type="application/json"]');
    this.data = script ? JSON.parse(script.textContent) : {};
    this.renderShell();
  }

  disconnectedCallback() {
    this.stopPlay();
    removeEventListener('keydown', this.onKey);
  }

  /* Subclasses implement: return an <svg class="diagram"> for one variant. */
  buildSvg(_variantData) { throw new Error('woodcut: buildSvg not implemented'); }

  get variantData() { return (this.data.variants || [this.data])[this.st.variant]; }
  get scenarios() { return this.variantData.scenarios || []; }
  get scenario() { return this.scenarios[this.st.scenario || 0]; }
  get maxStep() { return this.scenario ? this.scenario.steps.length : 0; }

  /* ---------- shell ---------- */

  renderShell() {
    const d = this.data;
    const root = this.shadowRoot;
    root.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = STYLE;
    root.appendChild(style);

    root.appendChild(this.el('div', 'rule'));
    const head = this.el('div', 'head');
    head.appendChild(this.el('div', 'figlabel mono', d.label || ''));
    const right = this.el('div', 'headright');
    if (d.hint) right.appendChild(this.el('div', 'hint mono', d.hint));
    this.expandBtn = this.el('div', 'iconbtn');
    this.expandBtn.title = 'Expand the figure';
    this.expandBtn.innerHTML = EXPAND_ICON;
    this.expandBtn.onclick = () => this.setExpanded(!this.st.expanded);
    right.appendChild(this.expandBtn);
    head.appendChild(right);
    root.appendChild(head);

    const variants = d.variants || [];
    const pickers = [];
    if (variants.length > 1) pickers.push({ label: 'VIEW', get: () => this.st.variant, opts: variants.map((v) => v.name), set: (i) => this.setVariant(i) });
    this.svgHolder = this.el('div', 'svgwrap');
    if (this.scenariosOf(0).length > 1) pickers.push({ label: 'SCENARIO', get: () => this.st.scenario || 0, opts: this.scenariosOf(this.st.variant).map((s) => s.name), set: (i) => this.setScenario(i) });
    if (pickers.length || this.scenariosOf(this.st.variant).length) {
      const row = this.el('div', 'variantrow');
      for (const p of pickers) {
        row.appendChild(this.el('div', 'klabel mono', p.label));
        row.appendChild(this.select(p));
      }
      if (this.scenariosOf(this.st.variant).length) {
        const spacer = this.el('div'); spacer.style.flexGrow = '1';
        row.appendChild(spacer);
        this.playBtn = this.el('div', 'iconbtn');
        this.playBtn.title = 'Replay the scenario';
        this.playBtn.innerHTML = PLAY_ICON;
        this.playBtn.onclick = () => this.togglePlay();
        row.appendChild(this.playBtn);
      }
      root.appendChild(row);
    }

    root.appendChild(this.svgHolder);

    this.controlsHost = this.el('div');
    root.appendChild(this.controlsHost);

    this.captionEl = this.el('div', 'caption');
    root.appendChild(this.captionEl);
    if (d.footnote) root.appendChild(this.el('div', 'footnote mono', d.footnote));
    root.appendChild(this.el('div', 'rule'));

    this.card = this.el('div', 'card');
    this.card.style.display = 'none';
    this.card.innerHTML = '<div class="t"></div><div class="b"></div>';
    this.svgHolder.appendChild(this.card);

    this.rebuildDiagram();
  }

  scenariosOf(i) { return ((this.data.variants || [this.data])[i] || {}).scenarios || []; }

  select(p) {
    const wrap = this.el('span', 'selwrap');
    const sel = document.createElement('select');
    p.opts.forEach((name, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = name;
      if (i === p.get()) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = () => p.set(Number(sel.value));
    wrap.appendChild(sel);
    wrap.insertAdjacentHTML('beforeend', '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" style="color: var(--wc-faint, #9a9a90)"><path d="M2 3.5l3 3 3-3"></path></svg>');
    return wrap;
  }

  /* ---------- diagram ---------- */

  rebuildDiagram() {
    if (this.svg) this.svg.remove();
    this.svg = this.buildSvg(this.variantData);
    this.svg.classList.add('diagram');
    this.svgHolder.insertBefore(this.svg, this.card);
    this.wireCards(this.svg);
    this.captionEl.textContent = this.variantData.caption || this.data.caption || '';
    this.renderControls();
    this.applyStep();
    if (this.st.detail && !this.svg.querySelector(`[data-card-id="${this.st.detail.id}"]`)) {
      this.st.detail = null;
      this.updateRail();
    }
  }

  wireCards(svg) {
    svg.querySelectorAll('[data-card-id]').forEach((elm) => {
      elm.addEventListener('mouseenter', () => this.showCard(elm));
      elm.addEventListener('mouseleave', () => this.hideCard());
    });
  }

  showCard(elm) {
    const id = elm.getAttribute('data-card-id');
    const card = (this.cardsById || {})[id];
    if (!card) return;
    this.st.detail = { id, title: card.title, body: card.body };
    if (this.st.expanded) { this.updateRail(); return; }
    this.card.querySelector('.t').textContent = card.title;
    this.card.querySelector('.b').textContent = card.body;
    this.card.style.display = 'flex';
    const wrap = this.svgHolder.getBoundingClientRect();
    const box = elm.getBoundingClientRect();
    let left = box.left - wrap.left + box.width / 2 - 130;
    left = Math.max(0, Math.min(left, wrap.width - 260));
    let top = box.bottom - wrap.top + 6;
    this.card.style.left = left + 'px';
    this.card.style.top = top + 'px';
    const ch = this.card.getBoundingClientRect().height;
    if (box.bottom + 6 + ch > wrap.bottom && box.top - wrap.top - ch - 6 >= 0) {
      this.card.style.top = box.top - wrap.top - ch - 6 + 'px';
    }
  }

  hideCard() { this.card.style.display = 'none'; }

  /* ---------- replay ---------- */

  renderControls() {
    this.controlsHost.innerHTML = '';
    if (!this.scenario) return;
    const row = this.el('div', 'controls');
    this.prevBtn = this.el('div', 'nav'); this.prevBtn.innerHTML = PREV_ICON; this.prevBtn.title = 'Previous step';
    this.prevBtn.onclick = () => this.setStep(this.st.step - 1);
    this.nextBtn = this.el('div', 'nav'); this.nextBtn.innerHTML = NEXT_ICON; this.nextBtn.title = 'Next step';
    this.nextBtn.onclick = () => this.setStep(this.st.step + 1);
    this.dial = this.el('div', 'dial');
    for (let i = 1; i <= this.maxStep; i++) {
      const pip = this.el('div', 'pip mono', String(i));
      pip.onclick = () => this.setStep(i);
      this.dial.appendChild(pip);
    }
    this.stepName = this.el('div', 'stepname mono');
    row.append(this.prevBtn, this.dial, this.nextBtn, this.stepName);
    this.controlsHost.appendChild(row);
    this.logEl = this.el('div', 'log');
    this.controlsHost.appendChild(this.logEl);
  }

  setScenario(i) {
    this.stopPlay();
    this.st.scenario = i;
    this.st.step = 1;
    this.renderControls();
    this.applyStep();
  }

  setVariant(i) {
    this.stopPlay();
    this.st.variant = i;
    this.st.step = 1;
    this.st.scenario = 0;
    this.hideCard();
    this.rebuildDiagram();
  }

  setStep(n) {
    this.stopPlay();
    this.st.step = Math.max(1, Math.min(n, this.maxStep));
    this.applyStep();
  }

  togglePlay() {
    if (this.st.playing) { this.stopPlay(); return; }
    if (this.reduced) { this.setStep(this.maxStep); return; }
    this.st.step = 1;
    this.st.playing = true;
    this.applyStep();
    this.timer = setInterval(() => {
      if (this.st.step >= this.maxStep) { this.stopPlay(); return; }
      this.st.step += 1;
      this.applyStep();
    }, 700);
  }

  stopPlay() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.st.playing = false;
    if (this.playBtn) this.playBtn.classList.remove('on');
  }

  applyStep() {
    if (this.playBtn) this.playBtn.classList.toggle('on', this.st.playing);
    if (!this.scenario) return;
    const steps = this.scenario.steps;
    const s = this.st.step;
    const seen = {};
    for (let i = 0; i < s; i++) (steps[i].active || []).forEach((id) => { seen[id] = i + 1; });
    const now = steps[s - 1].active || [];
    this.svg.querySelectorAll('[data-el]').forEach((elm) => {
      const id = elm.getAttribute('data-el');
      elm.classList.toggle('active', now.includes(id));
      elm.classList.toggle('future', !seen[id]);
    });
    this.svg.querySelectorAll('.badge').forEach((b) => {
      const id = b.getAttribute('data-badge-for');
      b.textContent = seen[id] ? String(seen[id]) : '';
      b.classList.toggle('show', !!seen[id]);
      b.classList.toggle('cur', now.includes(id));
    });
    if (this.dial) {
      [...this.dial.children].forEach((pip, i) => {
        pip.classList.toggle('cur', i + 1 === s);
        pip.classList.toggle('fut', i + 1 > s);
      });
      const cur = this.dial.children[s - 1];
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (this.prevBtn) this.prevBtn.classList.toggle('off', s === 1);
    if (this.nextBtn) this.nextBtn.classList.toggle('off', s === this.maxStep);
    if (this.stepName) this.stepName.textContent = steps[s - 1].name || '';
    if (this.logEl) {
      this.logEl.innerHTML = '';
      for (let i = s - 1; i >= 0; i--) {
        const row = this.el('div', 'logrow' + (i === s - 1 ? ' cur' : ''));
        row.appendChild(this.el('div', 'n', String(i + 1).padStart(2, '0')));
        row.appendChild(this.el('div', 'x', steps[i].log || ''));
        this.logEl.appendChild(row);
      }
    }
    this.updateRail();
  }

  /* ---------- expand ---------- */

  setExpanded(on) {
    if (on === this.st.expanded) return;
    this.st.expanded = on;
    this.expandBtn.classList.toggle('on', on);
    if (on) {
      this.hideCard();
      this.overlay = this.el('div', 'overlay');
      const head = this.el('div', 'head');
      head.appendChild(this.el('div', 'figlabel mono', this.data.label || ''));
      const right = this.el('div', 'headright');
      const zout = this.el('div', 'nav'); zout.innerHTML = icon('<path d="M3 8h10"></path>', 11); zout.title = 'Zoom out';
      zout.onclick = () => this.setZoom(this.st.zoom - 1);
      this.zpct = this.el('div', 'zpct mono');
      const zin = this.el('div', 'nav'); zin.innerHTML = icon('<path d="M8 3v10M3 8h10"></path>', 11); zin.title = 'Zoom in';
      zin.onclick = () => this.setZoom(this.st.zoom + 1);
      const fit = this.el('div', 'nav fitbtn', 'fit'); fit.title = 'Fit';
      fit.onclick = () => this.setZoom(0);
      const close = this.el('div', 'iconbtn'); close.innerHTML = CLOSE_ICON; close.title = 'Close (Esc)';
      close.onclick = () => this.setExpanded(false);
      right.append(zout, this.zpct, zin, fit, close);
      head.appendChild(right);
      this.overlay.appendChild(head);
      const row = this.el('div', 'orow');
      this.viewport = this.el('div', 'oviewport');
      row.appendChild(this.viewport);
      this.railHost = this.el('div');
      this.railHost.style.display = 'contents';
      row.appendChild(this.railHost);
      this.overlay.appendChild(row);
      if (this.scenario) {
        const c = this.controlsHost;
        this.controlsPlaceholder = document.createComment('controls');
        c.parentNode.insertBefore(this.controlsPlaceholder, c);
        this.overlay.appendChild(c);
      }
      this.shadowRoot.appendChild(this.overlay);
      this.svgPlaceholder = document.createComment('svg');
      this.svg.parentNode.insertBefore(this.svgPlaceholder, this.svg);
      this.viewport.appendChild(this.svg);
      addEventListener('keydown', this.onKey);
      this.setZoom(this.st.zoom);
      this.updateRail();
    } else {
      removeEventListener('keydown', this.onKey);
      this.svg.style.width = '';
      this.svgPlaceholder.parentNode.replaceChild(this.svg, this.svgPlaceholder);
      if (this.controlsPlaceholder) {
        this.controlsPlaceholder.parentNode.replaceChild(this.controlsHost, this.controlsPlaceholder);
        this.controlsPlaceholder = null;
      }
      this.overlay.remove();
      this.overlay = null;
    }
  }

  setZoom(i) {
    this.st.zoom = Math.max(0, Math.min(i, ZOOMS.length - 1));
    if (!this.overlay) return;
    const base = this.viewport.getBoundingClientRect().width - 2;
    this.svg.style.width = Math.round(base * ZOOMS[this.st.zoom]) + 'px';
    this.zpct.textContent = Math.round(ZOOMS[this.st.zoom] * 100) + '%';
  }

  updateRail() {
    if (!this.overlay || !this.railHost) return;
    this.railHost.innerHTML = '';
    if (!this.st.railOpen) {
      const min = this.el('div', 'railmin');
      const btn = this.el('div', 'iconbtn'); btn.innerHTML = RAIL_ICON; btn.title = 'Show the detail rail';
      btn.onclick = () => { this.st.railOpen = true; this.updateRail(); };
      min.appendChild(btn);
      this.railHost.appendChild(min);
      return;
    }
    const rail = this.el('div', 'rail');
    const head = this.el('div', 'railhead');
    head.appendChild(this.el('div', 'railtag', 'DETAIL'));
    const dash = this.el('div', 'dash'); dash.title = 'Hide the rail';
    dash.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6h8"></path></svg>';
    dash.onclick = () => { this.st.railOpen = false; this.updateRail(); };
    head.appendChild(dash);
    rail.appendChild(head);
    rail.appendChild(this.el('div', 'railt', this.st.detail ? this.st.detail.title : '—'));
    rail.appendChild(this.el('div', 'railb', this.st.detail ? this.st.detail.body : 'Hover any element to read about it.'));
    if (this.scenario) {
      rail.appendChild(this.el('div', 'railtag', 'EVENTS'));
      for (let i = 0; i < this.st.step; i++) {
        const row = this.el('div', 'logrow' + (i === this.st.step - 1 ? ' cur' : ''));
        row.appendChild(this.el('div', 'n', String(i + 1).padStart(2, '0')));
        row.appendChild(this.el('div', 'x', this.scenario.steps[i].log || ''));
        rail.appendChild(row);
      }
    }
    this.railHost.appendChild(rail);
  }

  /* ---------- helpers for subclasses ---------- */

  el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  s(tag, attrs = {}) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  sText(x, y, text, cls, anchor = 'middle') {
    const t = this.s('text', { x, y, 'text-anchor': anchor });
    if (cls) t.setAttribute('class', cls);
    t.textContent = text;
    return t;
  }

  /* Arrowhead at `tip` pointing along unit-ish direction `dir`. */
  sTip(tip, dir) {
    const [tx, ty] = tip;
    const len = Math.hypot(dir[0], dir[1]) || 1;
    const ux = dir[0] / len, uy = dir[1] / len;
    const bx = tx - 8 * ux, by = ty - 8 * uy;
    const px = -uy * 4, py = ux * 4;
    return this.s('polygon', { points: `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`, class: 'tip' });
  }

  /* Registers cards for wireCards/showCard. */
  setCards(map) { this.cardsById = map; }
}
