/* Portolab mock: hooks, icons, primitives, and charts. */
const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext, createContext, Fragment } = React;
const html = htm.bind(React.createElement);
const F = PL.fmt;
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ---------- hooks ---------- */
function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const r = el.getBoundingClientRect();
    setSize([Math.round(r.width), Math.round(r.height)]);
    const ro = new ResizeObserver((entries) => {
      const c = entries[0].contentRect;
      setSize((old) => (old[0] === Math.round(c.width) && old[1] === Math.round(c.height) ? old : [Math.round(c.width), Math.round(c.height)]));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size[0], size[1]];
}
function useMedia(query) {
  const get = () => (typeof matchMedia === 'function' ? matchMedia(query).matches : false);
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}
let idCounter = 0;
function useStableId(prefix) {
  const ref = useRef(null);
  if (ref.current == null) ref.current = (prefix || 'id') + '-' + ++idCounter;
  return ref.current;
}
function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function storageSet(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) {
    /* Storage is a convenience. The page works without it. */
  }
}

/* Keeps focus inside a dialog, closes it with Escape, and gives focus back to the control that opened it. */
function useDialog(onClose, active) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    const before = document.activeElement;
    const el = ref.current;
    const focusables = () => Array.from(el.querySelectorAll('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
    const first = (el.hasAttribute('data-autofocus') ? el : el.querySelector('[data-autofocus]')) || focusables()[0];
    if (first) first.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const a = list[0];
        const b = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      if (before && before.focus && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [active]);
  return ref;
}

/* ---------- icons ---------- */
const ICONS = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14',
  trend: 'M3 17l6-6 4 4 8-8M14 7h7v7',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  pie: 'M21 12A9 9 0 1 1 12 3v9h9Z',
  cap: 'M22 10 12 5 2 10l10 5 10-5ZM6 12v5c3 2.5 9 2.5 12 0v-5',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  fall: 'M3 7l6 6 4-4 8 8M14 17h7v-7',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  star: 'M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5 2.6 1-5.6-4.1-3.9 5.6-.8z',
  chevDown: 'M6 9l6 6 6-6',
  chevRight: 'M9 6l6 6-6 6',
  chevLeft: 'M15 6l-6 6 6 6',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.1',
  alert: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V13M12 16.4v.1',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  bulb: 'M9 17.5h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  flask: 'M9.5 3.5h5M10 3.5v6L4.8 18.3A1.5 1.5 0 0 0 6.1 20.5h11.8a1.5 1.5 0 0 0 1.3-2.2L14 9.5v-6M7.5 14.5h9',
  x: 'M7 7l10 10M17 7 7 17',
  hourglass: 'M7 3.5h10M7 20.5h10M8 3.5c0 4 4 5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5-4 8.5s4 4.5 4 8.5',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.7 5.7l12.6 12.6',
  table: 'M3.5 5.5h17v13h-17zM3.5 10h17M3.5 14.5h17M9.5 5.5v13',
  chart: 'M3 17l6-6 4 4 8-8M14 7h7v7',
  brief: 'M3.5 8h17v11.5h-17zM8.5 8V5.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1V8M3.5 13h17',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5',
};
function Icon({ name, className, title }) {
  const d = ICONS[name];
  return html`<svg className=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden=${title ? undefined : 'true'} role=${title ? 'img' : undefined}>
    ${title ? html`<title>${title}</title>` : null}
    <path d=${d} />
  </svg>`;
}
function Tri({ dir }) {
  return dir > 0
    ? html`<svg className="tri" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1 9.5 9h-9Z" fill="currentColor" /></svg>`
    : dir < 0
      ? html`<svg className="tri" viewBox="0 0 10 10" aria-hidden="true"><path d="M.5 1h9L5 9Z" fill="currentColor" /></svg>`
      : null;
}

/* ---------- the app icon ---------- */
/* A flask, for the lab in Portolab, with a rising line of gains inside, on no background, so it sits on the rail like the other icons. The geometry is measured from the reference 20-app-icon-reference.png on a grid of 48, and the view box crops to the flask with its stroke. The flask takes the ink and the line takes the green of gains of the theme. */
const APP_ICON = {
  view: '9 8.7 30 30',
  flask: 'M18.2 10.7H29.8M19.9 10.7V18.7L12.36 31.14A3.665 3.665 0 0 0 15.5 36.7H32.5A3.665 3.665 0 0 0 35.64 31.14L28.1 18.7V10.7',
  line: 'M16.45 32.23L20.62 28.17L24.79 31.32L29.57 27.04',
  stroke: 2.4,
};
function AppIcon({ size = 36 }) {
  return html`<svg className="app-icon" width=${size} height=${size} viewBox=${APP_ICON.view} aria-hidden="true">
    <path className="ai-flask" d=${APP_ICON.flask} strokeWidth=${APP_ICON.stroke} />
    <path className="ai-line" d=${APP_ICON.line} strokeWidth=${APP_ICON.stroke} />
  </svg>`;
}

/* ---------- small primitives ---------- */
/* The sign and the arrow come from the value as the page shows it, so a mark never disagrees with a rounded number. */
function directionOf(text) {
  if (/^[+]/.test(text)) return 1;
  if (/^[-−]/.test(text)) return -1;
  return 0;
}
function Delta({ value, kind = 'pct', digits = 2, pill, className, suffix }) {
  const text = kind === 'pct' ? F.pctSigned(value, digits) : kind === 'rp' ? F.rpSigned(value) : kind === 'rpc' ? F.rpCompactSigned(value) : F.numSigned(value, digits);
  const dir = directionOf(text);
  const cls = 'delta ' + (dir > 0 ? 'up' : dir < 0 ? 'down' : 'flat') + (pill ? ' pill' : '') + (className ? ' ' + className : '');
  const spoken = (dir > 0 ? 'naik ' : dir < 0 ? 'turun ' : '') + text.replace(/^[+\-−]/, '');
  return html`<span className=${cls}>${dir !== 0 ? html`<${Tri} dir=${dir} />` : null}<span aria-hidden="true">${text}</span><span className="sr-only">${spoken}</span>${suffix ? html`<span className="muted" style=${{ fontWeight: 400 }}>${suffix}</span>` : null}</span>`;
}
function Q({ id, ctx, label }) {
  const app = useApp();
  const concept = CONCEPTS[id];
  return html`<button type="button" className="q" aria-label=${'Apa itu ' + (label || (concept ? concept.title : id)) + '?'} onClick=${(e) => {
    e.stopPropagation();
    e.preventDefault();
    app.openConcept(id, ctx || {});
  }}><span aria-hidden="true">?</span></button>`;
}
function Seg({ options, value, onChange, label, className, block }) {
  return html`<div className=${'seg' + (block ? ' block' : '') + (className ? ' ' + className : '')} role="group" aria-label=${label}>
    ${options.map(
      (o) => html`<button type="button" key=${o.value} className=${o.className || ''} aria-pressed=${value === o.value ? 'true' : 'false'} onClick=${() => onChange(o.value)}>${o.label}</button>`
    )}
  </div>`;
}
function Ranges({ options, value, onChange, label }) {
  return html`<div className="ranges" role="group" aria-label=${label || 'Rentang waktu'}>
    ${options.map(
      (o) => html`<button type="button" key=${o.value} aria-pressed=${value === o.value ? 'true' : 'false'} aria-label=${o.spoken} onClick=${() => onChange(o.value)}><span aria-hidden="true">${o.label}</span></button>`
    )}
  </div>`;
}
function StatusChip({ status }) {
  const map = {
    open: ['Menunggu', 'hourglass'],
    filled: ['Terisi', 'check'],
    rejected: ['Ditolak', 'x'],
    expired: ['Kedaluwarsa', 'clock'],
    cancelled: ['Dibatalkan', 'ban'],
  };
  const [text, icon] = map[status];
  return html`<span className=${'status ' + status}><${Icon} name=${icon} />${text}</span>`;
}
/* The logo of a company beside its code. A stock without a logo gets a neutral tile with the first two letters of its code. */
function Logo({ code, size }) {
  const src = typeof LOGOS !== 'undefined' ? LOGOS[code] : null;
  const cls = 'logo' + (size ? ' ' + size : '');
  return src ? html`<span className=${cls} aria-hidden="true"><img src=${src} alt="" width="96" height="96" /></span>` : html`<span className=${cls + ' mono'} aria-hidden="true">${code.slice(0, 2)}</span>`;
}
function Card({ title, q, qctx, sub, actions, children, className, id, headId }) {
  return html`<section className=${'card' + (className ? ' ' + className : '')} id=${id} aria-labelledby=${title ? headId || (id ? id + '-h' : undefined) : undefined}>
    ${title
      ? html`<div className="card-head">
          <h2 id=${headId || (id ? id + '-h' : undefined)}>${title}${q ? html`<${Q} id=${q} ctx=${qctx} />` : null}</h2>
          ${actions}
        </div>`
      : null}
    ${sub ? html`<p className="small muted" style=${{ marginTop: '-6px', marginBottom: '8px' }}>${sub}</p>` : null}
    ${children}
  </section>`;
}
function LabelWithQ({ label, q, qctx }) {
  if (!q) return label;
  const text = String(label);
  const cut = text.lastIndexOf(' ');
  const head = cut > 0 ? text.slice(0, cut + 1) : '';
  const tail = cut > 0 ? text.slice(cut + 1) : text;
  return html`${head}<span className="nowrap">${tail}<${Q} id=${q} ctx=${qctx} label=${text} /></span>`;
}
function Stat({ label, q, qctx, value, sub, valueClass }) {
  return html`<div className="stat">
    <div className="stat-label"><${LabelWithQ} label=${label} q=${q} qctx=${qctx} /></div>
    <div className=${'stat-value' + (valueClass ? ' ' + valueClass : '')}>${value}</div>
    ${sub ? html`<div className="stat-sub">${sub}</div>` : null}
  </div>`;
}
function RangeBar({ low, high, value, format }) {
  const pos = high > low ? ((value - low) / (high - low)) * 100 : 50;
  return html`<div>
    <div className="rangebar" role="img" aria-label=${'Terendah ' + format(low) + ', tertinggi ' + format(high) + ', sekarang ' + format(value)}>
      <div className="fill" style=${{ left: 0, width: pos + '%' }}></div>
      <div className="mark" style=${{ left: Math.max(1, Math.min(99, pos)) + '%' }}></div>
    </div>
    <div className="rangebar-ends"><span>${format(low)}</span><span>${format(high)}</span></div>
  </div>`;
}

/* ---------- menus & sheets ---------- */
function Menu({ anchor, onClose, children, className, align = 'left', label, above }) {
  const ref = useDialog(onClose, true);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const el = ref.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = align === 'right' ? r.right - w : r.left;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    let top = above ? r.top - h - 8 : r.bottom + 6;
    if (!above && top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 6);
    if (above && top < 12) top = 12;
    setPos({ left, top });
  }, [anchor]);
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !(anchor && anchor.contains(e.target))) onClose();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
  return html`<div ref=${ref} className=${'menu' + (className ? ' ' + className : '')} role="dialog" aria-label=${label} style=${pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}>${children}</div>`;
}

/* depth stacks sheets that open over other sheets, and width sets the width of a centered sheet on a desktop. */
function Sheet({ title, onClose, children, footer, side, labelId, wide, width, depth }) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);
  const ref = useDialog(close, true);
  const id = useStableId('sheet');
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return html`<${Fragment}>
    <div className="scrim" onClick=${close} style=${Object.assign({ zIndex: 70 + (depth || 0) * 2 }, closing ? { opacity: 0, transition: 'opacity .18s' } : {})}></div>
    <div ref=${ref} tabIndex="-1" data-autofocus className=${'sheet' + (side ? ' side' : '') + (closing ? ' closing' : '')} role="dialog" aria-modal="true" aria-labelledby=${labelId || id} style=${{ zIndex: 71 + (depth || 0) * 2, '--sheet-w': (width || (wide ? 560 : 480)) + 'px' }}>
      <div className="sheet-grip" aria-hidden="true"></div>
      <div className="sheet-head">
        <h2 id=${labelId || id}>${title}</h2>
        <button type="button" className="icon-btn" aria-label="Tutup" onClick=${close}><${Icon} name="close" /></button>
      </div>
      <div className="sheet-body">${typeof children === 'function' ? children(close) : children}</div>
      ${footer ? html`<div className="sheet-foot">${typeof footer === 'function' ? footer(close) : footer}</div>` : null}
    </div>
  <//>`;
}

/* ---------- chart helpers ---------- */
function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function niceTicks(min, max, count) {
  const step = niceStep(max - min, count);
  const out = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) out.push(Math.abs(v) < step / 1e6 ? 0 : v);
  return out;
}
function placeTip(x, width, tipWidth) {
  return x > width / 2 ? { right: Math.max(0, width - x + 12) } : { left: Math.min(x + 12, Math.max(0, width - tipWidth)) };
}
function pathOf(points) {
  let d = '';
  for (let i = 0; i < points.length; i++) d += (i ? 'L' : 'M') + points[i][0].toFixed(1) + ' ' + points[i][1].toFixed(1);
  return d;
}

/* A line chart over trading days with a crosshair that follows the pointer, a finger, or the arrow keys. */
function TimeChart({ xs, series, height = 220, yFormat, tipTitle, baseline, ariaLabel, onActive, area, xLabel, tickFormat }) {
  const [ref, width] = useSize();
  const [active, setActive] = useState(null);
  const gid = useStableId('grad');
  const pad = { l: 4, r: 54, t: 12, b: 26 };
  const n = xs.length;
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) for (const v of s.values) if (v != null) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  if (baseline != null) {
    min = Math.min(min, baseline);
    max = Math.max(max, baseline);
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const x = (i) => pad.l + (n <= 1 ? iw : (i / (n - 1)) * iw);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * ih;
  const ticks = niceTicks(min, max, height < 160 ? 3 : 4);
  const xTickIdx = [];
  const want = width < 420 ? 3 : 5;
  for (let k = 0; k < want; k++) {
    const i = Math.round((k / (want - 1)) * (n - 1));
    if (!xTickIdx.includes(i)) xTickIdx.push(i);
  }
  const setIdx = (i) => {
    const v = i == null ? null : Math.max(0, Math.min(n - 1, i));
    setActive(v);
    if (onActive) onActive(v);
  };
  const fromEvent = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    return Math.round(((px - pad.l) / iw) * (n - 1));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      setIdx(active == null ? n - 1 : active + (e.key === 'ArrowRight' ? step : -step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setIdx(n - 1);
    } else if (e.key === 'Escape') setIdx(null);
  };
  const tipW = 168;
  const a = active;
  return html`<div className="chart" ref=${ref} tabIndex="0" role="img" aria-label=${ariaLabel + '. Dengan keyboard, panah kiri dan kanan membaca nilai setiap titik.'}
      onPointerMove=${(e) => setIdx(fromEvent(e))}
      onPointerDown=${(e) => setIdx(fromEvent(e))}
      onPointerLeave=${(e) => {
        if (e.pointerType === 'mouse') setIdx(null);
      }}
      onBlur=${() => setIdx(null)}
      onKeyDown=${onKey}>
    ${width > 0
      ? html`<svg width=${width} height=${height} aria-hidden="true">
          <defs>
            ${series.map(
              (s, i) => html`<linearGradient key=${i} id=${gid + '-' + i} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor=${s.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor=${s.color} stopOpacity="0" />
              </linearGradient>`
            )}
          </defs>
          ${ticks.map(
            (t) => html`<g key=${'t' + t}>
              <line x1=${pad.l} x2=${pad.l + iw} y1=${y(t)} y2=${y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
              <text x=${width - 4} y=${y(t) + 4} textAnchor="end">${yFormat(t)}</text>
            </g>`
          )}
          ${baseline != null ? html`<line x1=${pad.l} x2=${pad.l + iw} y1=${y(baseline)} y2=${y(baseline)} stroke="var(--chart-axis)" strokeWidth="1" />` : null}
          ${xTickIdx.map(
            (i, k) => html`<text key=${'x' + k} x=${x(i)} y=${height - 6} textAnchor=${k === 0 ? 'start' : k === xTickIdx.length - 1 ? 'end' : 'middle'}>${(tickFormat || xLabel)(xs[i], i)}</text>`
          )}
          ${series.map((s, i) => {
            const pts = [];
            s.values.forEach((v, j) => {
              if (v != null) pts.push([x(j), y(v)]);
            });
            const line = pathOf(pts);
            const fill = s.area && pts.length ? line + 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (pad.t + ih) + 'L' + pts[0][0].toFixed(1) + ' ' + (pad.t + ih) + 'Z' : null;
            return html`<g key=${s.id}>
              ${fill ? html`<path d=${fill} fill=${'url(#' + gid + '-' + i + ')'} stroke="none" />` : null}
              <path d=${line} fill="none" stroke=${s.color} strokeWidth=${s.width || 2} strokeLinejoin="round" strokeLinecap="round" />
              ${a == null && pts.length ? html`<circle cx=${pts[pts.length - 1][0]} cy=${pts[pts.length - 1][1]} r="4" fill=${s.color} stroke="var(--surface)" strokeWidth="2" />` : null}
            </g>`;
          })}
          ${a != null
            ? html`<g>
                <line x1=${x(a)} x2=${x(a)} y1=${pad.t} y2=${pad.t + ih} stroke="var(--ink-2)" strokeWidth="1" />
                ${series.map((s) => (s.values[a] != null ? html`<circle key=${s.id} cx=${x(a)} cy=${y(s.values[a])} r="4.5" fill=${s.color} stroke="var(--surface)" strokeWidth="2" />` : null))}
              </g>`
            : null}
        </svg>`
      : html`<div style=${{ height }}></div>`}
    ${a != null && width > 0
      ? html`<div className="tip" style=${Object.assign({ top: 4, width: tipW }, placeTip(x(a), width, tipW))}>
          <div className="tip-title">${tipTitle(xs[a], a)}</div>
          ${series.map(
            (s) => html`<div className="tip-row" key=${s.id}>
              <span className="k"><span className="key-line" style=${{ background: s.color }}></span>${s.label}</span>
              <span className="v">${s.values[a] == null ? 'n/a' : (s.tipFormat || yFormat)(s.values[a])}</span>
            </div>`
          )}
        </div>`
      : null}
  </div>`;
}

function Sparkline({ values, width = 76, height = 22 }) {
  return html`<${Spark} values=${values} width=${width} height=${height} />`;
}

/* Puts each label beside its point where it overlaps no other label and no other point, trying right, left, above, and below in turn. */
function placeLabels(items, bounds) {
  const boxes = [];
  const order = items.map((q, i) => i).sort((a, b) => (items[b].p.strong ? 1 : 0) - (items[a].p.strong ? 1 : 0));
  const hit = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
  for (const i of order) {
    const q = items[i];
    if (!q.p.label) continue;
    const w = q.p.label.length * (q.p.strong ? 6.9 : 6.4);
    const r = (q.p.r || 4.5) + 4;
    const cands = [
      { lx: q.cx + r, ly: q.cy + 4, anchor: 'start', x1: q.cx + r, x2: q.cx + r + w },
      { lx: q.cx - r, ly: q.cy + 4, anchor: 'end', x1: q.cx - r - w, x2: q.cx - r },
      { lx: q.cx, ly: q.cy - r - 2, anchor: 'middle', x1: q.cx - w / 2, x2: q.cx + w / 2 },
      { lx: q.cx, ly: q.cy + r + 11, anchor: 'middle', x1: q.cx - w / 2, x2: q.cx + w / 2 },
      { lx: q.cx + r - 2, ly: q.cy - r, anchor: 'start', x1: q.cx + r - 2, x2: q.cx + r - 2 + w },
      { lx: q.cx + r - 2, ly: q.cy + r + 8, anchor: 'start', x1: q.cx + r - 2, x2: q.cx + r - 2 + w },
      { lx: q.cx - r + 2, ly: q.cy - r, anchor: 'end', x1: q.cx - r + 2 - w, x2: q.cx - r + 2 },
      { lx: q.cx - r + 2, ly: q.cy + r + 8, anchor: 'end', x1: q.cx - r + 2 - w, x2: q.cx - r + 2 },
    ];
    let pick = null;
    for (const c of cands) {
      const box = { x1: c.x1 - 2, x2: c.x2 + 2, y1: c.ly - 11, y2: c.ly + 3 };
      if (box.x1 < bounds.l - 40 || box.x2 > bounds.r + 16 || box.y1 < bounds.t || box.y2 > bounds.b + 2) continue;
      if (boxes.some((b) => hit(b, box))) continue;
      if (items.some((o, j) => j !== i && hit(box, { x1: o.cx - (o.p.r || 4.5) - 1, x2: o.cx + (o.p.r || 4.5) + 1, y1: o.cy - (o.p.r || 4.5) - 1, y2: o.cy + (o.p.r || 4.5) + 1 }))) continue;
      pick = Object.assign(c, { box });
      break;
    }
    if (!pick) pick = Object.assign(cands[0], { box: { x1: cands[0].x1, x2: cands[0].x2, y1: cands[0].ly - 11, y2: cands[0].ly + 3 } });
    q.lx = pick.lx;
    q.ly = pick.ly;
    q.anchor = pick.anchor;
    boxes.push(pick.box);
  }
}
/* Spreads labels apart vertically so that two labels never overlap. */
function spreadLabels(items, minGap) {
  const sorted = items.slice().sort((p, q) => p.ly - q.ly);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (Math.abs(cur.lx - prev.lx) < 64 && cur.ly - prev.ly < minGap) cur.ly = prev.ly + minGap;
  }
  return items;
}

/* A scatter of points with a nearest-point hover layer. Used for the security market line and for risk against return. */
function Scatter({ points, height = 260, xDomain, yDomain, xFormat, yFormat, xTitle, yTitle, line, extras, ariaLabel, onPick, tip, guides }) {
  const [ref, width] = useSize();
  const [active, setActive] = useState(null);
  const pad = { l: 46, r: 18, t: 14, b: 40 };
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;
  const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * iw;
  const Y = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * ih;
  const xt = niceTicks(x0, x1, width < 420 ? 4 : 6);
  const yt = niceTicks(y0, y1, 4);
  const placed = points.map((p) => ({ p, cx: X(p.x), cy: Y(p.y), lx: X(p.x) + 9, ly: Y(p.y) + 4, anchor: 'start' }));
  placeLabels(placed, { l: pad.l, r: pad.l + iw, t: 0, b: pad.t + ih });
  const nearest = (px, py) => {
    let best = null;
    let bd = 30 * 30;
    placed.forEach((q, i) => {
      const d = (q.cx - px) ** 2 + (q.cy - py) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setActive(nearest(e.clientX - r.left, e.clientY - r.top));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active == null ? 0 : (active + 1) % points.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active == null ? points.length - 1 : (active - 1 + points.length) % points.length);
    } else if (e.key === 'Enter' && active != null && onPick) onPick(points[active]);
    else if (e.key === 'Escape') setActive(null);
  };
  const act = active != null ? placed[active] : null;
  const tipW = 190;
  return html`<div className="chart" ref=${ref} tabIndex="0" role="img" aria-label=${ariaLabel + '. Dengan keyboard, panah berpindah antartitik dan Enter membuka perhitungannya.'}
      onPointerMove=${onMove} onPointerDown=${onMove}
      onPointerLeave=${(e) => {
        if (e.pointerType === 'mouse') setActive(null);
      }}
      onClick=${() => {
        if (act && onPick) onPick(act.p);
      }}
      onBlur=${() => setActive(null)} onKeyDown=${onKey}
      style=${{ cursor: act && onPick ? 'pointer' : 'default' }}>
    ${width > 0
      ? html`<svg width=${width} height=${height} aria-hidden="true">
          ${yt.map(
            (t) => html`<g key=${'y' + t}>
              <line className=${Math.abs(t) < 1e-12 ? 'g-ref' : 'g-line'} x1=${pad.l} x2=${pad.l + iw} y1=${Y(t)} y2=${Y(t)} />
              <text x=${pad.l - 7} y=${Y(t) + 3.5} textAnchor="end">${yFormat(t)}</text>
            </g>`
          )}
          ${xt.map(
            (t) => html`<g key=${'x' + t}>
              <line className="g-line" x1=${X(t)} x2=${X(t)} y1=${pad.t} y2=${pad.t + ih} />
              <text x=${X(t)} y=${pad.t + ih + 16} textAnchor="middle">${xFormat(t)}</text>
            </g>`
          )}
          <line className="g-ref" x1=${pad.l} x2=${pad.l + iw} y1=${pad.t + ih} y2=${pad.t + ih} />
          <text className="t-sub" x=${pad.l + iw} y=${height - 4} textAnchor="end">${xTitle}</text>
          ${line ? html`<path className="g-sml" d=${'M' + X(line[0][0]) + ' ' + Y(line[0][1]) + 'L' + X(line[1][0]) + ' ' + Y(line[1][1])} fill="none" />` : null}
          ${guides ? guides({ X, Y }) : null}
          ${placed.map((q, i) => (q.p.stem != null ? html`<line key=${'s' + i} className=${q.p.y >= q.p.stem ? 'g-stem-up' : 'g-stem-dn'} x1=${q.cx} x2=${q.cx} y1=${q.cy} y2=${Y(q.p.stem)} />` : null))}
          ${extras ? extras({ X, Y }) : null}
          ${placed.map(
            (q, i) => html`<g key=${'p' + i}>
              ${q.p.shape === 'diamond'
                ? html`<path className="p-ihsg" d=${'M' + q.cx + ' ' + (q.cy - 7) + 'l7 7-7 7-7-7Z'} />`
                : q.p.hollow
                  ? html`<circle cx=${q.cx} cy=${q.cy} r=${q.p.r || 5} fill="var(--plot)" stroke=${q.p.color} strokeWidth="2" />`
                  : html`<circle cx=${q.cx} cy=${q.cy} r=${(q.p.r || 4.5) + (active === i ? 1.5 : 0)} fill=${q.p.color} stroke="var(--plot)" strokeWidth="2" />`}
              ${q.p.label ? html`<text className=${q.p.strong ? 't-lab halo' : 't-sub halo'} x=${q.lx} y=${q.ly} textAnchor=${q.anchor}>${q.p.label}</text>` : null}
            </g>`
          )}
        </svg>`
      : html`<div style=${{ height }}></div>`}
    ${act && width > 0 ? html`<div className="tip" style=${Object.assign({ top: Math.max(0, act.cy - 70), width: tipW }, placeTip(act.cx, width, tipW))}>${tip(act.p)}</div>` : null}
  </div>`;
}

/* Interpolates the diverging scale for a correlation, from orange at -1 through grey at 0 to blue at 1. */
function divergingFill(v) {
  const k = Math.round(Math.min(1, Math.abs(v)) * 100);
  return 'color-mix(in oklab, ' + (v >= 0 ? 'var(--div-pos)' : 'var(--div-neg)') + ' ' + k + '%, var(--div-mid))';
}
