/*
 * <wc-sequence> — message diagrams. Answers: in what order?
 * Actors head dashed lifelines; shaded bars show who is busy; solid
 * arrows call and dashed arrows answer.
 */
import { WoodcutFigure } from './frame.js';

export class WoodcutSequence extends WoodcutFigure {
  buildSvg(v) {
    const svg = this.s('svg', { viewBox: `0 0 ${v.viewBox[0]} ${v.viewBox[1]}` });
    const cards = {};
    const byId = {};
    for (const a of v.actors) byId[a.id] = a;
    const top = (v.lifeline && v.lifeline.top) || 36;
    const bottom = (v.lifeline && v.lifeline.bottom) || v.viewBox[1] - 8;

    for (const a of v.actors) {
      const g = this.s('g', { class: 'wc-el wc-node' });
      g.setAttribute('data-el', a.id);
      if (a.dim) g.setAttribute('style', 'opacity: 0.45');
      g.appendChild(this.s('line', { x1: a.x, y1: top, x2: a.x, y2: bottom, class: 'lifeline' }));
      g.appendChild(this.s('rect', { x: a.x - 45, y: 8, width: 90, height: 28, rx: 6, class: 'body' }));
      g.appendChild(this.sText(a.x, 26, a.label, 'lbl'));
      if (a.card) { g.setAttribute('data-card-id', a.id); cards[a.id] = a.card; }
      svg.appendChild(g);
    }

    for (const act of v.activations || []) {
      const a = byId[act.actor];
      svg.appendChild(this.s('rect', { x: a.x - 3, y: act.y1, width: 6, height: act.y2 - act.y1, class: 'act' }));
    }

    for (const m of v.messages || []) {
      const from = byId[m.from], to = byId[m.to];
      const sign = to.x > from.x ? 1 : -1;
      const x1 = from.x + 3 * sign;
      const x2 = to.x - 3 * sign;
      const ret = m.kind === 'return';
      const g = this.s('g', { class: `wc-el wc-edge k-${ret ? 'faint' : 'accent'}` });
      g.setAttribute('data-el', m.id);
      const line = this.s('path', { d: `M ${x1} ${m.y} L ${x2} ${m.y}`, class: 'stroke' });
      if (ret) line.setAttribute('stroke-dasharray', '4 3');
      g.appendChild(line);
      g.appendChild(this.sTip([x2, m.y], [sign, 0]));
      if (m.label) g.appendChild(this.sText((x1 + x2) / 2, m.y - 8, m.label, 'elbl'));
      if (m.card) {
        g.setAttribute('data-card-id', m.id);
        g.appendChild(this.s('path', { d: `M ${Math.min(x1, x2)} ${m.y} L ${Math.max(x1, x2)} ${m.y}`, class: 'hit' }));
        cards[m.id] = m.card;
      }
      svg.appendChild(g);
    }

    for (const m of v.messages || []) {
      if (m.badgeAt && m.id) {
        const b = this.sText(m.badgeAt[0], m.badgeAt[1], '', 'badge');
        b.setAttribute('data-badge-for', m.id);
        svg.appendChild(b);
      }
    }

    this.setCards(cards);
    return svg;
  }
}
