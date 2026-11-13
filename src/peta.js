/* Portolab mock: the map of risk and return, the inline marks on shared scales, the line chart against the IHSG, and the sentences that the screens compute from the data. */

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function cleanNumber(v) {
  return Math.round(v * 1e9) / 1e9;
}
function stepTicks(domain, step) {
  const out = [];
  for (let k = Math.ceil(domain[0] / step - 1e-9); k * step <= domain[1] + 1e-9; k++) out.push(cleanNumber(k * step) || 0);
  return out;
}
/* A domain that holds every value with a little room, with ends on half steps, so the ticks fall on round numbers. */
function niceDomain(values, step, padFraction) {
  const vs = values.filter((v) => v != null && Number.isFinite(v));
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (hi - lo < step) {
    const c = (lo + hi) / 2;
    lo = c - step / 2;
    hi = c + step / 2;
  }
  const room = (hi - lo) * (padFraction == null ? 0.06 : padFraction);
  const half = step / 2;
  const from = cleanNumber(Math.floor((lo - room) / half) * half);
  /* A scale of values that are never negative, such as beta from 0 or a standard deviation, starts at 0 at the lowest. */
  return [lo >= 0 && from < 0 ? 0 : from, cleanNumber(Math.ceil((hi + room) / half) * half)];
}
function median(values) {
  const v = values.slice().sort((a, b) => a - b);
  const n = v.length;
  if (!n) return null;
  return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
}
function firstName(name) {
  return name.split(' ')[0];
}
function initials(name) {
  const parts = name.split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function joinWords(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return items[0] + ' dan ' + items[1];
  return items.slice(0, -1).join(', ') + ', dan ' + items[items.length - 1];
}
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ---------- measuring text, so that labels on a map never collide ---------- */
const MAP_FONTS = {
  lab: '600 12px "Instrument Sans", system-ui, sans-serif',
  val: '500 12px "Instrument Sans", system-ui, sans-serif',
  sub: '400 11.5px "Instrument Sans", system-ui, sans-serif',
  q: '400 11px "Instrument Sans", system-ui, sans-serif',
  ses: '600 10.5px "Instrument Sans", system-ui, sans-serif',
  tick: '400 10.5px "DM Mono", ui-monospace, monospace',
};
let measureContext;
function textWidth(text, font) {
  if (measureContext === undefined) {
    try {
      measureContext = document.createElement('canvas').getContext('2d');
    } catch (e) {
      measureContext = null;
    }
  }
  if (!measureContext) return String(text).length * 6.6;
  measureContext.font = MAP_FONTS[font];
  return measureContext.measureText(String(text)).width;
}
function boxesHit(a, b) {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}
function textBox(x, y, width, anchor) {
  const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
  return { x1: left - 2, x2: left + width + 2, y1: y - 11, y2: y + 3 };
}
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

/* ---------- inline marks ---------- */
function Dv({ value, min, max, refValue }) {
  const span = max - min || 1;
  const z = ((0 - min) / span) * 100;
  const x = ((clamp(value, min, max) - min) / span) * 100;
  return html`<span className="dv" aria-hidden="true"><span className="z" style=${{ left: z + '%' }}></span><span className=${'f ' + (value >= 0 ? 'pos' : 'neg')} style=${{ left: Math.min(z, x) + '%', width: Math.abs(x - z) + '%' }}></span>${refValue != null ? html`<span className="t" style=${{ left: ((clamp(refValue, min, max) - min) / span) * 100 + '%' }}></span>` : null}</span>`;
}
function Ds({ value, min, max, refValue, me }) {
  const span = max - min || 1;
  return html`<span className=${'ds' + (me ? ' me' : '')} aria-hidden="true">${refValue != null ? html`<span className="t" style=${{ left: ((clamp(refValue, min, max) - min) / span) * 100 + '%' }}></span>` : null}<span className="d" style=${{ left: ((clamp(value, min, max) - min) / span) * 100 + '%' }}></span></span>`;
}
function Br({ value, max }) {
  return html`<span className="br" aria-hidden="true"><i style=${{ width: clamp(max > 0 ? (value / max) * 100 : 0, 0, 100) + '%' }}></i></span>`;
}
function Spark({ values, width = 76, height = 22 }) {
  if (!values || values.length < 2) return html`<span></span>`;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  if (min === max) max = min + 1;
  const n = values.length;
  const pts = values.map((v, i) => [2 + (i / (n - 1)) * (width - 8), 3 + (1 - (v - min) / (max - min)) * (height - 6)]);
  const dir = values[n - 1] > values[0] ? 'up' : values[n - 1] < values[0] ? 'dn' : 'fl';
  const last = pts[n - 1];
  return html`<svg className=${'spark ' + dir} viewBox=${'0 0 ' + width + ' ' + height} width=${width} height=${height} aria-hidden="true"><path d=${pathOf(pts)} /><circle cx=${last[0]} cy=${last[1]} r="2.5" /></svg>`;
}

/* ---------- the map of risk and return ---------- */
const MAP_ORDER = { ghost: 0, dim: 0, off: 1, on: 2, stock: 2, now: 3, ihsg: 3, sel: 4, you: 4 };
function dotRadius(p) {
  switch (p.kind) {
    case 'ghost':
      return 3;
    case 'dim':
      return 4;
    case 'off':
      return 5;
    case 'on':
      return 5.5;
    case 'stock':
      return p.r || 6;
    case 'ihsg':
      return 7;
    case 'now':
      return 6.5;
    case 'sel':
      return 6.5;
    case 'you':
      return 8;
    default:
      return 5;
  }
}
function outerRadius(p) {
  if (p.kind === 'sel') return 11;
  if (p.kind === 'you') return 12.5;
  return dotRadius(p);
}

/*
  points: { x, y, kind, r, label: { text, short, val }, tip: [title, ...lines], pick }
  x and y: { domain, step, format }, and x may have ref and refLabel for the line of the IHSG.
  ihsgLine: { y, label } draws the dashed line of the IHSG. zeroLabel names the line at 0%. median: { y, label }.
  marg: { x: { vals, step, tip }, y: { vals, step, tip } } draws the spread of the points on the top and right edges.
  quad: { long: [4], short: [4] } names the four corners. sml: { from: [x, y], to: [x, y] }. arrows: [{ from: [x, y], to: [x, y] }].
*/
function RiskMap(props) {
  const { points, x, y, ratio = 0.62, minH = 220, maxH = 620, aria, onPick, ihsgLine, zeroLabel, median: med, marg, quad, sml, arrows, xTitle, compact, fill } = props;
  const [ref, W, boxH] = useSize();
  const [active, setActive] = useState(null);
  useFontsReady();
  /* A map that fills its panel takes the height that its row gives it, so the columns beside it end on one line. */
  const H = fill ? Math.max(minH, boxH) : Math.round(clamp((W || 600) * ratio, minH, maxH));
  if (!W) return html`<div className="map" ref=${ref} style=${fill ? null : { height: H }}></div>`;

  const narrow = W < 520;
  const pad = {
    l: compact ? 38 : 50,
    r: marg ? (narrow ? 32 : 60) : compact ? 12 : 20,
    t: marg ? (narrow ? 38 : 48) : compact ? 10 : 16,
    b: xTitle && !compact ? 42 : 28,
  };
  const x0 = pad.l;
  const x1 = W - pad.r;
  const y0 = pad.t;
  const y1 = H - pad.b;
  const X = (v) => x0 + ((v - x.domain[0]) / (x.domain[1] - x.domain[0])) * (x1 - x0);
  const Y = (v) => y1 - ((v - y.domain[0]) / (y.domain[1] - y.domain[0])) * (y1 - y0);
  let xStep = x.step;
  while (stepTicks(x.domain, xStep).length > (narrow || compact ? 5 : 10)) xStep *= 2;
  let yStep = y.step;
  while (stepTicks(y.domain, yStep).length > (H < 280 ? 5 : 7)) yStep *= 2;
  const xTicks = stepTicks(x.domain, xStep);
  const yTicks = stepTicks(y.domain, yStep);
  const refX = x.ref != null && x.ref >= x.domain[0] && x.ref <= x.domain[1] ? x.ref : null;
  const refTick = refX != null ? xTicks.find((t) => Math.abs(t - refX) < xStep * 0.01) : undefined;

  const grid = [];
  const fixed = [];
  const obstacles = [];
  for (const t of yTicks) {
    grid.push(html`<line key=${'gy' + t} className=${Math.abs(t) < 1e-12 ? 'g-ref' : 'g-line'} x1=${x0} x2=${x1} y1=${Y(t)} y2=${Y(t)} />`);
    grid.push(html`<text key=${'ty' + t} x=${x0 - 8} y=${Y(t) + 3.5} textAnchor="end">${y.format(t)}</text>`);
  }
  for (const t of xTicks) {
    const isRef = refTick !== undefined && t === refTick;
    grid.push(html`<line key=${'gx' + t} className=${isRef ? 'g-ref' : 'g-line'} x1=${X(t)} x2=${X(t)} y1=${y0} y2=${y1} />`);
    const nearRef = refX != null && refTick === undefined && Math.abs(X(t) - X(refX)) < 34;
    if (!nearRef) grid.push(html`<text key=${'tx' + t} className=${isRef ? 't-strong' : null} x=${X(t)} y=${y1 + 16} textAnchor="middle">${isRef && x.refLabel ? x.refLabel : x.format(t)}</text>`);
  }
  if (refX != null && refTick === undefined) {
    grid.push(html`<line key="gref" className="g-ref" x1=${X(refX)} x2=${X(refX)} y1=${y0} y2=${y1} />`);
    grid.push(html`<text key="tref" className="t-strong" x=${X(refX)} y=${y1 + 16} textAnchor="middle">${x.refLabel || x.format(refX)}</text>`);
  }
  if (xTitle && !compact) fixed.push(html`<text key="xt" className="t-sub" x=${x1} y=${y1 + 33} textAnchor="end">${xTitle}</text>`);

  const placed = points.map((p, i) => ({ p, i, cx: X(p.x), cy: Y(p.y), r: dotRadius(p), ro: outerRadius(p) }));
  for (const q of placed) obstacles.push({ x1: q.cx - q.ro - 1, x2: q.cx + q.ro + 1, y1: q.cy - q.ro - 1, y2: q.cy + q.ro + 1, own: q.i, faint: q.p.kind === 'ghost' || q.p.kind === 'dim' });

  /* Corner labels, the IHSG line, "Modal awal", and the median are fixed. Each tries its places along its line until it clears the points, and point labels then avoid them. */
  const placeFixed = (key, text, font, places, anchor, cls, always) => {
    const w = textWidth(text, font);
    let pick = null;
    for (const at of places) {
      const box = textBox(at[0], at[1], w, anchor);
      if (box.x1 < x0 - 2 || box.x2 > x1 + 2) continue;
      if (!obstacles.some((b) => boxesHit(b, box))) {
        pick = { at, box };
        break;
      }
    }
    if (!pick && always) pick = { at: places[0], box: textBox(places[0][0], places[0][1], w, anchor) };
    if (!pick) return;
    obstacles.push(pick.box);
    fixed.push(html`<text key=${key} className=${cls} x=${pick.at[0]} y=${pick.at[1]} textAnchor=${anchor}>${text}</text>`);
  };
  const along = (x, yy, dir) => {
    const out = [[x, yy - 6], [x, yy + 14]];
    for (let k = 1; k <= 8; k++) out.push([x + dir * k * 32, yy - 6], [x + dir * k * 32, yy + 14]);
    return out;
  };
  if (quad) {
    const q = narrow || compact ? quad.short : quad.long;
    placeFixed('q0', q[0], 'q', [[x0 + 10, y0 + 18]], 'start', 't-q', true);
    placeFixed('q1', q[1], 'q', [[x1 - 10, y0 + 18]], 'end', 't-q', true);
    placeFixed('q2', q[2], 'q', [[x0 + 10, y1 - 10]], 'start', 't-q', true);
    placeFixed('q3', q[3], 'q', [[x1 - 10, y1 - 10]], 'end', 't-q', true);
  }
  const lines = [];
  if (ihsgLine && ihsgLine.y >= y.domain[0] && ihsgLine.y <= y.domain[1]) {
    const yy = Y(ihsgLine.y);
    lines.push(html`<line key="ihsg-line" className="g-ihsg" x1=${x0} x2=${x1} y1=${yy} y2=${yy} />`);
    if (ihsgLine.label && !compact) placeFixed('ihsg-l', ihsgLine.label, 'sub', along(x0 + 10, yy, 1), 'start', 't-sub halo');
  }
  if (zeroLabel && !compact && 0 >= y.domain[0] && 0 <= y.domain[1]) placeFixed('zero-l', zeroLabel, 'sub', along(x0 + 10, Y(0), 1), 'start', 't-sub halo');
  if (med && !compact) {
    const yy = Y(med.y);
    lines.push(html`<line key="med" className="g-med" x1=${x1 - (narrow ? 64 : 104)} x2=${x1} y1=${yy} y2=${yy} />`);
    placeFixed('med-l', narrow && med.short ? med.short : med.label, 'sub', along(x1 - 8, yy, -1), 'end', 't-sub halo');
  }
  if (sml) {
    const a = [X(sml.from[0]), Y(sml.from[1])];
    const b = [X(sml.to[0]), Y(sml.to[1])];
    lines.push(html`<line key="sml" className="g-sml" x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} />`);
    if (sml.label) placeFixed('sml-l', sml.label, 'sub', [[b[0] - 4, b[1] - 8], [b[0] - 4, b[1] + 16], [b[0] - 40, b[1] + 16]], 'end', 't-sub halo');
  }

  /* The spread of the class on the top and right edges. */
  const bars = [];
  if (marg) {
    const binsOf = (m, domain) => {
      const from = Math.floor(domain[0] / m.step + 1e-9) * m.step;
      const out = [];
      for (let v = from; v < domain[1] - 1e-9; v += m.step) out.push({ from: cleanNumber(v), to: cleanNumber(v + m.step), n: 0 });
      for (const v of m.vals) {
        const k = Math.floor((v - from) / m.step + 1e-9);
        if (k >= 0 && k < out.length) out[k].n += 1;
      }
      return out;
    };
    const bx = binsOf(marg.x, x.domain);
    const by = binsOf(marg.y, y.domain);
    const mx = Math.max(1, ...bx.map((b) => b.n));
    const my = Math.max(1, ...by.map((b) => b.n));
    const topH = pad.t - 20;
    const sideW = pad.r - 22;
    bx.forEach((b, k) => {
      if (!b.n) return;
      const a = Math.max(x0, X(b.from)) + 1;
      const e = Math.min(x1, X(b.to)) - 1;
      const h = (b.n / mx) * topH;
      bars.push({ key: 'bx' + k, x: a, y: y0 - 6 - h, w: Math.max(1, e - a), h, tip: marg.x.tip(b.from, b.to, b.n) });
    });
    by.forEach((b, k) => {
      if (!b.n) return;
      const a = Math.max(y0, Y(b.to)) + 1;
      const e = Math.min(y1, Y(b.from)) - 1;
      const w = (b.n / my) * sideW;
      bars.push({ key: 'by' + k, x: x1 + 8, y: a, w, h: Math.max(1, e - a), tip: marg.y.tip(b.from, b.to, b.n) });
    });
  }

  /* Labels of the reader's own points come first, then the points that keep a name at every width, then the IHSG, then the rest.
     A label sits nearer to its own point than to any other point, and keeps a gap from every other label, so that two labels never read as one. */
  const rankOf = (q) => (q.p.kind === 'you' || q.p.kind === 'sel' || q.p.kind === 'now' ? 0 : q.p.keep ? 1 : q.p.kind === 'ihsg' ? 2 : 3);
  const order = placed.filter((q) => q.p.label).sort((a, b) => rankOf(a) - rankOf(b) || a.i - b.i);
  const labels = [];
  const labelBoxes = [];
  const right = marg ? x1 : W - 2;
  const GAP_X = 8;
  const GAP_Y = 3;
  const named = placed.filter((q) => q.p.kind !== 'ghost' && q.p.kind !== 'dim');
  const distTo = (box, q) => Math.hypot(Math.max(box.x1 - q.cx, 0, q.cx - box.x2), Math.max(box.y1 - q.cy, 0, q.cy - box.y2));
  for (const q of order) {
    const keep = rankOf(q) <= 1;
    const name = narrow && q.p.label.short ? q.p.label.short : q.p.label.text;
    const cands = [];
    for (const extra of [0, 8, 18]) {
      const d = q.ro + 5 + extra;
      const e = d * 0.72;
      cands.push(
        [q.cx + d, q.cy + 4, 'start'],
        [q.cx - d, q.cy + 4, 'end'],
        [q.cx + e, q.cy - e - 1, 'start'],
        [q.cx + e, q.cy + e + 9, 'start'],
        [q.cx - e, q.cy - e - 1, 'end'],
        [q.cx - e, q.cy + e + 9, 'end'],
        [q.cx, q.cy - d - 2, 'middle'],
        [q.cx, q.cy + d + 11, 'middle']
      );
    }
    /* A penalty of 100 or more means the place breaks a rule. Faint points of classmates only count when the label may otherwise vanish. */
    const score = (c, w, relaxFaint) => {
      const box = textBox(c[0], c[1], w, c[2]);
      if (box.x1 < x0 + 1 || box.x2 > right || box.y1 < y0 || box.y2 > y1 + 4) return { box, penalty: Infinity };
      let penalty = Math.hypot(c[0] - q.cx, c[1] - 4 - q.cy) * 0.01;
      const spaced = { x1: box.x1 - GAP_X, x2: box.x2 + GAP_X, y1: box.y1 - GAP_Y, y2: box.y2 + GAP_Y };
      for (const b of labelBoxes) if (boxesHit(spaced, b)) penalty += 1000;
      for (const b of obstacles) {
        if (b.own === q.i || !boxesHit(box, b)) continue;
        penalty += b.faint && relaxFaint ? 2 : 1000;
      }
      const own = distTo(box, q);
      for (const o of named) if (o.i !== q.i && distTo(box, o) <= own + 1) penalty += 500;
      return { box, penalty };
    };
    const best = (w, relaxFaint) => {
      let b = null;
      for (const c of cands) {
        const s = score(c, w, relaxFaint);
        if (!b || s.penalty < b.penalty) b = { c, box: s.box, penalty: s.penalty };
      }
      return b;
    };
    const widthOf = (v) => textWidth(name, 'lab') + (v ? textWidth(' ' + v, 'val') : 0);
    let val = q.p.label.val || '';
    let pick = best(widthOf(val), false);
    /* A label without room for its value keeps its name, and the value stays in the tooltip. */
    if (pick.penalty >= 100 && val) {
      val = '';
      pick = best(widthOf(''), false);
    }
    if (pick.penalty >= 100 && keep) pick = best(widthOf(''), true);
    if (pick.penalty === Infinity || (pick.penalty >= 100 && !keep)) continue;
    labelBoxes.push(pick.box);
    labels.push(html`<text key=${'lb' + q.i} className="t-lab halo" x=${pick.c[0]} y=${pick.c[1]} textAnchor=${pick.c[2]}>${val ? name + ' ' : name}${val ? html`<tspan className="t-val">${val}</tspan>` : null}</text>`);
  }

  const marks = [];
  for (const q of placed) {
    if (q.p.stem == null) continue;
    marks.push(html`<line key=${'st' + q.i} className=${q.p.y >= q.p.stem ? 'g-stem-up' : 'g-stem-dn'} x1=${q.cx} x2=${q.cx} y1=${q.cy} y2=${Y(q.p.stem)} />`);
  }
  for (const [k, a] of (arrows || []).entries()) {
    const ax = X(a.from[0]);
    const ay = Y(a.from[1]);
    const bx = X(a.to[0]);
    const by = Y(a.to[1]);
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 22) continue;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    const sx = ax + ux * 10;
    const sy = ay + uy * 10;
    const ex = bx - ux * 16;
    const ey = by - uy * 16;
    const head = [ex + ux * 6, ey + uy * 6, ex - uy * 4, ey + ux * 4, ex + uy * 4, ey - ux * 4];
    marks.push(html`<g key=${'ar' + k}><line className="g-arrow" x1=${sx} y1=${sy} x2=${ex} y2=${ey} /><path className="g-arrow-head" d=${'M' + head[0] + ' ' + head[1] + 'L' + head[2] + ' ' + head[3] + 'L' + head[4] + ' ' + head[5] + 'Z'} /></g>`);
  }
  const dots = placed
    .slice()
    .sort((a, b) => MAP_ORDER[a.p.kind] - MAP_ORDER[b.p.kind])
    .map((q) => {
      const k = 'pt' + q.i;
      const p = q.p;
      if (p.kind === 'ghost') return html`<circle key=${k} className="p-ghost" cx=${q.cx} cy=${q.cy} r="3" />`;
      if (p.kind === 'dim') return html`<circle key=${k} className="p-dim" cx=${q.cx} cy=${q.cy} r="4" />`;
      if (p.kind === 'off') return html`<circle key=${k} className="p-off" cx=${q.cx} cy=${q.cy} r="5" />`;
      if (p.kind === 'on') return html`<circle key=${k} className="p-on" cx=${q.cx} cy=${q.cy} r="5.5" />`;
      if (p.kind === 'stock') return html`<circle key=${k} className="p-on" cx=${q.cx} cy=${q.cy} r=${q.r} />`;
      if (p.kind === 'now') return html`<circle key=${k} className="p-now" cx=${q.cx} cy=${q.cy} r="6.5" />`;
      if (p.kind === 'ihsg') return html`<path key=${k} className="p-ihsg" d=${'M' + q.cx + ' ' + (q.cy - 7) + 'l7 7-7 7-7-7Z'} />`;
      return html`<g key=${k}><circle className="p-ring" cx=${q.cx} cy=${q.cy} r=${q.ro} /><circle className="p-sel" cx=${q.cx} cy=${q.cy} r=${q.r} /></g>`;
    });

  const interactive = placed.filter((q) => q.p.tip).sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  const findAt = (px, py) => {
    let best = null;
    let bd = Infinity;
    for (const q of interactive) {
      const reach = Math.max(10, q.ro + 4);
      const d = Math.hypot(q.cx - px, q.cy - py);
      if (d <= reach && d < bd) {
        bd = d;
        best = { type: 'p', i: q.i };
      }
    }
    if (best) return best;
    for (const b of bars) if (px >= b.x - 2 && px <= b.x + b.w + 2 && py >= b.y - 2 && py <= b.y + b.h + 2) return { type: 'b', key: b.key };
    return null;
  };
  const local = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const act = active && active.type === 'p' ? placed.find((q) => q.i === active.i) : null;
  const actBar = active && active.type === 'b' ? bars.find((b) => b.key === active.key) : null;
  const onKey = (e) => {
    if (!interactive.length) return;
    const pos = act ? interactive.findIndex((q) => q.i === act.i) : -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive({ type: 'p', i: interactive[(pos + 1) % interactive.length].i });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive({ type: 'p', i: interactive[(pos - 1 + interactive.length) % interactive.length].i });
    } else if (e.key === 'Enter' && act && act.p.pick && onPick) {
      e.preventDefault();
      onPick(act.p);
    } else if (e.key === 'Escape') setActive(null);
  };
  let tip = null;
  let tipLines = null;
  let tipAt = null;
  if (act) {
    tipLines = act.p.tip;
    tipAt = [act.cx, act.cy];
  } else if (actBar) {
    tipLines = actBar.tip;
    tipAt = [actBar.x + actBar.w / 2, actBar.y + actBar.h / 2];
  }
  if (tipLines) {
    const style = {};
    if (tipAt[0] > W / 2) style.right = Math.max(0, W - tipAt[0] + 12);
    else style.left = tipAt[0] + 12;
    if (tipAt[1] > H - 96) style.bottom = Math.max(0, H - tipAt[1] + 12);
    else style.top = tipAt[1] + 12;
    tip = html`<div className="tip" style=${style}><b>${tipLines[0]}</b>${tipLines.slice(1).map((l, k) => html`<div key=${k}>${l}</div>`)}</div>`;
  }
  const pickable = !!(act && act.p.pick && onPick);
  return html`<div className="map" ref=${ref} tabIndex="0" role="img" style=${fill ? { cursor: pickable ? 'pointer' : 'default' } : { height: H, cursor: pickable ? 'pointer' : 'default' }}
      aria-label=${aria + (onPick ? '. Pilih sebuah titik untuk membukanya. Dengan keyboard, panah berpindah antartitik dan Enter membuka titik itu.' : '. Dengan keyboard, panah berpindah antartitik.')}
      onKeyDown=${onKey}
      onPointerMove=${(e) => setActive(findAt(...local(e)))}
      onPointerDown=${(e) => setActive(findAt(...local(e)))}
      onPointerLeave=${(e) => {
        if (e.pointerType === 'mouse') setActive(null);
      }}
      onClick=${() => {
        if (pickable) onPick(act.p);
      }}
      onBlur=${() => setActive(null)}>
    <svg width=${W} height=${H} aria-hidden="true">
      ${grid}
      ${bars.map((b) => html`<rect key=${b.key} className=${'m-bar' + (actBar && actBar.key === b.key ? ' on' : '')} x=${b.x} y=${b.y} width=${b.w} height=${b.h} rx="2" />`)}
      ${lines}
      ${fixed}
      ${marks}
      ${dots}
      ${act && act.p.kind !== 'you' && act.p.kind !== 'sel' ? html`<circle className="p-active" cx=${act.cx} cy=${act.cy} r=${act.ro + 4} />` : null}
      ${labels}
    </svg>
    ${tip}
    <span className="sr-only" aria-live="polite">${tipLines ? tipLines.join('. ') : ''}</span>
  </div>`;
}

/* ---------- the portfolio against the IHSG over time ---------- */
function LineChart({ history, ratio = 0.45, minH = 150, maxH = 420, ses, end, aria, who, fill }) {
  const app = useApp();
  const [ref, W, boxH] = useSize();
  const [active, setActive] = useState(null);
  useFontsReady();
  const H = fill ? Math.max(minH, boxH) : Math.round(clamp((W || 400) * ratio, minH, maxH));
  if (!W) return html`<div className="chart" ref=${ref} style=${fill ? null : { height: H }}></div>`;
  const n = history.length;
  const narrow = W < 420;
  const p = { l: 40, r: end && !narrow ? 104 : 12, t: ses ? 28 : 10, b: 24 };
  const port = history.map((h) => h.ret);
  const ih = history.map((h) => h.ihsg);
  let lo = Math.min(0, ...port, ...ih);
  let hi = Math.max(0, ...port, ...ih);
  if (hi - lo < 0.01) {
    lo -= 0.005;
    hi += 0.005;
  }
  const span = hi - lo;
  const step = span <= 0.04 ? 0.01 : span <= 0.1 ? 0.02 : span <= 0.25 ? 0.05 : 0.1;
  lo -= span * 0.12;
  hi += span * 0.12;
  const iw = W - p.l - p.r;
  const X = (i) => p.l + (n <= 1 ? iw : (i / (n - 1)) * iw);
  const Y = (v) => p.t + ((hi - v) / (hi - lo)) * (H - p.t - p.b);
  const yTicks = stepTicks([lo, hi], step);
  const els = [];
  for (const t of yTicks) {
    els.push(html`<line key=${'gy' + t} className=${Math.abs(t) < 1e-12 ? 'g-ref' : 'g-line'} x1=${p.l} x2=${W - p.r} y1=${Y(t)} y2=${Y(t)} />`);
    els.push(html`<text key=${'ty' + t} x=${p.l - 7} y=${Y(t) + 3.5} textAnchor="end">${F.pctSigned(t, 0)}</text>`);
  }
  if (ses) {
    let prev = null;
    let lastX = -Infinity;
    history.forEach((h, i) => {
      const s = PL.sessionOf(app.market, h.day);
      if (s === prev) return;
      prev = s;
      const xx = X(i);
      els.push(html`<line key=${'gs' + i} className="g-line" x1=${xx} x2=${xx} y1=${p.t - 8} y2=${H - p.b} />`);
      if (xx - lastX < 52) return;
      lastX = xx;
      els.push(html`<text key=${'ts' + i} className="t-ses" x=${xx} y="11" textAnchor=${i === 0 ? 'start' : 'middle'}>${PL.sessionLabel(s)}</text>`);
    });
  }
  let lastFinal = n - 1;
  while (lastFinal > 0 && !history[lastFinal].final) lastFinal -= 1;
  const want = narrow ? 3 : 5;
  const xIdx = [];
  for (let k = 0; k < want; k++) {
    const i = Math.round((k / (want - 1)) * lastFinal);
    if (!xIdx.includes(i)) xIdx.push(i);
  }
  xIdx.forEach((i, k) => {
    const anchor = k === 0 ? 'start' : X(i) > W - p.r - 20 ? 'end' : 'middle';
    els.push(html`<text key=${'tx' + i} x=${X(i)} y=${H - 6} textAnchor=${anchor}>${F.dateShort(app.market, history[i].day)}</text>`);
  });
  const path = (a) => a.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
  els.push(html`<path key="li" className="l-ihsg" d=${path(ih)} />`);
  els.push(html`<path key="lp" className="l-port" d=${path(port)} />`);
  if (active == null) {
    els.push(html`<circle key="ei" className="e-ihsg" cx=${X(n - 1)} cy=${Y(ih[n - 1])} r="4.5" />`);
    els.push(html`<circle key="ep" className="e-port" cx=${X(n - 1)} cy=${Y(port[n - 1])} r="4.5" />`);
  }
  if (end && !narrow) {
    let ya = Y(port[n - 1]) + 4;
    let yb = Y(ih[n - 1]) + 4;
    if (Math.abs(ya - yb) < 14) {
      const mid = (ya + yb) / 2;
      if (port[n - 1] >= ih[n - 1]) {
        ya = mid - 7;
        yb = mid + 7;
      } else {
        ya = mid + 7;
        yb = mid - 7;
      }
    }
    els.push(html`<text key="la" className="t-lab" x=${X(n - 1) + 10} y=${ya}>${(who || 'Anda') + ' '}<tspan className="t-val">${F.pctSigned(port[n - 1])}</tspan></text>`);
    els.push(html`<text key="lb" className="t-sub" x=${X(n - 1) + 10} y=${yb}>IHSG ${F.pctSigned(ih[n - 1])}</text>`);
  }
  if (active != null) {
    const xx = X(active);
    els.push(html`<g key="xh"><line className="xh-l" x1=${xx} x2=${xx} y1=${p.t} y2=${H - p.b} /><circle className="e-ihsg" cx=${xx} cy=${Y(ih[active])} r="4.5" /><circle className="e-port" cx=${xx} cy=${Y(port[active])} r="4.5" /></g>`);
  }
  const fromEvent = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return clamp(Math.round(((e.clientX - r.left - p.l) / iw) * (n - 1)), 0, n - 1);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      setActive(clamp(active == null ? n - 1 : active + d, 0, n - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(n - 1);
    } else if (e.key === 'Escape') setActive(null);
  };
  let tip = null;
  if (active != null) {
    const h = history[active];
    const xx = X(active);
    const style = xx > W / 2 ? { right: W - xx + 12, top: 4 } : { left: xx + 12, top: 4 };
    tip = html`<div className="tip" style=${style}><b>${h.final ? F.date(app.market, h.day) : 'Sekarang, ' + F.time(app.market, h.day, h.minute)}</b><div>${'Portofolio ' + (who ? who + ' ' : '') + F.pctSigned(port[active])}</div><div>IHSG ${F.pctSigned(ih[active])}</div></div>`;
  }
  return html`<div className="chart" ref=${ref} tabIndex="0" role="img" style=${fill ? null : { height: H }}
      aria-label=${aria + '. Dengan keyboard, panah kiri dan kanan membaca setiap hari.'}
      onPointerMove=${(e) => setActive(fromEvent(e))}
      onPointerDown=${(e) => setActive(fromEvent(e))}
      onPointerLeave=${(e) => {
        if (e.pointerType === 'mouse') setActive(null);
      }}
      onBlur=${() => setActive(null)}
      onKeyDown=${onKey}>
    <svg width=${W} height=${H} aria-hidden="true">${els}</svg>
    ${tip}
  </div>`;
}

/* ---------- the axis of every map ---------- */
const AXIS_OPTIONS = [
  { value: 'beta', label: 'Beta' },
  { value: 'sd', label: 'Simpangan baku' },
];
function AxisSeg() {
  const app = useApp();
  return html`<${Seg} label="Sumbu mendatar peta" value=${app.mapAxis} onChange=${app.setMapAxis} options=${AXIS_OPTIONS} />`;
}
function axisOf(axis, M) {
  if (axis === 'sd') {
    return {
      step: 0.01,
      format: (v) => F.pct(v, 0),
      ref: M.sdM,
      refLabel: F.pct(M.sdM, 1),
      title: 'Risiko per bulan (simpangan baku)',
      get: (P) => P.sd,
      word: 'risiko',
      valueText: (v) => 'σ ' + F.pct(v),
      ihsg: M.sdM,
      binTip: (a, b, n) => ['Risiko ' + F.pct(a, 1) + ' sampai ' + F.pct(b, 1), n + ' mahasiswa'],
    };
  }
  return {
    step: 0.1,
    format: (v) => F.num(v, 1),
    ref: 1,
    refLabel: F.num(1, 1),
    title: 'Beta portofolio (1,0 = pasar)',
    get: (P) => P.beta,
    word: 'beta',
    valueText: (v) => 'beta ' + F.num(v),
    ihsg: 1,
    binTip: (a, b, n) => ['Beta ' + F.num(a, 1) + ' sampai ' + F.num(b, 1), n + ' mahasiswa'],
  };
}
const QUAD = {
  long: ['Lebih tenang dari pasar, untung', 'Lebih bergejolak, untung', 'Lebih tenang, rugi', 'Lebih bergejolak, rugi'],
  short: ['Tenang, untung', 'Bergejolak, untung', 'Tenang, rugi', 'Bergejolak, rugi'],
};
const yPct = (v) => F.pctSigned(v, 0);

/* ---------- a class: its rows and its statistics ---------- */
function useClassRows(classId) {
  const app = useApp();
  const id = classId || app.state.lecturerClass;
  const list = app.classes[id] || [];
  const live = app.state.portfolios[id];
  return useMemo(
    () =>
      list.map((st) => {
        const portfolio = st.live ? live : st.portfolio;
        const snap = PL.snapshot(portfolio, app.market, app.clock);
        let last = null;
        for (const o of portfolio.orders) if (!last || o.placed.day > last.day || (o.placed.day === last.day && o.placed.minute > last.minute)) last = o.placed;
        return { st, portfolio, snap, last };
      }),
    [list, live, app.clock]
  );
}
function weekStart(app) {
  const d = new Date(app.market.cal[app.clock.day] + 'T00:00:00Z');
  const back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  const monday = d.toISOString().slice(0, 10);
  let i = app.clock.day;
  while (i > 0 && app.market.cal[i - 1] >= monday) i -= 1;
  return i;
}
const relativeDays = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
function lastActivityText(app, last) {
  if (!last) return 'belum pernah';
  const a = new Date(app.market.cal[app.clock.day] + 'T00:00:00Z');
  const b = new Date(app.market.cal[last.day] + 'T00:00:00Z');
  const days = Math.round((a - b) / 86400000);
  if (days === 0) return 'hari ini, ' + F.timeBare(app.market, last.day, last.minute);
  if (days <= 6) return relativeDays.format(-days, 'day');
  return F.dateShort(app.market, last.day);
}
function classStats(app, rows) {
  const ws = weekStart(app);
  const start = rows.length ? rows[0].portfolio.startDay : PL.dayOf(app.market, '2026-10-14');
  const M = rows.length ? rows[0].snap.M : PL.measures(app.market, PL.lastFinalIndex(app.market, app.clock));
  const ihsgRet = PL.quote(app.market.ihsg, app.market, app.clock).price / app.market.ihsg.close[start] - 1;
  const items = rows.map((r) => {
    let week = 0;
    for (const o of r.portfolio.orders) if (o.placed.day >= ws) week += 1;
    return Object.assign({}, r, { id: r.st.id, name: r.st.name, ret: r.snap.totalReturn, P: r.snap.P, active: week > 0, week });
  });
  const firstCount = {};
  for (const i of items) firstCount[firstName(i.name)] = (firstCount[firstName(i.name)] || 0) + 1;
  for (const i of items) i.short = firstCount[firstName(i.name)] > 1 ? i.name : firstName(i.name);
  const withStocks = items.filter((i) => i.P);
  let ordersWeek = 0;
  for (const i of items) ordersWeek += i.week;
  return {
    M,
    ws,
    start,
    ihsgRet,
    items,
    withStocks,
    N: items.length,
    med: median(items.map((i) => i.ret)),
    above: items.filter((i) => i.ret > ihsgRet).length,
    calmer: withStocks.filter((i) => i.P.beta < 1).length,
    active: items.filter((i) => i.active).length,
    ordersWeek,
    medBeta: median(withStocks.map((i) => i.P.beta)),
    byId: Object.fromEntries(items.map((i) => [i.id, i])),
  };
}
function extremeOf(list, get, highest) {
  let best = null;
  for (const i of list) if (!best || (highest ? get(i) > get(best) : get(i) < get(best))) best = i;
  return best;
}

/* "Kelas unggul 2,16 poin dari IHSG" and its other branches, from the difference in percentage points. */
function leadHeadline(diff, subject) {
  const points = F.num(Math.abs(diff) * 100, 2);
  if (points === F.num(0, 2)) return subject ? subject + ' setara dengan IHSG' : 'Setara dengan IHSG';
  const verb = diff > 0 ? 'unggul' : 'tertinggal';
  return (subject ? subject + ' ' + verb : capitalize(verb)) + ' ' + points + ' poin dari IHSG';
}
function classSummary(app, s) {
  const since = F.dateShort(app.market, s.start);
  let text = 'Median imbal hasil ' + F.pctSigned(s.med) + ' sejak ' + since + ', saat IHSG ' + F.pctSigned(s.ihsgRet) + '. ';
  if (s.above === 0) text += 'Belum ada mahasiswa yang berada di atas pasar';
  else if (s.N === 1) text += 'Satu-satunya mahasiswa berada di atas pasar';
  else if (s.above === s.N) text += 'Semua ' + s.N + ' mahasiswa berada di atas pasar';
  else text += s.above + ' dari ' + s.N + ' mahasiswa berada di atas pasar';
  const W = s.withStocks.length;
  if (!W) return text + ', dan belum ada portofolio yang berisi saham.';
  if (W === 1) return text + ', dan satu-satunya portofolio yang berisi saham ' + (s.calmer ? 'lebih tenang dari pasar.' : 'tidak lebih tenang dari pasar.');
  if (s.calmer === 0) return text + ', dan tidak ada portofolio yang lebih tenang dari pasar.';
  if (s.calmer === W) return text + ', dan semua ' + W + ' portofolio lebih tenang dari pasar.';
  return text + ', dan ' + s.calmer + ' dari ' + W + ' portofolio lebih tenang dari pasar.';
}

/* The students that the data flags for the lecturer: the largest loss, the most volatile, no stocks, and no trade this week. */
function classFlags(app, s) {
  const flags = [];
  const ws = s.withStocks;
  const loss = extremeOf(s.items, (i) => i.ret, false);
  const wild = extremeOf(ws, (i) => i.P.sd, true);
  const inactiveNote = (i) => (i.active ? '' : ' ' + (i.last ? 'Tidak aktif sejak ' + F.dateShort(app.market, i.last.day) + '.' : 'Belum pernah memasang order.'));
  if (loss && loss.ret < 0 && F.pctSigned(loss.ret) !== F.pctSigned(0)) {
    const both = wild && wild.id === loss.id;
    let text = F.pctSigned(loss.ret) + '. ';
    if (both) text += 'Kerugian terbesar dan portofolio paling bergejolak di kelas, σ ' + F.pct(loss.P.sd) + ' per bulan.';
    else text += 'Kerugian terbesar di kelas' + (loss.P ? ', dengan beta ' + F.num(loss.P.beta) : '') + '.';
    flags.push({ key: 'loss', tone: 'bad', icon: 'fall', name: loss.name, text: text + inactiveNote(loss), href: '#/mahasiswa?pilih=' + loss.id });
  }
  if (wild && !(loss && loss.id === wild.id && loss.ret < 0)) {
    flags.push({ key: 'wild', tone: 'bad', icon: 'fall', name: wild.name, text: F.pctSigned(wild.ret) + '. Portofolio paling bergejolak di kelas, σ ' + F.pct(wild.P.sd) + ' per bulan.' + inactiveNote(wild), href: '#/mahasiswa?pilih=' + wild.id });
  }
  const none = s.items.filter((i) => !i.P);
  if (none.length === 1) {
    const i = none[0];
    const text = i.portfolio.orders.length === 0 ? 'Belum punya saham sejak bergabung, jadi tidak tampil di peta.' : i.portfolio.orders.some((o) => o.status === 'filled') ? 'Tidak memegang saham sekarang, jadi tidak tampil di peta.' : 'Belum punya saham karena belum ada order yang terisi, jadi tidak tampil di peta.';
    flags.push({ key: 'none', tone: 'idle', icon: 'clock', name: i.name, text, href: '#/mahasiswa?pilih=' + i.id });
  } else if (none.length > 1) {
    flags.push({ key: 'none', tone: 'idle', icon: 'clock', name: none.length + ' mahasiswa', text: 'belum memegang saham, jadi tidak tampil di peta.', href: '#/mahasiswa?saring=tanpa-saham' });
  }
  const idle = s.items.filter((i) => !i.active);
  if (idle.length) {
    const onMap = idle.filter((i) => i.P).length;
    const where = onMap === idle.length ? ' Titik kosong di peta.' : onMap === 0 ? '' : ' ' + onMap + ' di antaranya tampil sebagai titik kosong di peta.';
    if (idle.length === 1) flags.push({ key: 'idle', tone: 'idle', icon: 'clock', name: idle[0].name, text: 'Belum bertransaksi minggu ini.' + (onMap ? ' Titik kosong di peta.' : ''), href: '#/mahasiswa?pilih=' + idle[0].id });
    else flags.push({ key: 'idle', tone: 'idle', icon: 'clock', name: idle.length + ' mahasiswa', text: 'belum bertransaksi minggu ini.' + where, href: '#/mahasiswa?saring=belum-aktif' });
  }
  return flags;
}

/* Two questions for the session of the current week, computed from the class. A session without questions of its own, such as an exam, uses the last session before it that has them. */
function discussionFor(app, s) {
  const now = PL.sessionOf(app.market, app.clock.day);
  const ws = s.withStocks;
  const W = ws.length;
  const since = F.dateShort(app.market, s.start);
  const betaQuestion = () => {
    if (!W) return 'Belum ada portofolio yang berisi saham. Beta berapa yang cocok untuk portofolio pertama, dan mengapa?';
    if (W === 1) return 'Satu-satunya portofolio yang berisi saham berbeta ' + F.num(ws[0].P.beta) + '. Apa artinya bila IHSG turun 1%?';
    if (s.calmer === W) return 'Semua ' + W + ' portofolio berbeta di bawah 1. Mengapa semua memilih bertahan?';
    if (s.calmer === 0) return 'Tidak ada dari ' + W + ' portofolio yang berbeta di bawah 1. Mengapa semua memilih lebih bergejolak dari pasar?';
    const share = s.calmer / W;
    const tail = share >= 0.75 ? 'Mengapa hampir semua memilih bertahan?' : share <= 0.25 ? 'Mengapa hampir semua memilih lebih bergejolak dari pasar?' : 'Apa yang membedakan kedua kelompok itu?';
    return s.calmer + ' dari ' + W + ' portofolio berbeta di bawah 1. ' + tail;
  };
  const leaderQuestion = () => {
    if (!W) return 'Belum ada imbal hasil dan alpha untuk dibandingkan. Ukuran mana yang paling adil untuk menilai portofolio?';
    if (W === 1) return ws[0].short + ' satu-satunya yang punya saham, dengan imbal hasil ' + F.pctSigned(ws[0].ret) + ' dan alpha ' + F.pctSigned(ws[0].P.alpha) + '. Ukuran mana yang lebih adil untuk menilainya?';
    const top = extremeOf(ws, (i) => i.ret, true);
    const best = extremeOf(ws, (i) => i.P.alpha, true);
    if (top.id === best.id) return top.short + ' unggul di imbal hasil (' + F.pctSigned(top.ret) + ') dan juga di alpha (' + F.pctSigned(best.P.alpha) + '). Apakah kedua ukuran itu selalu sejalan?';
    return top.short + ' unggul di imbal hasil (' + F.pctSigned(top.ret) + '), ' + best.short + ' unggul di alpha (' + F.pctSigned(best.P.alpha) + '). Ukuran mana yang lebih adil?';
  };
  const alphaQuestion = () => {
    if (!W) return 'Belum ada alpha untuk dibahas. Apa arti alpha positif terhadap garis pasar sekuritas?';
    if (W === 1) return 'Alpha satu-satunya portofolio ' + F.pctSigned(ws[0].P.alpha) + '. Apa artinya berada ' + (ws[0].P.alpha < 0 ? 'di bawah' : 'di atas') + ' garis pasar sekuritas?';
    const neg = ws.filter((i) => i.P.alpha < 0).length;
    if (neg === 0) return 'Semua ' + W + ' portofolio beralpha positif. Apa artinya berada di atas garis pasar sekuritas?';
    if (neg === W) return 'Semua ' + W + ' portofolio beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?';
    return neg + ' dari ' + W + ' portofolio beralpha negatif. Apa artinya berada di bawah garis pasar sekuritas?';
  };
  const futuresQuestions = () => [
    'IHSG ' + F.pctSigned(s.ihsgRet) + ' sejak ' + since + '. Bila setiap portofolio dilindungi kontrak futures IHSG sejak hari itu, portofolio mana yang paling berubah, yang berbeta tinggi atau yang berbeta rendah?',
    W ? 'Median beta kelas ' + F.num(s.medBeta) + '. Berapa nilai futures IHSG yang perlu dijual agar beta portofolio median menjadi 0?' : 'Bagaimana kontrak futures IHSG bisa menurunkan beta sebuah portofolio menjadi 0?',
  ];
  const fundQuestions = () => {
    let total = 0;
    for (const i of s.items) total += i.snap.total;
    const pooled = s.N ? total / (s.N * PL.START_CASH) - 1 : 0;
    let held = 0;
    for (const i of s.items) held += i.snap.positions.length;
    const first =
      F.pctSigned(pooled) === F.pctSigned(s.med)
        ? 'Bila ' + s.N + ' portofolio kelas ini digabung menjadi satu reksa dana, imbal hasilnya sama dengan median kelas, ' + F.pctSigned(s.med) + '. Kapan rata-rata dan median bisa berbeda?'
        : 'Bila ' + s.N + ' portofolio kelas ini digabung menjadi satu reksa dana, imbal hasilnya ' + F.pctSigned(pooled) + ' sejak ' + since + ', sedangkan median kelas ' + F.pctSigned(s.med) + '. Mengapa keduanya berbeda?';
    return [first, 'Rata-rata portofolio memegang ' + F.num(s.N ? held / s.N : 0, 1) + ' saham. Apa yang berubah pada risiko tidak sistematis bila jumlah itu dinaikkan seperti di reksa dana saham?'];
  };
  const optionQuestions = () => {
    const losers = s.items.filter((i) => i.ret < 0).length;
    const lo = extremeOf(ws, (i) => i.P.sd, false);
    const hi = extremeOf(ws, (i) => i.P.sd, true);
    return [
      W > 1 ? 'Simpangan baku portofolio di kelas berkisar dari ' + F.pct(lo.P.sd) + ' sampai ' + F.pct(hi.P.sd) + ' per bulan. Mengapa opsi atas portofolio yang paling bergejolak lebih mahal?' : W === 1 ? 'Simpangan baku satu-satunya portofolio ' + F.pct(lo.P.sd) + ' per bulan. Mengapa opsi atas portofolio yang lebih bergejolak lebih mahal?' : 'Mengapa opsi atas saham yang bergejolak lebih mahal?',
      losers === s.N && s.N > 1
        ? 'Semua ' + s.N + ' mahasiswa rugi sejak ' + since + '. Bagaimana opsi jual bisa membatasi kerugian itu, dan berapa biayanya?'
        : losers === 0 ? 'Belum ada mahasiswa yang rugi sejak ' + since + '. Mengapa investor tetap membeli opsi jual saat portofolionya untung?' : losers + ' dari ' + s.N + ' mahasiswa rugi sejak ' + since + '. Bagaimana opsi jual bisa membatasi kerugian itu, dan berapa biayanya?',
    ];
  };
  const bondQuestions = () => {
    let cash = 0;
    for (const i of s.items) cash += i.snap.cashWeight;
    return [
      'Rata-rata kas di kelas ' + F.pct(s.N ? cash / s.N : 1, 0) + ' dari nilai portofolio, dan kas di Portolab tidak berbunga. Berapa tambahan imbal hasil per bulan bila kas itu dipegang dalam obligasi berkupon setara BI-Rate ' + F.pct(PL.BI_RATE) + '?',
      'Tingkat bebas risiko Portolab ' + F.pct(PL.RF, 3) + ' per bulan, dari BI-Rate. Apa yang terjadi pada harga obligasi dan pada garis pasar sekuritas bila BI-Rate naik?',
    ];
  };
  const SETS = {
    9: () => [betaQuestion(), alphaQuestion()],
    10: () => [betaQuestion(), leaderQuestion()],
    11: futuresQuestions,
    12: fundQuestions,
    13: optionQuestions,
    14: bondQuestions,
  };
  let topic = now;
  while (topic > 9 && !SETS[topic]) topic -= 1;
  if (!SETS[topic]) topic = 9;
  return { now, badge: PL.sessionLabel(now), lesson: topic, questions: SETS[topic]() };
}

/* One sentence about one student for the lecturer, from the student's numbers against the class. */
function studentNote(s, item) {
  if (!item.P) {
    const bold = item.portfolio.orders.length === 0 ? 'Belum punya saham sejak bergabung.' : item.portfolio.orders.some((o) => o.status === 'filled') ? 'Tidak memegang saham sekarang.' : 'Belum punya saham karena belum ada order yang terisi.';
    return { bold, rest: 'Beta, risiko, dan alpha muncul setelah order belinya terisi.' };
  }
  const ws = s.withStocks;
  const words = [];
  const top = extremeOf(ws, (i) => i.ret, true);
  const bottom = extremeOf(ws, (i) => i.ret, false);
  const wild = extremeOf(ws, (i) => i.P.sd, true);
  const calm = extremeOf(ws, (i) => i.P.sd, false);
  const bestA = extremeOf(ws, (i) => i.P.alpha, true);
  const worstA = extremeOf(ws, (i) => i.P.alpha, false);
  if (ws.length > 1) {
    if (top.id === item.id) words.push('imbal hasil tertinggi');
    if (bottom.id === item.id) words.push('imbal hasil terendah');
    if (wild.id === item.id) words.push('risiko tertinggi');
    if (calm.id === item.id) words.push('risiko terendah');
    if (bestA.id === item.id) words.push('alpha tertinggi');
    if (worstA.id === item.id) words.push('alpha terendah');
  }
  let bold;
  if (ws.length === 1) bold = 'Satu-satunya portofolio yang berisi saham di kelas.';
  else if (words.length) bold = capitalize(joinWords(words)) + ' di kelas.';
  else {
    const medRet = median(ws.map((i) => i.ret));
    const medSd = median(ws.map((i) => i.P.sd));
    const r = F.pctSigned(item.ret) === F.pctSigned(medRet) ? 'sama dengan' : item.ret > medRet ? 'di atas' : 'di bawah';
    const k = F.pct(item.P.sd) === F.pct(medSd) ? 'sama dengan' : item.P.sd > medSd ? 'di atas' : 'di bawah';
    bold = 'Imbal hasil ' + r + ' median kelas, dan risikonya ' + k + ' median.';
  }
  const b = F.num(item.P.beta);
  const betaText = item.P.beta < 0.9 ? 'Betanya ' + b + ', lebih tenang dari pasar.' : item.P.beta > 1.1 ? 'Betanya ' + b + ', lebih bergejolak dari pasar.' : 'Betanya ' + b + ', hampir sama dengan pasar.';
  const share = Math.min(1, (item.P.beta * item.P.beta * s.M.varM) / item.P.variance);
  const shareText = share < 0.5 ? 'Hanya ' + F.pct(share, 0) + ' variansnya datang dari pasar, dan sisanya dari saham pilihannya.' : F.pct(share, 0) + ' variansnya datang dari pasar, dan sisanya dari saham pilihannya.';
  return { bold, rest: betaText + ' ' + shareText };
}

/* The insight row under the map of Beranda: one concept, said with the student's own numbers. */
function homeInsight(snap, who) {
  const poss = who || 'Anda';
  const M = snap.M;
  if (!snap.P) {
    return { badge: 'Sesi 6 · Order', lesson: 6, text: 'Order ' + poss + ' menunggu. Setelah terisi, saham dan portofolio ' + poss + ' muncul di peta ini.' };
  }
  const pos = snap.positions;
  const beta = (p) => M.stock[p.code].beta;
  const cashClause = snap.cashWeight >= 0.05 ? ' Kas ' + F.pct(snap.cashWeight, 0) + ' menarik beta portofolio turun ke ' + F.num(snap.P.beta) + '.' : '';
  if (pos.length === 1) {
    return { badge: 'Sesi 9 · Beta', lesson: 9, text: pos[0].code + ' satu-satunya saham ' + poss + ', dengan beta ' + F.num(beta(pos[0])) + '.' + cashClause };
  }
  const top = extremeOf(pos, (p) => p.plPct, true);
  const hiB = extremeOf(pos, beta, true);
  const loB = extremeOf(pos, beta, false);
  if (top.plPct > 0 && top.code === hiB.code) {
    return { badge: 'Sesi 9 · Beta', lesson: 9, text: top.code + ' memberi imbal hasil tertinggi dan juga beta tertinggi (' + F.num(beta(top)) + ').' + cashClause };
  }
  if (top.plPct > 0 && top.code === loB.code) {
    return { badge: 'Sesi 9 · Beta', lesson: 9, text: top.code + ' memberi imbal hasil tertinggi walau betanya terendah (' + F.num(beta(top)) + '). Dalam jangka pendek, imbal hasil tidak selalu mengikuti beta.' };
  }
  let worst = null;
  for (const p of pos) {
    const ratio = snap.P.contrib[p.code] / p.weight;
    if (p.weight >= 0.05 && ratio > 1.5 && (!worst || ratio > worst.ratio)) worst = { p, ratio };
  }
  if (worst) {
    return { badge: 'Sesi 10 · Risiko', lesson: 10, text: worst.p.code + ' berbobot ' + F.pct(worst.p.weight, 0) + ' tetapi menyumbang ' + F.pct(snap.P.contrib[worst.p.code], 0) + ' risiko portofolio ' + poss + '.' };
  }
  const sector = snap.sectors[0];
  if (sector && sector.weight >= 0.35) {
    return { badge: 'Sesi 2 · Diversifikasi', lesson: 2, text: F.pct(sector.weight, 0) + ' portofolio ' + poss + ' ada di sektor ' + sector.name + '. Saham satu sektor cenderung bergerak searah.' };
  }
  return { badge: 'Sesi 9 · Beta', lesson: 9, text: 'Beta portofolio ' + poss + ' ' + F.num(snap.P.beta) + ', jadi saat IHSG bergerak 1%, portofolio ' + poss + ' cenderung bergerak ' + F.num(snap.P.beta) + '%.' };
}
