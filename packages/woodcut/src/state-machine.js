/*
 * <wc-state-machine> — lifecycle diagrams. Answers: what can happen?
 * States are pills; terminal states wear a double ring; transitions
 * are labeled paths. Scenarios replay through the shared frame.
 */
import { WoodcutFigure } from './frame.js';

export class WoodcutStateMachine extends WoodcutFigure {
  buildSvg(v) {
    const svg = this.s('svg', { viewBox: `0 0 ${v.viewBox[0]} ${v.viewBox[1]}` });
    const cards = {};

    if (v.start) {
      const g = this.s('g', { class: 'wc-el wc-node' });
      g.setAttribute('data-el', 'start');
      g.appendChild(this.s('circle', { cx: v.start.at[0], cy: v.start.at[1], r: 4.5, class: 'dot' }));
      svg.appendChild(g);
    }

    for (const t of v.transitions || []) {
      const g = this.s('g', { class: 'wc-el wc-edge' });
      g.setAttribute('data-el', t.id);
      g.appendChild(this.s('path', { d: t.path, class: 'stroke' }));
      g.appendChild(this.sTip(t.tip, t.tipDir));
      if (t.label) g.appendChild(this.sText(t.labelAt[0], t.labelAt[1], t.label, 'elbl', t.labelAnchor || 'middle'));
      if (t.card) {
        g.setAttribute('data-card-id', t.id);
        g.appendChild(this.s('path', { d: t.path, class: 'hit' }));
        cards[t.id] = t.card;
      }
      svg.appendChild(g);
    }

    for (const st of v.states || []) {
      const g = this.s('g', { class: 'wc-el wc-node' });
      g.setAttribute('data-el', st.id);
      const rx = st.h / 2;
      if (st.terminal) {
        g.appendChild(this.s('rect', { x: st.x - 4, y: st.y - 4, width: st.w + 8, height: st.h + 8, rx: rx + 4, class: 'ring' }));
      }
      g.appendChild(this.s('rect', { x: st.x, y: st.y, width: st.w, height: st.h, rx, class: 'body' }));
      g.appendChild(this.sText(st.x + st.w / 2, st.y + st.h / 2 + 4, st.label, 'lbl'));
      if (st.card) { g.setAttribute('data-card-id', st.id); cards[st.id] = st.card; }
      svg.appendChild(g);
    }

    for (const item of [...(v.states || []), ...(v.transitions || [])]) {
      if (item.badgeAt && item.id) {
        const b = this.sText(item.badgeAt[0], item.badgeAt[1], '', 'badge');
        b.setAttribute('data-badge-for', item.id);
        svg.appendChild(b);
      }
    }

    this.setCards(cards);
    return svg;
  }
}
