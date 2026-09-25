/*
 * woodcut — the shared figure frame.
 *
 * Every diagram type extends WoodcutFigure and inherits the full
 * interaction chrome: hover cards, fullscreen expand with a detail
 * rail and zoom, the variant dropdown, and scenario replay with the
 * numbered dial. A new diagram type is not done until it carries all
 * four; extending this class is how it carries them.
 *
 * Replay also carries narrated walkthroughs. A scenario step may hold
 * a title, a body, a record and a summary table. The frame then shows
 * a narration panel, rings the active element, dims reached ones,
 * draws the active arrow, and can hide elements until their step.
 * Every diagram type gets this, because it lives here.
 */

const EASE = 'cubic-bezier(.23, 1, .32, 1)';
const SVG_NS = 'http://www.w3.org/2000/svg';

/*
 * Zoom is a free scale, not an index. 100% draws the diagram at the
 * natural size of its viewBox. The buttons walk this ladder; the
 * wheel and the trackpad pinch move between the stops.
 */
const ZOOM_STOPS = [0.25, 0.33, 0.5, 0.67, 0.8, 1, 1.25, 1.5, 1.8, 2.2, 3, 4];
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 6;
const clampZoom = (z) => Math.max(ZOOM_MIN, Math.min(z, ZOOM_MAX));

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
.oviewport { flex-grow: 1; min-width: 0; overflow: auto; border: 1px solid var(--wc-line, #ddd6c8); border-radius: 6px; scrollbar-width: thin; overscroll-behavior: contain; }
/* The grab cursor appears only when there is something to pan to. */
.oviewport.pannable { cursor: grab; }
.oviewport.grabbing, .oviewport.grabbing svg.diagram [data-card-id] { cursor: grabbing; }
.oviewport.grabbing svg.diagram { pointer-events: none; }
.ocanvas { min-width: 100%; min-height: 100%; display: flex; padding: 12px; }
/* Auto margins centre the drawing when it is small, and let it
 * overflow to the right when it is large. Centring with
 * justify-content would clip the left edge out of scroll reach. */
.oviewport svg.diagram { flex-shrink: 0; margin: auto; }
.rail { width: 232px; flex-shrink: 0; border-left: 2px solid var(--wc-line, #ddd6c8); padding-left: 14px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
.railtop { display: flex; justify-content: flex-end; }
.sect { display: flex; flex-direction: column; gap: 7px; }
.railtag { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; color: var(--wc-muted, #6d6a60); }
.railt { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10.5px; font-weight: 500; letter-spacing: 0.12em; color: var(--wc-accent, #6b5640); }
.railb { font-size: 13.5px; line-height: 1.5; color: var(--wc-body, #33312c); }
.railmin { width: 28px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
.dash { cursor: pointer; padding: 2px; color: var(--wc-faint, #9a9a90); }
.zpct { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 11px; color: var(--wc-muted, #6d6a60); width: 46px; text-align: center; font-variant-numeric: tabular-nums; }
.fitbtn { width: auto; padding: 0 8px; font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; }
.inoverlay .log { display: none; }
.inoverlay .controls { padding: 4px 2px 0 2px; }
@media (max-width: 640px) {
  .overlay { padding: 16px 12px; }
  .rail { width: 180px; }
}
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
svg.diagram .wc-node .dlbl { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 9.5px; fill: var(--wc-ink, #1f1f1f); }
svg.diagram .enddot { fill: var(--wc-ink, #1f1f1f); }
svg.diagram .endring { fill: none; stroke: var(--wc-ink, #1f1f1f); stroke-width: 1; }
svg.diagram .lane { stroke: var(--wc-line, #e4e1d6); stroke-width: 1; }
svg.diagram .lanelbl { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 9.5px; letter-spacing: 0.12em; fill: var(--wc-faint, #9a9a90); }
svg.diagram .lifeline { stroke: var(--wc-line-strong, #cfc8b8); stroke-width: 1; stroke-dasharray: 3 4; }
svg.diagram .act { fill: var(--wc-panel, #f2efe6); stroke: var(--wc-line-strong, #cfc8b8); stroke-width: 1; }
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

/* ---------- walkthrough: narration beside or under the stage ----------
 * .walk is the size container. It must never hold the overlay: a size
 * container is the containing block for fixed children. */
/* div only: svg.diagram also wears .walk, and size containment on an svg
 * drops its aspect ratio, so it falls to the 150 px default height. */
/* Only a narrated figure is a size container. A size container does
 * not take its width from its content, so a narrated figure needs a
 * definite width from its page (see GRAMMAR.md). Other figures keep
 * the layout they had before. */
div.walk { width: 100%; }
div.walk.narrated { container-type: inline-size; }
.walkgrid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
.walkgrid.solo { display: block; }
.stagecol { min-width: 0; }
.svgwrap:focus { outline: none; }
.svgwrap:focus-visible { outline: 2px solid var(--wc-accent, CanvasText); outline-offset: 4px; border-radius: 4px; }
.svgwrap svg.diagram.stepable { cursor: pointer; }
/* The layout follows the width of the figure, not the window. Under
 * 860 px the diagram keeps the full width and the panel sits under
 * it: the pills on top, then the prose and the record side by side
 * when there is room. From 860 px the panel moves to the right of the
 * diagram, and the diagram keeps close to its natural 600 px. */
.narr { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px 24px; align-items: start; border-top: 1px solid var(--wc-line); padding: 12px 2px 6px 2px; min-width: 0; }
.narr .track { grid-column: 1 / -1; }
.narr[hidden], .summary[hidden] { display: none; }
@container (min-width: 560px) {
  .narr.hasrec { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
}
@container (min-width: 860px) {
  .walkgrid:not(.solo) { grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); gap: 28px; align-items: start; }
  .walkgrid:not(.solo) .narr { grid-template-columns: minmax(0, 1fr); gap: 12px; border-top: 0; border-left: 1px solid var(--wc-line); padding: 6px 0 6px 20px; }
}
.track { display: flex; flex-wrap: wrap; gap: 6px; }
.tp { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10.5px; line-height: 1; padding: 5px 9px; border-radius: 999px; border: 1px dashed var(--wc-line-strong); background: transparent; color: var(--wc-faint); cursor: pointer; transition: background-color var(--wc-dur-fast, 150ms) ${EASE}, color var(--wc-dur-fast, 150ms) ${EASE}, border-color var(--wc-dur-fast, 150ms) ${EASE}; }
.tp.done { border-style: solid; border-color: var(--wc-line-strong); color: var(--wc-body); background: var(--wc-paper); }
.tp.cur { border-style: solid; border-color: var(--wc-accent, CanvasText); background: var(--wc-accent, CanvasText); color: var(--wc-paper, Canvas); font-weight: 500; }
.tp:focus-visible { outline: 2px solid var(--wc-accent, CanvasText); outline-offset: 2px; }
.nstep { font-size: 10.5px; letter-spacing: 0.12em; color: var(--wc-accent); }
.nsay { display: flex; flex-direction: column; gap: 6px; }
.ntitle { font-size: 19px; line-height: 1.25; color: var(--wc-ink); }
.nbody { font-size: 15px; line-height: 1.55; color: var(--wc-body); }
.rise { animation: wc-rise var(--wc-dur-base, 220ms) ${EASE} both; }
.rec { border: 1px solid var(--wc-line); border-radius: 6px; padding: 8px 12px 6px 12px; }
.rechead { font-size: 10px; letter-spacing: 0.12em; color: var(--wc-muted); padding-bottom: 6px; }
.recrow { display: grid; grid-template-columns: minmax(72px, 38%) minmax(0, 1fr); gap: 10px; align-items: baseline; padding: 5px 6px; margin: 0 -6px; border-top: 1px solid var(--wc-line); border-radius: 4px; }
.recrow .k { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 11px; color: var(--wc-muted); }
.recrow .v { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 12px; color: var(--wc-ink); overflow-wrap: anywhere; }
.recrow.chg { background: var(--wc-accent-soft, var(--wc-panel)); box-shadow: inset 2px 0 0 var(--wc-accent); }
.recrow.chg .v { color: var(--wc-accent); font-weight: 500; animation: wc-rise var(--wc-dur-base, 220ms) ${EASE} both; }
.rail .rec { padding: 6px 10px 4px 10px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.summary { padding: 16px 2px 4px 2px; }
.sumtitle { font-size: 17px; color: var(--wc-ink); margin-bottom: 8px; }
.sumwrap { overflow-x: auto; scrollbar-width: thin; }
table.sum { width: 100%; border-collapse: collapse; font-size: 13.5px; line-height: 1.45; }
.sum th { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; color: var(--wc-muted); text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--wc-ink); }
.sum td { padding: 7px 8px; border-bottom: 1px solid var(--wc-line); vertical-align: top; color: var(--wc-body); }
.sum td:first-child { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 11.5px; font-weight: 500; color: var(--wc-ink); }
.sum tbody tr { animation: wc-rise var(--wc-dur-base, 220ms) ${EASE} both; }
@keyframes wc-rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes wc-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes wc-draw { from { stroke-dashoffset: var(--wc-len); } to { stroke-dashoffset: 0; } }

/* ---------- walkthrough: the stage ----------
 * Step transitions the reader triggers may run to 900 ms in total
 * (GRAMMAR.md, Motion). Only entry and the edge draw use that time. */
svg.diagram.walk .wc-el { transition: opacity var(--wc-dur-step, 450ms) ${EASE}, transform var(--wc-dur-step, 450ms) ${EASE}; transform-box: fill-box; transform-origin: center; }
svg.diagram.reveal .wc-el.hidden { opacity: 0 !important; transform: scale(0.92); pointer-events: none; }
svg.diagram .wc-node .halo { fill: none; stroke: var(--wc-accent-soft, var(--wc-panel)); stroke-width: 8; opacity: 0; pointer-events: none; transition: opacity var(--wc-dur-step, 450ms) ${EASE}; }
svg.diagram.walk .wc-node.active .halo { opacity: 1; }
svg.diagram.walk .wc-node.past .body { fill: none; stroke: var(--wc-line-strong); stroke-width: 1.4; }
svg.diagram.walk .wc-node.past .lbl, svg.diagram.walk .wc-node.past .dlbl { fill: var(--wc-muted); }
svg.diagram.walk .wc-edge.past { color: var(--wc-faint); }
svg.diagram .wc-node.denied .body { fill: var(--wc-danger-soft, var(--wc-panel)); stroke: var(--wc-danger, var(--wc-accent)); stroke-width: 1.5; stroke-dasharray: 4 3; }
svg.diagram .wc-node.denied .halo { opacity: 0; }
svg.diagram .wc-edge.denied { color: var(--wc-danger, var(--wc-accent)); }
svg.diagram .wc-edge.denied .stroke { stroke-dasharray: 4 3; }
svg.diagram .lblpill { opacity: 0; fill: var(--wc-accent); pointer-events: none; transition: opacity var(--wc-dur-fast, 150ms) ${EASE}; }
svg.diagram.walk .wc-edge.active .lblpill, svg.diagram.walk .wc-edge.denied .lblpill { opacity: 1; }
svg.diagram.walk .wc-edge.denied .lblpill { fill: var(--wc-danger, var(--wc-accent)); }
svg.diagram.walk .wc-edge.active .elbl, svg.diagram.walk .wc-edge.denied .elbl { fill: var(--wc-paper); }
svg.diagram .wc-edge.draw .stroke { stroke-dasharray: var(--wc-len) var(--wc-len); animation: wc-draw var(--wc-dur-draw, 700ms) ${EASE} both; }
svg.diagram .wc-edge.draw .tip, svg.diagram .wc-edge.draw .elbl, svg.diagram .wc-edge.draw .lblpill { animation: wc-show var(--wc-dur-fast, 150ms) ${EASE} var(--wc-dur-draw, 700ms) both; }
svg.diagram .wc-edge.fadein .stroke, svg.diagram .wc-edge.fadein .tip { animation: wc-show var(--wc-dur-step, 450ms) ${EASE} both; }
svg.diagram .wc-edge.fadein .elbl, svg.diagram .wc-edge.fadein .lblpill { animation: wc-show var(--wc-dur-fast, 150ms) ${EASE} var(--wc-dur-step, 450ms) both; }
svg.diagram .dmark rect { fill: var(--wc-danger, var(--wc-accent)); }
svg.diagram .dmark text { font-family: var(--wc-mono, ui-monospace, monospace); font-size: 9px; font-weight: 500; letter-spacing: 0.04em; fill: var(--wc-paper); }
svg.diagram .dmark { pointer-events: none; animation: wc-show var(--wc-dur-fast, 150ms) ${EASE} var(--wc-dur-step, 450ms) both; }

@media (prefers-reduced-motion: reduce) {
  svg.diagram .wc-el, svg.diagram .wc-node .body, svg.diagram .badge, .pip { transition: none !important; }
  svg.diagram.walk .wc-el, svg.diagram .halo, svg.diagram .lblpill, .tp { transition: none !important; }
  svg.diagram .wc-edge .stroke, svg.diagram .wc-edge .tip, svg.diagram .wc-edge .elbl, svg.diagram .lblpill, svg.diagram .dmark,
  .rise, .recrow.chg .v, .sum tbody tr { animation: none !important; }
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
    this.st = { variant: 0, step: 1, playing: false, expanded: false, railOpen: true, zoom: 1, fitMode: true, detail: null };
    this.timer = null;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Holding +, -, 1 or 0 repeats the keydown at OS repeat rate.
     * A fast wheel gesture repeats onWheel the same way.
     * Each of stepZoom, setZoom and fitZoom forces a layout read.
     * Batching bounds that cost, the way it already does for onWheel.
     * Each key updates this.st.zoom and this.st.fitMode right away.
     * Only the DOM write waits for the next frame.
     * This keeps state live for a later key in the same frame.
     * It also keeps the layout work to one commit per frame. */
    this.keyZoomRaf = null;
    this.keyZoomCommit = null;
    this.onKey = (e) => {
      if (!this.st.expanded) return;
      if (e.key === 'Escape') { this.setExpanded(false); return; }
      if (this.stepKey(e)) return;
      if (e.key === '0') { this.queueFit(); return; }
      if (e.key === '1') { this.queueZoomTo(1); return; }
      if (e.key === '+' || e.key === '=') { this.queueZoomTo(this.nextZoomStop(1)); return; }
      if (e.key === '-' || e.key === '_') { this.queueZoomTo(this.nextZoomStop(-1)); }
    };

    /* Cmd/Ctrl + wheel zooms, and so does a trackpad pinch, which the
     * browser reports as a wheel event with ctrlKey set. A plain
     * wheel still scrolls the viewport to pan.
     *
     * A pinch or a fast scroll can fire tens of wheel events a
     * second. setZoom forces a layout read, so applying every event
     * would thrash layout at input speed. The zoom number updates on
     * every event. The DOM work runs once, in one animation frame. */
    this.wheelAnchor = null;
    this.wheelRaf = null;
    this.onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= 400;
      this.st.zoom = clampZoom(this.st.zoom * Math.exp(-dy / 180));
      /* Keep fitMode live too, and drop a queued keyboard commit.
       * A resize or a key mid-gesture should see this gesture, not a
       * stale one. */
      this.st.fitMode = false;
      this.cancelKeyZoom();
      this.wheelAnchor = [e.clientX, e.clientY];
      if (this.wheelRaf != null) return;
      this.wheelRaf = requestAnimationFrame(() => {
        this.wheelRaf = null;
        this.setZoom(this.st.zoom, this.wheelAnchor);
      });
    };

    /* A fitted figure stays fitted when the window changes size.
     * Batched the same way, so a burst of resize events costs one
     * reflow per frame, not one per event. */
    this.resizeRaf = null;
    this.onResize = () => {
      if (this.resizeRaf != null) return;
      this.resizeRaf = requestAnimationFrame(() => {
        this.resizeRaf = null;
        if (this.st.expanded && this.st.fitMode) this.fitZoom();
      });
    };

    /* Drag to pan, the way every map and diagram viewer works. A
     * plain wheel still scrolls, and shift with the wheel scrolls
     * sideways. Mouse events only: a touch screen pans by itself,
     * and pointer events would take that away. */
    this.onPanStart = (e) => {
      if (e.button !== 0 || !this.viewport) return;
      const vp = this.viewport;
      if (vp.scrollWidth <= vp.clientWidth && vp.scrollHeight <= vp.clientHeight) return;
      this.pan = { x: e.clientX, y: e.clientY, left: vp.scrollLeft, top: vp.scrollTop };
      vp.classList.add('grabbing');
      e.preventDefault();
    };
    this.onPanMove = (e) => {
      if (!this.pan) return;
      this.viewport.scrollLeft = this.pan.left - (e.clientX - this.pan.x);
      this.viewport.scrollTop = this.pan.top - (e.clientY - this.pan.y);
    };
    this.onPanEnd = () => {
      if (!this.pan) return;
      this.pan = null;
      if (this.viewport) this.viewport.classList.remove('grabbing');
    };

    /* The reader steps with the arrow keys while focus is in the
     * figure. In the fullscreen view the window listener (onKey)
     * takes the keys instead, so this one stands down. */
    this.onHostKey = (e) => {
      if (this.st.expanded) return;
      const t = e.composedPath ? e.composedPath()[0] : e.target;
      if (t && (t.tagName === 'SELECT' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      this.stepKey(e);
    };
    this.addEventListener('keydown', this.onHostKey);

    /* In a walkthrough, a click on the stage moves one step forward. A drag is a pan,
     * not a click, so a pointer that travelled is ignored. */
    this.downAt = null;
    this.onStageDown = (e) => { this.downAt = [e.clientX, e.clientY]; };
    this.onStageClick = (e) => {
      const d = this.downAt;
      this.downAt = null;
      if (!this.scenario || !this.isWalk || e.button !== 0) return;
      if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 4) return;
      this.setStep(this.st.step + 1);
    };
  }

  /* Arrow keys, Home and End step a walkthrough. Returns true when the
   * key was a step key. */
  stepKey(e) {
    /* Walkthroughs only. A plain replay keeps its old keys: in the
     * fullscreen view the arrows scroll a zoomed diagram. */
    if (!this.scenario || !this.isWalk || e.metaKey || e.ctrlKey || e.altKey) return false;
    let n = null;
    if (e.key === 'ArrowRight') n = this.st.step + 1;
    else if (e.key === 'ArrowLeft') n = this.st.step - 1;
    else if (e.key === 'Home') n = 1;
    else if (e.key === 'End') n = this.maxStep;
    if (n === null) return false;
    e.preventDefault();
    this.setStep(n);
    return true;
  }

  connectedCallback() {
    const script = this.querySelector('script[type="application/json"]');
    this.data = script ? JSON.parse(script.textContent) : {};
    this.renderShell();
  }

  disconnectedCallback() {
    this.stopPlay();
    /* A host page can move this element in the DOM without
     * destroying it. A keyed-list reorder can do this. So can a
     * router that remounts a section. Both fire disconnectedCallback,
     * then connectedCallback, on the same instance.
     *
     * setExpanded(false) already calls removeOverlayListeners, and
     * also clears this.overlay, this.canvas, and this.viewport.
     * Reuse it here. Then a disconnect mid-drag or mid-expand leaves
     * nothing dangling for the next connectedCallback to trip
     * over. */
    if (this.st.expanded) this.setExpanded(false);
  }

  /* Subclasses implement: return an <svg class="diagram"> for one variant. */
  buildSvg(_variantData) { throw new Error('woodcut: buildSvg not implemented'); }

  get variantData() { return (this.data.variants || [this.data])[this.st.variant]; }
  get scenarios() { return this.variantData.scenarios || []; }
  get scenario() { return this.scenarios[this.st.scenario || 0]; }
  get maxStep() { return this.scenario ? this.scenario.steps.length : 0; }

  /* A narrated scenario carries prose on at least one step. It shows
   * the narration panel in place of the event log. */
  get narrated() {
    const sc = this.scenario;
    return !!sc && sc.steps.some((st) => st.title || st.body || st.record || st.summary);
  }

  /* A walkthrough is a narrated scenario, or one that asks for reveal.
   * It dims reached elements, rings the active one, and draws the
   * active arrow. */
  get isWalk() { return this.narrated || !!(this.scenario && this.scenario.reveal); }

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
    if (pickers.length) {
      const row = this.el('div', 'variantrow');
      for (const p of pickers) {
        row.appendChild(this.el('div', 'klabel mono', p.label));
        row.appendChild(this.select(p));
      }
      root.appendChild(row);
    }

    /* The stage column holds the drawing and the step controls. The
     * narration panel sits beside it on a wide figure and under it on
     * a narrow one. The summary table spans the full width. */
    this.walkEl = this.el('div', 'walk');
    this.walkGrid = this.el('div', 'walkgrid solo');
    const stageCol = this.el('div', 'stagecol');
    stageCol.appendChild(this.svgHolder);
    this.controlsHost = this.el('div');
    stageCol.appendChild(this.controlsHost);
    this.walkGrid.appendChild(stageCol);
    this.narrEl = this.el('div', 'narr');
    this.narrEl.hidden = true;
    /* The pills, the live region and the record host live as long as
     * the figure. A step updates them in place, so a focused pill
     * keeps focus and screen readers announce the new text. */
    this.trackEl = this.el('div', 'track');
    this.trackFor = null;
    this.sayEl = this.el('div', 'nsay');
    this.sayEl.setAttribute('aria-live', 'polite');
    this.recHost = this.el('div');
    this.recHost.style.display = 'contents';
    this.narrEl.append(this.trackEl, this.sayEl, this.recHost);
    this.walkGrid.appendChild(this.narrEl);
    this.walkEl.appendChild(this.walkGrid);
    this.summaryEl = this.el('div', 'summary');
    this.summaryEl.hidden = true;
    this.walkEl.appendChild(this.summaryEl);
    root.appendChild(this.walkEl);

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
    /* A new SVG makes a queued wheel-zoom's saved anchor point
     * meaningless. Drop it.
     * A queued keyboard-zoom commit would only redo work this
     * function already does below. Drop that too. */
    this.cancelWheelZoom();
    this.cancelKeyZoom();
    if (this.svg) this.svg.remove();
    this.svg = this.buildSvg(this.variantData);
    this.svg.classList.add('diagram');
    this.addHalos(this.svg);
    this.svg.addEventListener('mousedown', this.onStageDown);
    this.svg.addEventListener('click', this.onStageClick);
    this.lastFocus = null;
    this.svgHolder.insertBefore(this.svg, this.card);
    /* A rebuild while expanded keeps the drawing in the overlay. */
    if (this.st.expanded && this.canvas) {
      this.canvas.appendChild(this.svg);
      if (this.st.fitMode) this.fitZoom(); else this.applyZoom();
    }
    this.wireCards(this.svg);
    this.captionEl.textContent = this.variantData.caption || this.data.caption || '';
    this.renderControls();
    this.applyStep();
    if (this.st.detail && !this.svg.querySelector(`[data-card-id="${this.st.detail.id}"]`)) {
      this.st.detail = null;
      this.updateRail();
    }
  }

  /* Each node gets a copy of its body shape behind it. The copy is
   * the accent ring of the active node in a walkthrough. It stays
   * invisible otherwise. */
  addHalos(svg) {
    svg.querySelectorAll('.wc-node').forEach((g) => {
      const body = g.querySelector('.body');
      if (!body) return;
      const halo = body.cloneNode(false);
      halo.setAttribute('class', 'halo');
      g.insertBefore(halo, g.firstChild);
    });
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
    this.playBtn = null;
    this.prevBtn = this.nextBtn = this.dial = this.stepName = this.logEl = null;
    /* The stage takes focus so the arrow keys can step it. */
    if (this.scenario && this.isWalk) {
      this.svgHolder.tabIndex = 0;
      this.svgHolder.setAttribute('aria-label', 'Diagram. Click it or press the arrow keys to step.');
    } else {
      this.svgHolder.removeAttribute('tabindex');
      this.svgHolder.removeAttribute('aria-label');
    }
    if (!this.scenario) return;
    const row = this.el('div', 'controls');
    this.prevBtn = this.el('div', 'nav'); this.prevBtn.innerHTML = PREV_ICON; this.prevBtn.title = 'Previous step (←)';
    this.prevBtn.onclick = () => this.setStep(this.st.step - 1);
    this.nextBtn = this.el('div', 'nav'); this.nextBtn.innerHTML = NEXT_ICON; this.nextBtn.title = 'Next step (→)';
    this.nextBtn.onclick = () => this.setStep(this.st.step + 1);
    this.dial = this.el('div', 'dial');
    for (let i = 1; i <= this.maxStep; i++) {
      const pip = this.el('div', 'pip mono', String(i));
      pip.onclick = () => this.setStep(i);
      this.dial.appendChild(pip);
    }
    row.append(this.prevBtn, this.dial, this.nextBtn);
    /* The play control rides with the dial, so it follows the step
     * controls into the fullscreen overlay. A walkthrough has none:
     * the reader sets the pace of a narrated story. */
    if (!this.isWalk) {
      this.playBtn = this.el('div', 'iconbtn');
      this.playBtn.title = 'Replay the scenario';
      this.playBtn.innerHTML = PLAY_ICON;
      this.playBtn.onclick = () => this.togglePlay();
      row.appendChild(this.playBtn);
    }
    this.stepName = this.el('div', 'stepname mono');
    row.appendChild(this.stepName);
    this.controlsHost.appendChild(row);
    /* The narration panel replaces the event log. */
    if (!this.narrated) {
      this.logEl = this.el('div', 'log');
      this.controlsHost.appendChild(this.logEl);
    }
  }

  setScenario(i) {
    this.stopPlay();
    this.st.scenario = i;
    this.st.step = 1;
    this.lastFocus = null;
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
    const next = Math.max(1, Math.min(n, this.maxStep));
    if (next === this.st.step) return;
    this.st.step = next;
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
    if (!this.scenario) {
      this.svg.classList.remove('walk', 'reveal', 'stepable');
      this.svg.querySelectorAll('[data-follows]').forEach((elm) => elm.classList.remove('future', 'hidden'));
      this.renderNarration();
      return;
    }
    const steps = this.scenario.steps;
    const s = this.st.step;
    const step = steps[s - 1];
    const walk = this.isWalk;
    const reveal = walk && !!this.scenario.reveal;
    const ids = (st) => [...(st.active || []), ...(st.denied || [])];
    const seen = {};
    for (let i = 0; i < s; i++) ids(steps[i]).forEach((id) => { seen[id] = i + 1; });
    const now = step.active || [];
    const denied = step.denied || [];
    const focus = new Set([...now, ...denied]);
    const before = this.lastFocus || new Set();
    this.svg.classList.toggle('walk', walk);
    this.svg.classList.toggle('reveal', reveal);
    this.svg.classList.toggle('stepable', walk);
    this.svg.querySelectorAll('[data-el]').forEach((elm) => {
      const id = elm.getAttribute('data-el');
      elm.classList.toggle('active', now.includes(id));
      elm.classList.toggle('denied', denied.includes(id));
      elm.classList.toggle('future', !seen[id]);
      /* Reveal hides every element the scenario has not reached yet,
       * so the stage holds only the story told so far. */
      elm.classList.toggle('hidden', reveal && !seen[id]);
      elm.classList.toggle('past', walk && !!seen[id] && !focus.has(id));
      if (elm.classList.contains('wc-edge')) {
        this.drawEdge(elm, walk && focus.has(id), !before.has(id), denied.includes(id));
      }
    });
    this.lastFocus = focus;
    /* A follower, such as a sequence activation bar, takes the reveal
     * and dim state of the element it names. Walkthroughs only, so a
     * plain replay draws it as before. */
    this.svg.querySelectorAll('[data-follows]').forEach((elm) => {
      const id = elm.getAttribute('data-follows');
      elm.classList.toggle('future', walk && !seen[id]);
      elm.classList.toggle('hidden', reveal && !seen[id]);
    });
    this.markDenied(denied, step.deniedLabel);
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
      /* Scroll the dial itself. scrollIntoView would also scroll the
       * page, and a step must never move the reader's page. */
      if (cur) {
        const d = this.dial;
        const dr = d.getBoundingClientRect(), cr = cur.getBoundingClientRect();
        if (cr.left < dr.left) d.scrollLeft -= dr.left - cr.left;
        else if (cr.right > dr.right) d.scrollLeft += cr.right - dr.right;
      }
    }
    if (this.prevBtn) this.prevBtn.classList.toggle('off', s === 1);
    if (this.nextBtn) this.nextBtn.classList.toggle('off', s === this.maxStep);
    if (this.stepName) this.stepName.textContent = step.name || '';
    if (this.logEl) {
      this.logEl.innerHTML = '';
      for (let i = s - 1; i >= 0; i--) {
        const row = this.el('div', 'logrow' + (i === s - 1 ? ' cur' : ''));
        row.appendChild(this.el('div', 'n', String(i + 1).padStart(2, '0')));
        row.appendChild(this.el('div', 'x', steps[i].log || ''));
        this.logEl.appendChild(row);
      }
    }
    this.renderNarration();
    this.updateRail();
  }

  /* Sets the draw state of one edge. `focused` is true when the edge
   * is active or denied in a walkthrough. `fresh` is true when it was
   * not in focus on the step before, so its entry must play again.
   * A solid edge draws itself; a dashed or denied edge fades in. Its
   * label and arrowhead appear after the stroke. */
  drawEdge(elm, focused, fresh, denied) {
    const stroke = elm.querySelector('.stroke');
    if (!stroke) return;
    if (!focused) { elm.classList.remove('draw', 'fadein'); return; }
    this.addLabelPill(elm);
    if (!fresh) return;
    elm.classList.remove('draw', 'fadein');
    if (this.reduced) return;
    const dashed = denied || stroke.hasAttribute('stroke-dasharray');
    if (!dashed) {
      const len = typeof stroke.getTotalLength === 'function' ? stroke.getTotalLength() : 0;
      if (!(len > 0)) return;
      stroke.style.setProperty('--wc-len', (len + 1).toFixed(1) + 'px');
    }
    /* Read layout once so the removed class takes effect. Then the
     * animation starts again from its first frame. */
    void elm.getBoundingClientRect();
    elm.classList.add(dashed ? 'fadein' : 'draw');
  }

  /* Puts a pill behind the label of an edge, once. The pill shows only
   * while the edge is in focus in a walkthrough. */
  addLabelPill(elm) {
    const lbl = elm.querySelector('.elbl');
    if (!lbl || (lbl.previousSibling && lbl.previousSibling.classList && lbl.previousSibling.classList.contains('lblpill'))) return;
    let box;
    try { box = lbl.getBBox(); } catch (_) { return; }
    if (!box || !box.width) return;
    const padX = 6, padY = 3;
    const h = box.height + padY * 2;
    lbl.parentNode.insertBefore(this.s('rect', {
      x: (box.x - padX).toFixed(1), y: (box.y - padY).toFixed(1),
      width: (box.width + padX * 2).toFixed(1), height: h.toFixed(1), rx: (h / 2).toFixed(1), class: 'lblpill'
    }), lbl);
  }

  /* Draws a badge at the top right of each denied node, when the step
   * gives a label for it. The dashed danger border is the mark; the
   * badge says why in words. */
  markDenied(denied, label) {
    const old = this.svg.querySelector('.dmarks');
    if (old) old.remove();
    if (!denied.length || !label) return;
    const layer = this.s('g', { class: 'dmarks' });
    this.svg.appendChild(layer);
    const vbw = this.naturalSize()[0];
    for (const id of denied) {
      const node = this.svg.querySelector(`.wc-node[data-el="${CSS.escape(id)}"]`);
      if (!node) continue;
      const body = node.querySelector('.body') || node;
      let bb;
      try { bb = body.getBBox(); } catch (_) { continue; }
      const g = this.s('g', { class: 'dmark' });
      const t = this.sText(0, 0, label, '', 'middle');
      g.appendChild(t);
      layer.appendChild(g);
      let tw = 0;
      try { tw = t.getBBox().width; } catch (_) { /* not rendered */ }
      tw = tw || label.length * 5.6;
      const w = tw + 12, h = 15;
      let cx = bb.x + bb.width - w / 2 + 6;
      cx = Math.max(w / 2 + 1, Math.min(cx, vbw - w / 2 - 1));
      const cy = Math.max(h / 2 + 1, bb.y);
      t.setAttribute('x', cx.toFixed(1));
      t.setAttribute('y', (cy + 3).toFixed(1));
      g.insertBefore(this.s('rect', { x: (cx - w / 2).toFixed(1), y: (cy - h / 2).toFixed(1), width: w.toFixed(1), height: h, rx: h / 2 }), t);
    }
  }

  /* ---------- narration ---------- */

  /* The rows of a step's record, as { key, value, changed }. */
  recordRows(step) {
    return (step.record || []).map((r) => (Array.isArray(r)
      ? { key: r[0], value: r[1], changed: !!r[2] }
      : { key: r.key, value: r.value, changed: !!r.changed }));
  }

  renderRecord(step) {
    const rows = this.recordRows(step);
    if (!rows.length) return null;
    const rec = this.el('div', 'rec');
    rec.appendChild(this.el('div', 'rechead mono', this.scenario.recordLabel || 'RECORD'));
    for (const r of rows) {
      const row = this.el('div', 'recrow' + (r.changed ? ' chg' : ''));
      row.appendChild(this.el('div', 'k', String(r.key)));
      const v = this.el('div', 'v', String(r.value));
      if (r.changed) v.appendChild(this.el('span', 'sr', ' (changed)'));
      row.appendChild(v);
      rec.appendChild(row);
    }
    return rec;
  }

  renderNarration() {
    const on = this.narrated;
    this.walkEl.classList.toggle('narrated', on);
    this.walkGrid.classList.toggle('solo', !on);
    this.narrEl.hidden = !on;
    this.summaryEl.innerHTML = '';
    this.summaryEl.hidden = true;
    if (!on) {
      this.trackEl.innerHTML = '';
      this.trackFor = null;
      this.sayEl.innerHTML = '';
      this.recHost.innerHTML = '';
      return;
    }
    const steps = this.scenario.steps;
    const s = this.st.step;
    const step = steps[s - 1];

    /* The tracker: one pill per step, marked done, current, or to come.
     * The border style carries the mark as well as the color. The
     * pills are built once per scenario and updated in place. */
    if (this.trackFor !== this.scenario) {
      this.trackFor = this.scenario;
      this.trackEl.innerHTML = '';
      steps.forEach((st, i) => {
        const p = this.el('button', 'tp', st.name || String(i + 1));
        p.type = 'button';
        p.title = st.title || st.name || 'Step ' + (i + 1);
        p.onclick = () => this.setStep(i + 1);
        this.trackEl.appendChild(p);
      });
    }
    [...this.trackEl.children].forEach((p, i) => {
      p.className = 'tp ' + (i + 1 < s ? 'done' : i + 1 === s ? 'cur' : 'fut');
      if (i + 1 === s) p.setAttribute('aria-current', 'step');
      else p.removeAttribute('aria-current');
    });

    /* One live region for the life of the figure. Only its text
     * changes, so a screen reader announces each step. */
    if (!this.sayEl.children.length) {
      this.sayEl.append(this.el('div', 'nstep mono'), this.el('div', 'ntitle'), this.el('div', 'nbody'));
    }
    const [nstep, ntitle, nbody] = this.sayEl.children;
    nstep.textContent = `STEP ${s} / ${steps.length}`;
    ntitle.textContent = step.title || step.name || '';
    nbody.textContent = step.body || '';
    ntitle.hidden = !ntitle.textContent;
    nbody.hidden = !nbody.textContent;
    for (const e of [ntitle, nbody]) {
      e.classList.remove('rise');
      void e.offsetWidth;
      e.classList.add('rise');
    }

    const rec = this.renderRecord(step);
    this.narrEl.classList.toggle('hasrec', !!rec);
    this.recHost.innerHTML = '';
    if (rec) this.recHost.appendChild(rec);

    const sum = step.summary;
    if (sum && (sum.rows || []).length) {
      if (sum.title) this.summaryEl.appendChild(this.el('div', 'sumtitle', sum.title));
      const wrap = this.el('div', 'sumwrap');
      const table = this.el('table', 'sum');
      if (sum.head) {
        const tr = this.el('tr');
        for (const h of sum.head) tr.appendChild(this.el('th', '', String(h)));
        const thead = this.el('thead'); thead.appendChild(tr); table.appendChild(thead);
      }
      const tbody = this.el('tbody');
      /* Rows enter one after another. The stagger stops growing at
       * 480 ms, so the whole table is in within the 900 ms limit. */
      sum.rows.forEach((r, i) => {
        const tr = this.el('tr');
        tr.style.animationDelay = Math.min(i * 80, 480) + 'ms';
        for (const c of r) tr.appendChild(this.el('td', '', String(c)));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      this.summaryEl.appendChild(wrap);
      this.summaryEl.hidden = false;
    }
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
      this.overlayHint = this.el('div', 'hint mono');
      right.appendChild(this.overlayHint);
      const zout = this.el('div', 'nav'); zout.innerHTML = icon('<path d="M3 8h10"></path>', 11); zout.title = 'Zoom out (−)';
      zout.onclick = () => this.stepZoom(-1);
      this.zpct = this.el('div', 'zpct mono');
      const zin = this.el('div', 'nav'); zin.innerHTML = icon('<path d="M8 3v10M3 8h10"></path>', 11); zin.title = 'Zoom in (+)';
      zin.onclick = () => this.stepZoom(1);
      const fit = this.el('div', 'nav fitbtn', 'fit'); fit.title = 'Fit the whole diagram (0)';
      fit.onclick = () => this.fitZoom();
      const close = this.el('div', 'iconbtn'); close.innerHTML = CLOSE_ICON; close.title = 'Close (Esc)';
      close.onclick = () => this.setExpanded(false);
      right.append(zout, this.zpct, zin, fit, close);
      head.appendChild(right);
      this.overlay.appendChild(head);
      const row = this.el('div', 'orow');
      this.viewport = this.el('div', 'oviewport');
      this.canvas = this.el('div', 'ocanvas');
      this.viewport.appendChild(this.canvas);
      row.appendChild(this.viewport);
      this.railHost = this.el('div');
      this.railHost.style.display = 'contents';
      row.appendChild(this.railHost);
      this.overlay.appendChild(row);
      if (this.scenario) {
        const c = this.controlsHost;
        this.controlsPlaceholder = document.createComment('controls');
        c.parentNode.insertBefore(this.controlsPlaceholder, c);
        c.classList.add('inoverlay');
        this.overlay.appendChild(c);
      }
      this.shadowRoot.appendChild(this.overlay);
      this.svgPlaceholder = document.createComment('svg');
      this.svg.parentNode.insertBefore(this.svgPlaceholder, this.svg);
      this.canvas.appendChild(this.svg);
      addEventListener('keydown', this.onKey);
      this.viewport.addEventListener('wheel', this.onWheel, { passive: false });
      this.viewport.addEventListener('mousedown', this.onPanStart);
      addEventListener('mousemove', this.onPanMove);
      addEventListener('mouseup', this.onPanEnd);
      addEventListener('resize', this.onResize);
      /* On a narrow screen an open rail leaves the diagram no room, so
       * it starts collapsed. The reader can open it again. */
      if (innerWidth < 640) this.st.railOpen = false;
      /* The rail takes its width first, so fit measures the real viewport. */
      this.updateRail();
      this.fitZoom();
    } else {
      this.removeOverlayListeners();
      this.svg.style.width = '';
      this.svg.style.height = '';
      this.svgPlaceholder.parentNode.replaceChild(this.svg, this.svgPlaceholder);
      if (this.controlsPlaceholder) {
        this.controlsHost.classList.remove('inoverlay');
        this.controlsPlaceholder.parentNode.replaceChild(this.controlsHost, this.controlsPlaceholder);
        this.controlsPlaceholder = null;
      }
      this.overlay.remove();
      this.overlay = null;
      this.canvas = null;
      this.viewport = null;
    }
  }

  /* Removes everything setExpanded(true) attaches outside this
   * element's own shadow tree: the window keydown, resize, and pan
   * listeners, the viewport's wheel and mousedown listeners, and any
   * queued zoom or resize frame. setExpanded(false) and
   * disconnectedCallback both call this. A host page can remove an
   * expanded figure from the DOM without collapsing it first;
   * without this shared cleanup, the window listeners would keep
   * the whole detached figure alive and firing for the rest of the
   * page's life.
   *
   * Guard on this.overlay: disconnectedCallback also runs on a
   * figure that is already collapsed, where there is nothing to tear
   * down. */
  removeOverlayListeners() {
    if (!this.overlay) return;
    this.onPanEnd();
    this.cancelWheelZoom();
    this.cancelResize();
    this.cancelKeyZoom();
    removeEventListener('keydown', this.onKey);
    removeEventListener('resize', this.onResize);
    removeEventListener('mousemove', this.onPanMove);
    removeEventListener('mouseup', this.onPanEnd);
    this.viewport.removeEventListener('wheel', this.onWheel);
    this.viewport.removeEventListener('mousedown', this.onPanStart);
  }

  /* ---------- zoom ---------- */

  /* The drawing size of the current variant, in viewBox units. */
  naturalSize() {
    const vb = (this.svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const w = vb[2] > 0 ? vb[2] : 600;
    const h = vb[3] > 0 ? vb[3] : 400;
    return [w, h];
  }

  /* The largest scale that still shows the whole diagram. */
  fitScale() {
    const [nw, nh] = this.naturalSize();
    const box = this.viewport.getBoundingClientRect();
    const availW = Math.max(40, box.width - 28);
    const availH = Math.max(40, box.height - 28);
    return clampZoom(Math.min(availW / nw, availH / nh));
  }

  applyZoom() {
    const [nw, nh] = this.naturalSize();
    this.svg.style.width = (nw * this.st.zoom).toFixed(1) + 'px';
    this.svg.style.height = (nh * this.st.zoom).toFixed(1) + 'px';
    if (this.zpct) this.zpct.textContent = Math.round(this.st.zoom * 100) + '%';
    /* A fitted figure has nothing to pan to. Say so, rather than
     * offer a drag that does nothing. */
    const vp = this.viewport;
    if (!vp) return;
    const pannable = vp.scrollWidth > vp.clientWidth || vp.scrollHeight > vp.clientHeight;
    vp.classList.toggle('pannable', pannable);
    if (this.overlayHint) {
      this.overlayHint.textContent = pannable
        ? 'drag to pan · cmd + scroll to zoom'
        : 'cmd + scroll to zoom';
    }
  }

  /* Drops a queued wheel-zoom frame. Every other way to change the
   * zoom calls this first. Otherwise that queued frame could still
   * land a moment later and overwrite the newer change. */
  cancelWheelZoom() {
    if (this.wheelRaf != null) { cancelAnimationFrame(this.wheelRaf); this.wheelRaf = null; }
    this.wheelAnchor = null;
  }

  cancelResize() {
    if (this.resizeRaf != null) { cancelAnimationFrame(this.resizeRaf); this.resizeRaf = null; }
  }

  /* Queues one keyboard-zoom commit for the next frame.
   * A held key can call this many times before that frame fires.
   * Each call replaces the pending commit.
   * The frame itself is scheduled only once. */
  queueKeyZoom(commit) {
    this.keyZoomCommit = commit;
    if (this.keyZoomRaf != null) return;
    this.keyZoomRaf = requestAnimationFrame(() => {
      this.keyZoomRaf = null;
      this.keyZoomCommit();
    });
  }

  cancelKeyZoom() {
    if (this.keyZoomRaf != null) { cancelAnimationFrame(this.keyZoomRaf); this.keyZoomRaf = null; }
    this.keyZoomCommit = null;
  }

  /* Eagerly applies a plain zoom target to state, then queues the DOM
   * commit for it. A later key in the same unflushed frame then reads
   * a live target, not a stale one. Skips the commit when the target
   * is already on screen. */
  queueZoomTo(target) {
    const next = clampZoom(target);
    if (this.keyZoomRaf == null && next === this.st.zoom && !this.st.fitMode) return;
    this.cancelWheelZoom();
    this.st.zoom = next;
    this.st.fitMode = false;
    this.queueKeyZoom(() => this.setZoom(this.st.zoom));
  }

  /* Eagerly fits, then queues the DOM commit for it. A later key in
   * the same unflushed frame then reads a live target, not a stale
   * one. */
  queueFit() {
    this.cancelWheelZoom();
    this.cancelResize();
    this.st.zoom = this.fitScale();
    this.st.fitMode = true;
    this.queueKeyZoom(() => this.applyFit());
  }

  /* Zoom to a scale. `anchor` is a [clientX, clientY] point to hold still. */
  setZoom(scale, anchor) {
    this.cancelWheelZoom();
    this.cancelKeyZoom();
    if (!this.overlay) { this.st.zoom = clampZoom(scale); return; }
    const before = this.svg.getBoundingClientRect();
    const ax = anchor ? anchor[0] : before.left + before.width / 2;
    const ay = anchor ? anchor[1] : before.top + before.height / 2;
    const fx = before.width ? (ax - before.left) / before.width : 0.5;
    const fy = before.height ? (ay - before.top) / before.height : 0.5;
    this.st.zoom = clampZoom(scale);
    this.st.fitMode = false;
    this.applyZoom();
    const after = this.svg.getBoundingClientRect();
    this.viewport.scrollLeft += after.left + fx * after.width - ax;
    this.viewport.scrollTop += after.top + fy * after.height - ay;
  }

  /* The next stop up or down the ladder from the current zoom,
   * continuing past its ends. */
  nextZoomStop(dir) {
    const cur = this.st.zoom;
    const next = dir > 0
      ? ZOOM_STOPS.find((z) => z > cur + 0.001)
      : [...ZOOM_STOPS].reverse().find((z) => z < cur - 0.001);
    return next === undefined ? cur * (dir > 0 ? 1.25 : 0.8) : next;
  }

  /* Walk the ladder one stop, and keep going past its ends. */
  stepZoom(dir) {
    this.setZoom(this.nextZoomStop(dir));
  }

  fitZoom() {
    if (!this.overlay) return;
    this.cancelWheelZoom();
    this.cancelKeyZoom();
    this.st.zoom = this.fitScale();
    this.st.fitMode = true;
    this.applyFit();
  }

  /* The DOM-writing half of fitZoom. Use this only when the caller
   * has already set this.st.zoom and this.st.fitMode itself. */
  applyFit() {
    this.applyZoom();
    this.viewport.scrollLeft = (this.viewport.scrollWidth - this.viewport.clientWidth) / 2;
    this.viewport.scrollTop = (this.viewport.scrollHeight - this.viewport.clientHeight) / 2;
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

    /* The collapse control sits above both sections, so DETAIL and
     * EVENTS read as two headings of the same rank. */
    const top = this.el('div', 'railtop');
    const dash = this.el('div', 'dash'); dash.title = 'Hide the rail';
    dash.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6h8"></path></svg>';
    dash.onclick = () => { this.st.railOpen = false; this.updateRail(); };
    top.appendChild(dash);
    rail.appendChild(top);

    /* A narrated scenario leads the rail with the step and its record,
     * because the inline narration panel is under the overlay. */
    if (this.narrated) {
      const step = this.scenario.steps[this.st.step - 1];
      const say = this.el('div', 'sect');
      say.appendChild(this.el('div', 'railtag', `STEP ${this.st.step} / ${this.maxStep}`));
      say.appendChild(this.el('div', 'rule'));
      say.appendChild(this.el('div', 'railt', step.title || step.name || ''));
      if (step.body) say.appendChild(this.el('div', 'railb', step.body));
      const rec = this.renderRecord(step);
      if (rec) say.appendChild(rec);
      rail.appendChild(say);
    }

    const detail = this.el('div', 'sect');
    detail.appendChild(this.el('div', 'railtag', 'DETAIL'));
    detail.appendChild(this.el('div', 'rule'));
    detail.appendChild(this.el('div', 'railt', this.st.detail ? this.st.detail.title : '—'));
    detail.appendChild(this.el('div', 'railb', this.st.detail ? this.st.detail.body : 'Hover any element to read about it.'));
    rail.appendChild(detail);

    if (this.scenario && !this.narrated) {
      const events = this.el('div', 'sect');
      events.appendChild(this.el('div', 'railtag', 'EVENTS'));
      events.appendChild(this.el('div', 'rule'));
      for (let i = 0; i < this.st.step; i++) {
        const row = this.el('div', 'logrow' + (i === this.st.step - 1 ? ' cur' : ''));
        row.appendChild(this.el('div', 'n', String(i + 1).padStart(2, '0')));
        row.appendChild(this.el('div', 'x', this.scenario.steps[i].log || ''));
        events.appendChild(row);
      }
      rail.appendChild(events);
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
