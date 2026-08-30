/*
 * <wc-block-diagram> — structure diagrams. Answers: where does it live?
 * Nodes are boxes with author-supplied coordinates; edges are
 * polylines with arrowheads; dashed groups collect regions.
 */
import { WoodcutFigure } from './frame.js';

export class WoodcutBlockDiagram extends WoodcutFigure {
  buildSvg(v) {
    const svg = this.s('svg', { viewBox: `0 0 ${v.viewBox[0]} ${v.viewBox[1]}` });
    const cards = {};

    const lanes = v.lanes || [];
    for (let i = 0; i < lanes.length; i++) {
      if (i < lanes.length - 1) {
        svg.appendChild(this.s('line', { x1: 0, y1: lanes[i].y2, x2: v.viewBox[0], y2: lanes[i].y2, class: 'lane' }));
      }
      svg.appendChild(this.sText(8, (lanes[i].y1 + lanes[i].y2) / 2 + 3, lanes[i].label, 'lanelbl', 'start'));
    }

    for (const grp of v.groups || []) {
      svg.appendChild(this.s('rect', { x: grp.x, y: grp.y, width: grp.w, height: grp.h, rx: 8, class: 'grp' }));
      if (grp.label) {
        svg.appendChild(this.s('rect', { x: grp.x + 10, y: grp.y + 7, width: grp.label.length * 6.6 + 12, height: 14, class: 'grpbg' }));
        svg.appendChild(this.sText(grp.x + 16, grp.y + 17, grp.label, 'grplbl', 'start'));
      }
    }

    for (const e of v.edges || []) {
      const g = this.s('g', { class: `wc-el wc-edge k-${e.kind || 'faint'}` });
      if (e.id) g.setAttribute('data-el', e.id);
      const d = 'M ' + e.points.map((p) => p.join(' ')).join(' L ');
      const stroke = this.s('path', { d, class: 'stroke' });
      if (e.dashed) stroke.setAttribute('stroke-dasharray', '4 3');
      g.appendChild(stroke);
      if (!e.noTip) {
        const n = e.points.length;
        const dir = [e.points[n - 1][0] - e.points[n - 2][0], e.points[n - 1][1] - e.points[n - 2][1]];
        g.appendChild(this.sTip(e.points[n - 1], dir));
      }
      if (e.label) g.appendChild(this.sText(e.labelAt[0], e.labelAt[1], e.label, 'elbl', e.labelAnchor || 'middle'));
      if (e.card && e.id) {
        g.setAttribute('data-card-id', e.id);
        g.appendChild(this.s('path', { d, class: 'hit' }));
        cards[e.id] = e.card;
      }
      svg.appendChild(g);
    }

    for (const n of v.nodes || []) {
      const g = this.s('g', { class: `wc-el wc-node k-${n.kind || 'plain'}` });
      g.setAttribute('data-el', n.id);
      const shape = n.shape || 'box';
      if (shape === 'end') {
        g.appendChild(this.s('circle', { cx: n.x, cy: n.y, r: 4.5, class: 'enddot' }));
        g.appendChild(this.s('circle', { cx: n.x, cy: n.y, r: 8, class: 'endring' }));
        if (n.label) g.appendChild(this.sText(n.labelAt[0], n.labelAt[1], n.label, 'sub', n.labelAnchor || 'middle'));
      } else {
        if (shape === 'diamond') {
          const cx0 = n.x + n.w / 2, cy0 = n.y + n.h / 2;
          g.appendChild(this.s('polygon', { points: `${cx0},${n.y} ${n.x + n.w},${cy0} ${cx0},${n.y + n.h} ${n.x},${cy0}`, class: 'body' }));
          g.appendChild(this.sText(cx0, cy0 + 3.5, n.label, 'dlbl'));
        } else {
          const rx = shape === 'pill' ? n.h / 2 : (n.rx !== undefined ? n.rx : 6);
          g.appendChild(this.s('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx, class: 'body' }));
          const cx = n.x + n.w / 2;
          g.appendChild(this.sText(cx, n.y + (n.sub ? 22 : n.h / 2 + 4), n.label, 'lbl'));
          if (n.sub) g.appendChild(this.sText(cx, n.y + 37, n.sub, 'sub'));
        }
      }
      if (n.card) { g.setAttribute('data-card-id', n.id); cards[n.id] = n.card; }
      svg.appendChild(g);
    }

    for (const item of [...(v.nodes || []), ...(v.edges || [])]) {
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
