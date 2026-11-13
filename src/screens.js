/* Portolab mock: the student's screens. */
const SECTOR_SHORT = { 'Barang Konsumen Primer': 'Konsumen Primer' };
const sectorShort = (s) => SECTOR_SHORT[s] || s;

function quoteTime(app, q) {
  return q.final ? 'Penutupan ' + F.dateShort(app.market, q.day) : F.time(app.market, q.day, q.minute);
}
function closesUpTo(app, series, count) {
  const lastFinal = PL.lastFinalIndex(app.market, app.clock);
  const out = [];
  for (let d = Math.max(0, lastFinal - count + 1); d <= lastFinal; d++) out.push(series.close[d]);
  if (lastFinal < app.clock.day) {
    const q = PL.quote(series, app.market, app.clock);
    if (!q.before) out.push(q.price);
  }
  return out;
}
function conceptCtx(app, portfolio, snap, extra) {
  return Object.assign({ portfolio, snap }, extra || {});
}
function ihsgSince(app, day) {
  return PL.quote(app.market.ihsg, app.market, app.clock).price / app.market.ihsg.close[day] - 1;
}

/* ---------- Beranda ---------- */
function SinceCard() {
  const app = useApp();
  const events = (app.state.events || []).filter((e) => e.owner === app.ownerKey);
  if (!events.length) return null;
  const portfolio = app.portfolio;
  const byId = Object.fromEntries(portfolio.orders.map((o) => [o.id, o]));
  const items = events.map((e) => byId[e.id]).filter(Boolean);
  if (!items.length) return null;
  return html`<section className="a-card" aria-labelledby="since-h" style=${{ borderColor: 'var(--data)' }}>
    <h3 id="since-h" style=${{ color: 'var(--ink)', fontSize: 15 }}>Sejak kunjungan terakhir<span className="grow"></span><button type="button" className="btn ghost" style=${{ margin: '-12px -8px' }} onClick=${() => app.dispatch({ type: 'clearEvents' })}>Tutup</button></h3>
    ${items.map(
      (o) => html`<div className="since-item" key=${o.id}>
        <div className="row wrap" style=${{ gap: 8 }}><${Logo} code=${o.code} size="sm" /><b>${(o.side === 'buy' ? 'Beli ' : 'Jual ') + F.int(o.lots) + ' lot '}<span className="code">${o.code}</span></b><${StatusChip} status=${o.status} /></div>
        <div className="small ink2">${orderDetail(app, o, portfolio)}</div>
      </div>`
    )}
  </section>`;
}

function riskRows(snap, poss, ctx) {
  const M = snap.M;
  const P = snap.P;
  const mkSharpe = (M.Em - M.rf) / M.sdM;
  const betaWord = F.num(P.beta) === F.num(1) ? 'bergerak seperti pasar' : P.beta < 1 ? 'lebih tenang dari pasar' : 'lebih bergejolak dari pasar';
  const sharpeWord = F.num(P.sharpe) === F.num(mkSharpe) ? 'sama dengan pasar' : P.sharpe < mkSharpe ? 'masih di bawah pasar' : 'di atas pasar';
  const sdMax = Math.max(M.sdM * 1.5, P.sd * 1.15);
  const shLo = Math.min(0, P.sharpe * 1.15, mkSharpe);
  const shHi = Math.max(mkSharpe * 1.5, P.sharpe * 1.15);
  return [
    { key: 'beta', label: 'Beta', q: 'beta', value: F.num(P.beta), v: P.beta, min: 0, max: Math.max(1.5, P.beta * 1.15), ref: 1, note: 'Pasar ' + F.num(1) + '. Portofolio ' + poss + ' ' + betaWord + '.' },
    { key: 'sd', label: 'Risiko per bulan', q: 'risiko', value: F.pct(P.sd), v: P.sd, min: 0, max: sdMax, ref: M.sdM, note: 'IHSG ' + F.pct(M.sdM) + '.' },
    { key: 'sharpe', label: 'Sharpe', q: 'sharpe', value: F.num(P.sharpe), v: P.sharpe, min: shLo, max: shHi, ref: mkSharpe, note: 'IHSG ' + F.num(mkSharpe) + '. Imbal hasil per unit risiko ' + sharpeWord + '.' },
  ].map(
    (r) => html`<div className="a-risk" key=${r.key}>
      <span>${r.label}<${Q} id=${r.q} ctx=${ctx} label=${r.label} /></span><b>${r.value}</b><${Ds} value=${r.v} min=${r.min} max=${r.max} refValue=${r.ref} me />
      <small>${r.note}</small>
    </div>`
  );
}

function homeMapProps(app, snap, mates, who) {
  const M = snap.M;
  const since = F.dateShort(app.market, snap.startDay);
  const ihsgRet = ihsgSince(app, snap.startDay);
  const poss = who || 'Anda';
  const points = [];
  for (const r of mates) if (r.snap.P) points.push({ x: r.snap.P.beta, y: r.snap.totalReturn, kind: 'ghost' });
  for (const p of snap.positions) {
    const b = M.stock[p.code].beta;
    points.push({
      x: b,
      y: p.plPct,
      kind: 'stock',
      keep: true,
      r: 2.3 * Math.sqrt(p.weight * 100),
      label: { text: p.code, val: F.pctSigned(p.plPct) },
      tip: [p.code + ' · ' + p.stock.name, 'Laba atau rugi ' + F.pctSigned(p.plPct) + ' · beta ' + F.num(b), 'Bobot ' + F.pct(p.weight, 1)],
      pick: p.code,
    });
  }
  if (snap.P) points.push({ x: snap.P.beta, y: snap.totalReturn, kind: 'you', label: { text: 'Portofolio ' + poss, short: who || 'Anda', val: F.pctSigned(snap.totalReturn) }, tip: ['Portofolio ' + poss, F.pctSigned(snap.totalReturn) + ' sejak ' + since + ' · beta ' + F.num(snap.P.beta)] });
  points.push({ x: 1, y: ihsgRet, kind: 'ihsg', label: { text: 'IHSG', val: F.pctSigned(ihsgRet) }, tip: ['IHSG', F.pctSigned(ihsgRet) + ' sejak ' + since + ' · beta ' + F.num(1)] });
  const xs = points.map((p) => p.x).concat([0.5, 1.5]);
  const ys = points.map((p) => p.y).concat([0, -0.03, 0.03]);
  return {
    points,
    x: { domain: niceDomain(xs, 0.2), step: 0.2, format: (v) => F.num(v, 1), ref: 1, refLabel: F.num(1, 1) },
    y: { domain: niceDomain(ys, 0.03), step: 0.03, format: yPct },
    since,
    ihsgRet,
  };
}

function HoldingsTable({ snap, portfolio, who }) {
  const app = useApp();
  const ctx = conceptCtx(app, portfolio, snap, { who, code: snap.positions[0].code });
  const maxW = Math.ceil(Math.max(snap.cashWeight, ...snap.positions.map((p) => p.weight)) * 10) / 10;
  let maxPl = 0;
  for (const p of snap.positions) maxPl = Math.max(maxPl, Math.abs(p.pl));
  maxPl = maxPl * 1.1 || 1;
  const title = 'Saham ' + (who || 'Anda') + ' · ' + snap.positions.length;
  const cashNote = snap.reservedCash > 0 ? F.rpCompact(snap.reservedCash) + ' disisihkan untuk order' : 'Tidak berbunga';
  const priceNote = html`<div className="a-tnote"><span>Harga ${quoteTime(app, snap.positions[0].quote)}.</span><span>Harga rata-rata termasuk biaya broker.</span></div>`;
  /* The table of holdings needs the width of two columns, so a narrower screen lists the holdings as rows. */
  if (!app.wide) {
    return html`<section className="a-panel a-wide" aria-labelledby="hold-h">
      <div className="a-ph"><h2 id="hold-h">${title}</h2></div>
      <div className="m-list">
        ${snap.positions.map(
          (p) => html`<a key=${p.code} className="m-row hold" href=${'#/saham/' + p.code}>
            <span className="with-logo"><${Logo} code=${p.code} /><span className="ticker"><b>${p.code}</b><span>${F.int(p.lots)} lot · ${F.int(p.price)} <${Delta} value=${p.dayChange} /></span></span></span>
            <span className="price-col"><span className="p">${F.rp(p.value)}</span><${Delta} value=${p.pl} kind="rp" /></span>
            <span className="marks" style=${{ gridColumn: '1 / -1' }}>
              <span><span className="num">${F.pct(p.weight, 1)}</span><${Br} value=${p.weight} max=${maxW} /></span>
              <span><span className="num">${F.pctSigned(p.plPct)}</span><${Dv} value=${p.pl} min=${-maxPl} max=${maxPl} /></span>
            </span>
          </a>`
        )}
        <div className="m-row hold">
          <span className="with-logo"><span className="logo mono" aria-hidden="true">Rp</span><span className="ticker"><b style=${{ fontFamily: 'var(--f-ui)', fontWeight: 600 }}>Kas</b><span>${cashNote}</span></span></span>
          <span className="price-col"><span className="p">${F.rp(snap.cash)}</span></span>
          <span className="marks" style=${{ gridColumn: '1 / -1' }}><span><span className="num">${F.pct(snap.cashWeight, 1)}</span><${Br} value=${snap.cashWeight} max=${maxW} /></span><span></span></span>
        </div>
      </div>
      ${priceNote}
    </section>`;
  }
  return html`<section className="a-panel a-wide" aria-label=${title}>
    <div className="table-wrap"><table className="a-ht">
      <thead><tr>
        <th>${title}</th><th className="wide" style=${{ textAlign: 'left' }}>Bobot</th><th>Lot</th><th>Harga rata-rata<${Q} id="harga-rata" ctx=${ctx} /></th><th>Harga</th><th>Nilai</th><th className="plcol" style=${{ textAlign: 'left' }}>Laba atau rugi<${Q} id="laba-rugi" ctx=${ctx} label="laba atau rugi" /></th><th className="sparkcol" style=${{ textAlign: 'left' }}>1 bulan</th>
      </tr></thead>
      <tbody>
        ${snap.positions.map(
          (p) => html`<tr key=${p.code} className="click" onClick=${() => app.nav('#/saham/' + p.code)}>
            <td className="tk"><a href=${'#/saham/' + p.code} onClick=${(e) => e.stopPropagation()}><${Logo} code=${p.code} /><span className="tk-name"><b>${p.code}</b><small>${p.stock.name}</small></span></a></td>
            <td className="wide"><div className="cellbar"><span className="v">${F.pct(p.weight, 1)}</span><${Br} value=${p.weight} max=${maxW} /></div></td>
            <td>${F.int(p.lots)}</td>
            <td>${F.int(Math.round(p.avgCost))}</td>
            <td>${F.int(p.price)}<span className="sub"><${Delta} value=${p.dayChange} /></span></td>
            <td>${F.rp(p.value)}</td>
            <td style=${{ width: 330 }}><div className="plc"><${Dv} value=${p.pl} min=${-maxPl} max=${maxPl} /><span><${Delta} value=${p.pl} kind="rp" /></span><span>${F.pctSigned(p.plPct)}</span></div></td>
            <td style=${{ width: 100 }}><${Spark} values=${closesUpTo(app, p.stock, 21)} /></td>
          </tr>`
        )}
        <tr>
          <td className="tk"><div><span className="logo mono" aria-hidden="true">Rp</span><span className="tk-name"><b className="cash">Kas</b><small>${cashNote}</small></span></div></td>
          <td className="wide"><div className="cellbar"><span className="v">${F.pct(snap.cashWeight, 1)}</span><${Br} value=${snap.cashWeight} max=${maxW} /></div></td>
          <td></td><td></td><td></td><td>${F.rp(snap.cash)}</td><td></td><td></td>
        </tr>
      </tbody>
    </table></div>
    ${priceNote}
  </section>`;
}

function EmptyHome({ mates }) {
  const app = useApp();
  const start = app.portfolio.startDay;
  const ihsgRet = ihsgSince(app, start);
  const points = [];
  for (const r of mates) if (r.snap.P) points.push({ x: r.snap.P.beta, y: r.snap.totalReturn, kind: 'ghost' });
  points.push({ x: 1, y: ihsgRet, kind: 'ihsg', label: { text: 'IHSG', val: F.pctSigned(ihsgRet) }, tip: ['IHSG', F.pctSigned(ihsgRet) + ' sejak ' + F.dateShort(app.market, start) + ' · beta ' + F.num(1)] });
  const xs = points.map((p) => p.x).concat([0.4, 1.4]);
  const ys = points.map((p) => p.y).concat([0, -0.03, 0.03]);
  return html`<div className="a-main a-h">
    <h1 className="sr-only">Beranda</h1>
    <div className="a-h-left">
      <section className="a-card welcome o-hero" aria-labelledby="welcome-h">
        <span className="eyebrow">Selamat datang, ${firstName(PEOPLE.student.name)}</span>
        <h2 id="welcome-h" style=${{ fontSize: 15 }}>Modal Anda</h2>
        <div className="big">${F.rp(PL.START_CASH)}</div>
        <p className="ink2">Uang virtual untuk membangun portofolio saham LQ45 selama semester ini, dengan harga BEI yang tertunda sekitar 10 menit.</p>
        <div className="row wrap"><a className="btn primary lg" href="#/pasar"><${Icon} name="search" />Cari saham pertama Anda</a></div>
      </section>
      <button type="button" className="lesson-card o-vs" style=${{ minHeight: 0 }} onClick=${() => app.openLesson('harga')}>
        <span className="sess"><span className="n">Panduan</span>5 menit</span>
        <h3>Cara membaca harga saham</h3>
        <p>Kode, harga terakhir, perubahan, lot, dan fraksi harga dalam satu baris.</p>
        <span className="foot"><span className="lk">Mulai membaca<${Icon} name="chevRight" /></span></span>
      </button>
    </div>
    <section className=${'a-panel a-h-map' + (app.wide ? ' fill' : '')} aria-labelledby="pos-h">
      <div className="a-ph"><h2 id="pos-h">Posisi Anda di peta</h2></div>
      <div className="a-ph2"><div className="a-legend"><span><i className="lg-ihsg"></i>IHSG</span>${mates.length ? html`<span><i className="lg-ghost"></i>Teman sekelas</span>` : null}</div></div>
      <div className="a-ph2" style=${{ paddingTop: 6 }}>Tegak: imbal hasil sejak ${F.dateShort(app.market, start)}. Mendatar: beta.</div>
      <div className=${'a-map' + (app.wide ? ' fill' : '')}>
        <${RiskMap} fill=${app.wide} points=${points} x=${{ domain: niceDomain(xs, 0.2), step: 0.2, format: (v) => F.num(v, 1), ref: 1, refLabel: F.num(1, 1) }} y=${{ domain: niceDomain(ys, 0.03), step: 0.03, format: yPct }}
          xTitle="Beta (1,0 = pasar)" ratio=${0.58} minH=${300} maxH=${520} aria=${'Peta beta dan imbal hasil dengan IHSG' + (mates.length ? ' dan teman sekelas' : '') + '. Portofolio Anda belum berisi saham'} />
      </div>
      <div className="a-insight"><em>Sesi 2 · Portofolio</em><span>Setelah order pertama terisi, portofolio Anda muncul di peta ini${mates.length ? ', di antara teman sekelas' : ''}.</span><button type="button" className="lk" onClick=${() => app.openLesson('2')}>Pelajari<${Icon} name="arrowRight" /></button></div>
    </section>
  </div>`;
}

function HomeView({ portfolio, snap, who, readOnly, classId, selfId, allMates, matesLabel, noTitle }) {
  const app = useApp();
  const [mode, setMode] = useState('peta');
  const history = useMemo(() => PL.history(portfolio, app.market, app.clock), [portfolio, app.clock]);
  const rows = useClassRows(classId || app.state.studentClass);
  const mates = allMates ? rows : rows.filter((r) => (selfId ? r.st.id !== selfId : !r.st.live));
  const mateWord = matesLabel || 'Teman sekelas';
  if (snap.empty && !readOnly) return html`<${EmptyHome} mates=${mates} />`;
  const poss = who || 'Anda';
  const ctx = conceptCtx(app, portfolio, snap, { who });
  const m = homeMapProps(app, snap, mates, who);
  const insight = homeInsight(snap, who);
  const last = history[history.length - 1];
  const ihsgRet = last ? last.ihsg : 0;
  return html`<div className="a-main a-h">
    ${readOnly || noTitle ? null : html`<h1 className="sr-only">Beranda</h1>`}
    ${readOnly ? null : html`<div className="a-wide o-since"><${SinceCard} /></div>`}
    <div className="a-h-left">
      <div className="a-hero o-hero">
        <div className="lab">Nilai portofolio${who ? ' ' + who : ''}<${Q} id="nilai" ctx=${ctx} /></div>
        <div className="val"><small>Rp</small>${F.int(Math.round(snap.total))}</div>
        <div className="a-today"><${Delta} value=${snap.dayChange} kind="rp" pill /><${Delta} value=${snap.dayChangePct} pill /><span>hari ini</span><${Q} id="hari-ini" ctx=${ctx} label="perubahan hari ini" /></div>
      </div>
      <section className="a-card a-vs o-vs" aria-labelledby="vs-h">
        <h3 id="vs-h">Sejak ${F.dateShort(app.market, snap.startDay)}<${Q} id="sejak-awal" ctx=${Object.assign({ history }, ctx)} label="imbal hasil sejak awal" /></h3>
        <div className="big">${leadHeadline(snap.totalReturn - ihsgRet)}</div>
        <div className="keys"><span className="key"><i></i>${poss} ${F.pctSigned(snap.totalReturn)}</span><span className="key ih"><i></i>IHSG ${F.pctSigned(ihsgRet)}</span></div>
        <${LineChart} history=${history} ratio=${0.45} minH=${140} maxH=${170} who=${who} aria=${'Imbal hasil portofolio ' + poss + ' dan IHSG sejak ' + F.date(app.market, snap.startDay) + '. Portofolio ' + F.pctSigned(snap.totalReturn) + ', IHSG ' + F.pctSigned(ihsgRet)} />
      </section>
      <section className="a-card o-risk" aria-labelledby="risk-h">
        <h3 id="risk-h">Risiko dibanding pasar<span className="grow"></span>${who ? null : html`<a className="lk tight" href="#/analisis">Analisis<${Icon} name="chevRight" /></a>`}</h3>
        ${snap.P ? riskRows(snap, poss, ctx) : html`<p className="small muted">Beta, risiko, dan rasio Sharpe muncul setelah order beli pertama terisi.</p>`}
      </section>
    </div>
    <section className=${'a-panel a-h-map' + (app.wide ? ' fill' : '')} aria-labelledby="pos-h">
      <div className="a-ph"><h2 id="pos-h">Posisi ${poss} di peta</h2><span className="grow"></span><${Seg} label="Tampilan" value=${mode} onChange=${setMode} options=${[{ value: 'peta', label: 'Peta' }, { value: 'waktu', label: 'Grafik waktu' }]} /></div>
      ${mode === 'peta'
        ? html`<div className="a-ph2"><div className="a-legend"><span><i className="lg-you"></i>Portofolio ${poss}</span><span><i className="lg-on"></i>Saham ${poss}, ukuran = bobot</span><span><i className="lg-ihsg"></i>IHSG</span>${mates.length ? html`<span><i className="lg-ghost"></i>${mateWord}</span>` : null}</div></div>
            <div className="a-ph2" style=${{ paddingTop: 6 }}>Tegak: imbal hasil. Saham dihitung sejak dibeli, portofolio sejak ${m.since}.</div>
            <div className=${'a-map' + (app.wide ? ' fill' : '')}><${RiskMap} fill=${app.wide} points=${m.points} x=${m.x} y=${m.y} xTitle="Beta (1,0 = pasar)" ratio=${0.58} minH=${320} maxH=${560}
              aria=${'Peta beta dan imbal hasil untuk ' + snap.positions.length + ' saham ' + poss + ', portofolio ' + poss + ', IHSG' + (mates.length ? ', dan teman sekelas' : '')}
              onPick=${(p) => app.nav('#/saham/' + p.pick)} /></div>`
        : html`<div className="a-ph2"><div className="a-legend"><span className="key"><i></i>Portofolio ${poss} ${F.pctSigned(snap.totalReturn)}</span><span className="key ih"><i></i>IHSG ${F.pctSigned(ihsgRet)}</span></div><span className="grow"></span><span>Garis tegak: awal setiap sesi kuliah.</span></div>
            <div className=${'a-map' + (app.wide ? ' fill' : '')}><${LineChart} fill=${app.wide} history=${history} ses end who=${who} ratio=${0.58} minH=${260} maxH=${520} aria=${'Imbal hasil portofolio ' + poss + ' dan IHSG sejak ' + F.date(app.market, snap.startDay) + ', dengan sesi kuliah'} /></div>`}
      <div className="a-insight"><em>${insight.badge}</em><span>${insight.text}</span><button type="button" className="lk" onClick=${() => app.openLesson(String(insight.lesson))}>Pelajari<${Icon} name="arrowRight" /></button></div>
    </section>
    ${snap.positions.length ? html`<${HoldingsTable} snap=${snap} portfolio=${portfolio} who=${who} />` : html`<section className="a-panel a-wide"><div className="empty">${who ? who + ' belum memegang saham.' : 'Order Anda belum terisi, jadi belum ada saham di sini.'}</div></section>`}
  </div>`;
}

/* ---------- Pasar ---------- */
function IhsgCard({ compact }) {
  const app = useApp();
  const q = PL.quote(app.market.ihsg, app.market, app.clock);
  const [range, setRange] = useState('3B');
  const [hover, setHover] = useState(null);
  const lens = { '1B': 21, '3B': 63, '1T': 250 };
  const lastFinal = PL.lastFinalIndex(app.market, app.clock);
  const xs = [];
  for (let d = Math.max(0, lastFinal - lens[range]); d <= lastFinal; d++) xs.push({ day: d, final: true, v: app.market.ihsg.close[d] });
  if (!q.final && !q.before) xs.push({ day: q.day, minute: q.minute, final: false, v: q.price });
  const values = xs.map((p) => p.v);
  const up = values[values.length - 1] >= values[0];
  const h = hover != null ? xs[hover] : null;
  return html`<section className="a-panel" aria-labelledby="ihsg-h">
    <div className="a-ph"><h2 id="ihsg-h">IHSG<${Q} id="ihsg" /></h2><span className="grow"></span><${Ranges} options=${[{ value: '1B', label: '1B', spoken: '1 bulan' }, { value: '3B', label: '3B', spoken: '3 bulan' }, { value: '1T', label: '1T', spoken: '1 tahun' }]} value=${range} onChange=${setRange} label="Rentang grafik IHSG" /></div>
    <div className="row wrap" style=${{ gap: 10, alignItems: 'baseline', padding: '0 18px' }}>
      <span className="num" style=${{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>${F.num(h ? h.v : q.price)}</span>
      ${h ? html`<${Delta} value=${h.v / values[0] - 1} pill />` : html`<${Delta} value=${q.price / q.prevClose - 1} pill />`}
      <span className="xs muted">${h ? (h.final ? F.date(app.market, h.day) : 'Sekarang') + ', dari awal rentang' : quoteTime(app, q)}</span>
    </div>
    <div style=${{ padding: '6px 10px 10px 14px' }}>
      <${TimeChart}
        xs=${xs}
        height=${compact ? 140 : app.desktop ? 180 : 150}
        series=${[{ id: 'ihsg', label: 'IHSG', color: up ? 'var(--gain)' : 'var(--loss)', values, area: true }]}
        yFormat=${(v) => F.int(v)}
        xLabel=${(p) => (p.final ? F.dateShort(app.market, p.day) : 'Kini')}
        tipTitle=${(p) => (p.final ? F.date(app.market, p.day) : 'Sekarang')}
        onActive=${setHover}
        ariaLabel=${'Grafik IHSG ' + range + ', dari ' + F.num(values[0]) + ' ke ' + F.num(values[values.length - 1])}
      />
    </div>
  </section>`;
}

const SORTS = [
  { value: 'change', label: 'Perubahan hari ini', get: (r) => r.change },
  { value: 'price', label: 'Harga', get: (r) => r.q.price },
  { value: 'beta', label: 'Beta', get: (r) => r.m.beta },
  { value: 'sd', label: 'Volatilitas', get: (r) => r.m.sd },
  { value: 'code', label: 'Kode', get: (r) => r.s.code },
];
const MARKET_RANGES = [
  { value: '1B', label: '1B', spoken: '1 bulan', n: 21, word: '1 bulan' },
  { value: '3B', label: '3B', spoken: '3 bulan', n: 63, word: '3 bulan' },
  { value: '1T', label: '1T', spoken: '1 tahun', n: 250, word: '1 tahun' },
];
const STOCK_QUAD = {
  long: ['Lebih tenang dari pasar, naik', 'Lebih bergejolak, naik', 'Lebih tenang, turun', 'Lebih bergejolak, turun'],
  short: ['Tenang, naik', 'Bergejolak, naik', 'Tenang, turun', 'Bergejolak, turun'],
};
function MarketMap({ rows, M }) {
  const app = useApp();
  const [range, setRange] = useState('1B');
  const r = MARKET_RANGES.find((x) => x.value === range);
  const axis = axisOf(app.mapAxis, M);
  const lastFinal = PL.lastFinalIndex(app.market, app.clock);
  const from = Math.max(0, lastFinal - r.n);
  const changeOf = (series) => {
    const q = PL.quote(series, app.market, app.clock);
    return q.price / series.close[from] - 1;
  };
  const snap = app.snap;
  const held = new Set(snap ? snap.positions.map((p) => p.code) : []);
  const xOf = (m) => (app.mapAxis === 'sd' ? m.sd : m.beta);
  const points = rows.map((row) => {
    const ch = changeOf(row.s);
    return {
      x: xOf(row.m),
      y: ch,
      kind: held.size === 0 || held.has(row.s.code) ? 'on' : 'off',
      keep: held.has(row.s.code),
      label: { text: row.s.code },
      tip: [row.s.code + ' · ' + row.s.name, r.word + ' ' + F.pctSigned(ch) + ' · ' + axis.valueText(xOf(row.m)), sectorShort(row.s.sector) + (held.has(row.s.code) ? ' · ada di portofolio Anda' : '')],
      pick: row.s.code,
    };
  });
  const ihsg = changeOf(app.market.ihsg);
  points.push({ x: axis.ihsg, y: ihsg, kind: 'ihsg', label: { text: 'IHSG' }, tip: ['IHSG', r.word + ' ' + F.pctSigned(ihsg) + ' · ' + axis.valueText(axis.ihsg)] });
  if (snap && snap.P) {
    let pr = 0;
    for (const p of snap.positions) pr += p.weight * changeOf(p.stock);
    points.push({ x: axis.get(snap.P), y: pr, kind: 'you', label: { text: 'Portofolio Anda', short: 'Anda' }, tip: ['Portofolio Anda', 'Saham Anda dengan bobot sekarang, ' + r.word + ' ' + F.pctSigned(pr), axis.valueText(axis.get(snap.P))] });
  }
  const xs = points.map((p) => p.x).concat([axis.ihsg]);
  const ys = points.map((p) => p.y).concat([0]);
  const yStep = r.n > 100 ? 0.1 : r.n > 30 ? 0.05 : 0.02;
  return html`<section className="a-panel" aria-labelledby="mmap-h">
    <div className="a-ph"><h2 id="mmap-h">Peta saham LQ45</h2><span className="grow"></span><${Ranges} options=${MARKET_RANGES} value=${range} onChange=${setRange} label="Rentang perubahan harga" /><${AxisSeg} /></div>
    <div className="a-ph2"><div className="a-legend">${held.size ? html`<span><i className="lg-on"></i>Saham Anda</span><span><i className="lg-off"></i>Saham lain</span>` : html`<span><i className="lg-on"></i>Saham LQ45</span>`}${snap && snap.P ? html`<span><i className="lg-you"></i>Portofolio Anda</span>` : null}<span><i className="lg-ihsg"></i>IHSG</span></div><span className="grow"></span><span>Tegak: perubahan harga ${r.word} terakhir.</span></div>
    <div className="a-map">
      <${RiskMap} points=${points} x=${{ domain: niceDomain(xs, axis.step), step: axis.step, format: axis.format, ref: axis.ref, refLabel: axis.refLabel }} y=${{ domain: niceDomain(ys, yStep), step: yStep, format: yPct }}
        ihsgLine=${{ y: ihsg, label: 'IHSG ' + F.pctSigned(ihsg) }} quad=${STOCK_QUAD} xTitle=${app.mapAxis === 'sd' ? 'Volatilitas per bulan (simpangan baku)' : 'Beta (1,0 = pasar)'} ratio=${0.6} minH=${340} maxH=${560}
        aria=${'Peta ' + axis.word + ' dan perubahan harga ' + r.word + ' untuk ' + rows.length + ' saham LQ45 dan IHSG'} onPick=${(p) => app.nav('#/saham/' + p.pick)} />
    </div>
  </section>`;
}

function MarketView() {
  const app = useApp();
  const [view, setView] = useState(app.route.query.tampilan === 'peta' ? 'peta' : 'daftar');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('all');
  const [sort, setSort] = useState('change');
  const [desc, setDesc] = useState(true);
  const [menu, setMenu] = useState(null);
  const M = app.snap ? app.snap.M : PL.measures(app.market, PL.lastFinalIndex(app.market, app.clock));
  const watch = new Set(app.state.watchlist);
  const rows = app.market.stocks.map((s) => {
    const q = PL.quote(s, app.market, app.clock);
    return { s, q, m: M.stock[s.code], change: q.price / q.prevClose - 1, spark: closesUpTo(app, s, 21) };
  });
  const iq = PL.quote(app.market.ihsg, app.market, app.clock);
  const ihsgChange = iq.price / iq.prevClose - 1;
  const qText = query.trim().toLowerCase();
  const sorter = SORTS.find((x) => x.value === sort);
  const filtered = rows
    .filter((r) => (sector === 'all' || r.s.sector === sector) && (!qText || r.s.code.toLowerCase().includes(qText) || r.s.name.toLowerCase().includes(qText)))
    .sort((a, b) => {
      const va = sorter.get(a);
      const vb = sorter.get(b);
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return desc ? -cmp : cmp;
    });
  const watched = filtered.filter((r) => watch.has(r.s.code));
  const sectors = PL.SECTORS.filter((s) => rows.some((r) => r.s.sector === s));
  const quoted = rows[0].q;
  const toggleStar = (code) => app.dispatch({ type: 'star', code });
  let chLo = ihsgChange;
  let chHi = ihsgChange;
  for (const r of rows) {
    chLo = Math.min(chLo, r.change);
    chHi = Math.max(chHi, r.change);
  }
  const chPad = (chHi - chLo) * 0.08 || 0.005;
  chLo = Math.min(0, chLo) - chPad;
  chHi = Math.max(0, chHi) + chPad;
  const betaDomain = niceDomain(rows.map((r) => r.m.beta).concat([1]), 0.1);
  let sdHi = M.sdM;
  for (const r of rows) sdHi = Math.max(sdHi, r.m.sd);
  sdHi *= 1.08;
  const list = (items, label, id) =>
    app.wide
      ? html`<section className="a-panel" aria-labelledby=${id}>
          <div className="a-ph"><h2 id=${id}>${label}</h2></div>
          <div className="table-wrap" style=${{ padding: '0 8px 4px' }}><table className="data fit">
            <thead><tr><th className="col-star"><span className="sr-only">Pantau</span></th><th className="name-col">Saham</th><th className="col-sector">Sektor</th><th className="col-spark">1 bulan</th><th className="r col-price">Harga</th><th className="col-day">Hari ini</th><th className="col-beta">Beta<${Q} id="beta" /></th><th className="col-sd">Volatilitas/bln<${Q} id="risiko" label="volatilitas" /></th></tr></thead>
            <tbody>${items.map(
              (r) => html`<tr key=${r.s.code} className="click" onClick=${() => app.nav('#/saham/' + r.s.code)}>
                <td style=${{ padding: 0 }}><${StarBtn} code=${r.s.code} on=${watch.has(r.s.code)} onToggle=${toggleStar} /></td>
                <td className="name-cell"><a href=${'#/saham/' + r.s.code} className="with-logo" style=${{ color: 'inherit' }} onClick=${(e) => e.stopPropagation()}><${Logo} code=${r.s.code} /><span className="ticker"><b>${r.s.code}</b><span>${r.s.name}</span></span></a></td>
                <td className="small ink2">${sectorShort(r.s.sector)}</td>
                <td><${Spark} values=${r.spark} /></td>
                <td className="r num">${F.rp(r.q.price)}</td>
                <td className="col-day"><div className="cellbar"><span className="v"><${Delta} value=${r.change} /></span><${Dv} value=${r.change} min=${chLo} max=${chHi} refValue=${ihsgChange} /></div></td>
                <td className="col-beta"><div className="cellbar" style=${{ gridTemplateColumns: '34px minmax(0, 1fr)' }}><span className="v">${F.num(r.m.beta)}</span><${Ds} value=${r.m.beta} min=${betaDomain[0]} max=${betaDomain[1]} refValue=${1} /></div></td>
                <td className="col-sd"><div className="cellbar" style=${{ gridTemplateColumns: '50px minmax(0, 1fr)' }}><span className="v">${F.pct(r.m.sd)}</span><${Ds} value=${r.m.sd} min=${0} max=${sdHi} refValue=${M.sdM} /></div></td>
              </tr>`
            )}</tbody>
          </table></div>
        </section>`
      : html`<section className="a-panel" aria-labelledby=${id}>
          <div className="a-ph"><h2 id=${id}>${label}</h2></div>
          <div className="m-list">${items.map(
            (r) => html`<div key=${r.s.code} className="row" style=${{ gap: 0, borderBottom: '1px solid var(--line)', paddingLeft: 4 }}>
              <${StarBtn} code=${r.s.code} on=${watch.has(r.s.code)} onToggle=${toggleStar} />
              <a href=${'#/saham/' + r.s.code} className="list-row stock-row" style=${{ borderBottom: 0, paddingLeft: 0, paddingRight: 14 }}>
                <span className="with-logo"><${Logo} code=${r.s.code} /><span className="ticker"><b>${r.s.code}</b><span>${sort === 'beta' ? 'β ' + F.num(r.m.beta) + ' · ' + r.s.name : sort === 'sd' ? 'σ ' + F.pct(r.m.sd) + ' · ' + r.s.name : r.s.name}</span></span></span>
                <${Spark} values=${r.spark} width=${60} />
                <span className="price-col"><span className="p">${F.rp(r.q.price)}</span><${Delta} value=${r.change} /></span>
              </a>
            </div>`
          )}</div>
        </section>`;
  return html`<div className="stack">
    <div className="a-tools">
      <h1>Pasar</h1>
      <${Seg} label="Tampilan pasar" value=${view} onChange=${setView} options=${[{ value: 'daftar', label: 'Daftar' }, { value: 'peta', label: 'Peta' }]} />
      <span className="grow"></span>
      <label className="search" style=${{ flex: app.desktop ? '0 1 300px' : '1 1 100%' }}><${Icon} name="search" /><input id="market-search" className="input" type="search" placeholder="Cari kode atau nama, misalnya BBRI" value=${query} onInput=${(e) => setQuery(e.target.value)} aria-label="Cari saham" autoComplete="off" /></label>
    </div>
    <${IhsgCard} />
    <div className="row" style=${{ gap: 8, alignItems: 'flex-start', flexWrap: app.desktop ? 'nowrap' : 'wrap' }}>
      <div className=${'chips grow' + (app.desktop ? '' : ' scroll')} role="group" aria-label="Sektor" style=${app.desktop ? null : { flexBasis: '100%' }}>
        <button type="button" className="chip" aria-pressed=${sector === 'all' ? 'true' : 'false'} onClick=${() => setSector('all')}>Semua · <span className="count">${rows.length}</span></button>
        ${sectors.map((s) => html`<button type="button" key=${s} className="chip" aria-pressed=${sector === s ? 'true' : 'false'} onClick=${() => setSector(s)}>${sectorShort(s)} · <span className="count">${rows.filter((r) => r.s.sector === s).length}</span></button>`)}
      </div>
      ${view === 'daftar'
        ? html`<div className="row" style=${{ gap: 2, flex: 'none' }}>
            <button type="button" className="btn" onClick=${(e) => setMenu(e.currentTarget)} aria-haspopup="dialog"><${Icon} name="sliders" />${sorter.label}</button>
            <button type="button" className="icon-btn" onClick=${() => setDesc(!desc)} aria-label=${desc ? 'Urutan menurun. Ubah ke menaik' : 'Urutan menaik. Ubah ke menurun'} title=${desc ? 'Menurun' : 'Menaik'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style=${{ transform: desc ? 'none' : 'scaleY(-1)' }}><path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M13 6h8M13 11h6M13 16h4" /></svg>
            </button>
          </div>`
        : null}
    </div>
    ${view === 'peta'
      ? filtered.length
        ? html`<${MarketMap} rows=${filtered} M=${M} />`
        : null
      : html`${watched.length ? list(watched, 'Pantauan Anda', 'watch-h') : null}${filtered.length ? list(filtered, 'Saham LQ45 · ' + filtered.length, 'all-h') : null}`}
    ${filtered.length ? null : html`<div className="a-panel empty"><${Icon} name="search" /><p>Tidak ada saham LQ45 dengan kode atau nama "${query.trim()}"${sector !== 'all' ? ' di sektor ' + sector : ''}.</p><button type="button" className="btn" onClick=${() => { setQuery(''); setSector('all'); }}>Hapus pencarian</button></div>`}
    <p className="xs muted">Harga ${quoteTime(app, quoted)}. Beta dan volatilitas dari ${M.n} imbal hasil bulanan sampai ${F.month(app.market, M.months[M.months.length - 1])}. Garis tegak di tabel: IHSG.</p>
    ${menu
      ? html`<${Menu} anchor=${menu} onClose=${() => setMenu(null)} label="Urutkan saham" align="right">
          <div className="menu-label">Urutkan menurut</div>
          ${SORTS.map(
            (o) => html`<button type="button" key=${o.value} className="menu-item" onClick=${() => { setSort(o.value); setDesc(o.value !== 'code'); setMenu(null); }}>
              <span className="mi-text">${o.label}</span>${sort === o.value ? html`<${Icon} name="check" className="check" />` : null}
            </button>`
          )}
        <//>`
      : null}
  </div>`;
}
function StarBtn({ code, on, onToggle }) {
  return html`<button type="button" className="icon-btn star-btn" aria-pressed=${on ? 'true' : 'false'} aria-label=${(on ? 'Hapus ' : 'Tambah ') + code + (on ? ' dari pantauan' : ' ke pantauan')} onClick=${(e) => { e.stopPropagation(); onToggle(code); }}>
    <svg viewBox="0 0 24 24" fill=${on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d=${ICONS.star} /></svg>
  </button>`;
}

/* ---------- Saham ---------- */
function impactWeights(snap, code, deltaShares, cashDelta, market, clock) {
  const values = {};
  for (const p of snap.positions) values[p.code] = p.value;
  const price = PL.quote(market.byCode[code], market, clock).price;
  values[code] = (values[code] || 0) + deltaShares * price;
  if (values[code] < 1) delete values[code];
  const cash = snap.cash + cashDelta;
  let total = cash;
  for (const c of Object.keys(values)) total += values[c];
  const weights = {};
  for (const c of Object.keys(values)) weights[c] = values[c] / total;
  const sectors = {};
  for (const c of Object.keys(values)) {
    const s = market.byCode[c].sector;
    sectors[s] = (sectors[s] || 0) + weights[c];
  }
  return { weights, sectors, cashWeight: cash / total, total };
}
/* A portfolio of cash only earns nothing while CAPM asks the risk-free rate for beta 0, so its alpha is minus that rate. */
function beforeMeasures(snap) {
  return snap.P || { beta: 0, sd: 0, E: 0, alpha: -snap.M.rf, required: snap.M.rf, sharpe: null };
}

function ImpactRows({ rows }) {
  return html`<div className="impact">
    ${rows.map((r) => {
      const same = r.format(r.to) === r.format(r.from);
      const dir = same ? 0 : r.to > r.from ? 1 : -1;
      return html`<div className="impact-row" key=${r.label}>
        <span className="k">${r.label}${r.q ? html`<${Q} id=${r.q} ctx=${r.qctx} label=${r.label} />` : null}</span>
        <span className="from">${r.format(r.from)}</span>
        <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d=${ICONS.arrowRight} /></svg>
        <span className="to"><span className="sr-only">menjadi </span>${r.format(r.to)}${dir !== 0 ? html` <span className="muted" aria-hidden="true" style=${{ fontWeight: 400 }}>${dir > 0 ? '▲' : '▼'}</span>` : null}</span>
      </div>`;
    })}
  </div>`;
}

/* The small map of a trade: the portfolio now, the portfolio after, the stock, and the IHSG, by beta or risk against the expected return per month. */
function ImpactMap({ M, before, after, code }) {
  const app = useApp();
  const axis = axisOf(app.mapAxis, M);
  const xOf = (P) => axis.get(P);
  const m = M.stock[code];
  const sx = app.mapAxis === 'sd' ? m.sd : m.beta;
  const e = (v) => F.pct(v) + ' per bulan';
  const points = [
    { x: xOf(before), y: before.E, kind: 'now', label: { text: 'Sekarang' }, tip: ['Portofolio sekarang', 'Imbal hasil harapan ' + e(before.E), axis.valueText(xOf(before))] },
    { x: xOf(after), y: after.E, kind: 'you', label: { text: 'Sesudah' }, tip: ['Portofolio sesudah order', 'Imbal hasil harapan ' + e(after.E), axis.valueText(xOf(after))] },
    { x: sx, y: m.E, kind: 'on', keep: true, label: { text: code }, tip: [code, 'Imbal hasil harapan ' + e(m.E), axis.valueText(sx)] },
    { x: axis.ihsg, y: M.Em, kind: 'ihsg', keep: true, label: { text: 'IHSG' }, tip: ['IHSG', 'Imbal hasil harapan ' + e(M.Em), axis.valueText(axis.ihsg)] },
  ];
  const xs = points.map((p) => p.x).concat(app.mapAxis === 'beta' ? [0] : []);
  const xd = niceDomain(xs, axis.step * (app.mapAxis === 'beta' ? 2 : 1));
  const ys = points.map((p) => p.y).concat([0, M.rf]);
  const sml = app.mapAxis === 'beta' ? { from: [0, M.rf], to: [xd[1], M.rf + xd[1] * (M.Em - M.rf)], label: 'SML' } : null;
  if (sml) ys.push(sml.to[1]);
  return html`<div>
    <div className="row between wrap" style=${{ gap: 4, marginBottom: 2 }}>
      <div className="a-legend"><span><i className="lg-now"></i>Sekarang</span><span><i className="lg-you"></i>Sesudah</span><span><i className="lg-on"></i>${code}</span><span><i className="lg-ihsg"></i>IHSG</span></div>
      <${AxisSeg} />
    </div>
    <${RiskMap} points=${points} x=${{ domain: xd, step: axis.step * (app.mapAxis === 'beta' ? 2 : 1), format: axis.format, ref: axis.ref, refLabel: axis.refLabel }} y=${{ domain: niceDomain(ys, 0.005), step: 0.005, format: (v) => F.pct(v, 1) }}
      sml=${sml} arrows=${[{ from: [xOf(before), before.E], to: [xOf(after), after.E] }]} xTitle=${app.mapAxis === 'sd' ? 'Risiko per bulan' : 'Beta'} ratio=${0.62} minH=${210} maxH=${270}
      aria=${'Portofolio bergerak dari ' + axis.valueText(xOf(before)) + ' ke ' + axis.valueText(xOf(after)) + ', dan imbal hasil harapan dari ' + F.pct(before.E) + ' ke ' + F.pct(after.E) + ' per bulan'} />
    <p className="xs muted" style=${{ marginTop: 2 }}>Tegak: imbal hasil harapan per bulan, dari ${M.n} bulan terakhir.${app.mapAxis === 'beta' ? ' Garis: SML.' : ''}</p>
  </div>`;
}

function StockImpact({ stock, snap, portfolio }) {
  const app = useApp();
  const [share, setShare] = useState(0.1);
  const q = PL.quote(stock, app.market, app.clock);
  const want = snap.total * share;
  const budget = Math.min(want, snap.available);
  const lots = PL.maxBuyLots(budget, q.price);
  const amounts = PL.orderAmounts('buy', q.price, lots);
  const after = impactWeights(snap, stock.code, lots * 100, -amounts.total, app.market, app.clock);
  const A = PL.portfolioMeasures(after.weights, snap.M);
  const B = beforeMeasures(snap);
  const sectorBefore = (snap.sectors.find((s) => s.name === stock.sector) || { weight: 0 }).weight;
  const ctx = conceptCtx(app, portfolio, snap);
  const limited = budget < want;
  return html`<section className="a-card" id="impact" aria-labelledby="impact-h">
    <div className="card-head"><h2 id="impact-h">Dampak ke portofolio<${Q} id="diversifikasi" ctx=${ctx} /></h2><${Seg} label="Bagian portofolio" value=${share} onChange=${setShare} options=${[{ value: 0.05, label: '5%' }, { value: 0.1, label: '10%' }, { value: 0.2, label: '20%' }]} /></div>
    <p className="small ink2" style=${{ marginBottom: 6 }}>${lots > 0
      ? limited
        ? html`Jika Anda membeli ${F.int(lots)} lot ${stock.code} dengan seluruh kas yang tersedia, <span className="num">${F.rp(amounts.total)}</span>:`
        : html`Jika Anda membeli ${F.int(lots)} lot ${stock.code} dari kas, senilai <span className="num">${F.rp(amounts.total)}</span> atau sekitar ${F.pct(share, 0)} portofolio:`
      : html`Kas yang tersedia belum cukup untuk 1 lot ${stock.code}.`}</p>
    ${lots > 0 && A
      ? html`<div className="impact-grid">
          <${ImpactRows} rows=${[
            { label: 'Beta', q: 'beta', qctx: ctx, from: B.beta, to: A.beta, format: (v) => F.num(v) },
            { label: 'Risiko/bln', q: 'risiko', qctx: ctx, from: B.sd, to: A.sd, format: (v) => F.pct(v) },
            { label: 'Imbal hasil harapan/bln', q: 'imbal-harapan', qctx: ctx, from: B.E, to: A.E, format: (v) => F.pct(v) },
            { label: 'Bobot ' + stock.code, from: (snap.positions.find((p) => p.code === stock.code) || { weight: 0 }).weight, to: after.weights[stock.code] || 0, format: (v) => F.pct(v, 1) },
            { label: 'Bobot ' + sectorShort(stock.sector), q: 'bobot-sektor', qctx: ctx, from: sectorBefore, to: after.sectors[stock.sector] || 0, format: (v) => F.pct(v, 1) },
          ]} />
          <${ImpactMap} M=${snap.M} before=${B} after=${A} code=${stock.code} />
        </div>
        <div className="row wrap" style=${{ marginTop: 6 }}>
          <a className="btn" href=${'#/saham/' + stock.code + '/beli?lot=' + lots}>Buka tiket dengan ${F.int(lots)} lot</a>
        </div>`
      : null}
  </section>`;
}

function StockView({ code, side }) {
  const app = useApp();
  const stock = app.market.byCode[code];
  const snap = app.snap;
  const portfolio = app.portfolio;
  const M = snap ? snap.M : PL.measures(app.market, PL.lastFinalIndex(app.market, app.clock));
  const q = PL.quote(stock, app.market, app.clock);
  const [range, setRange] = useState('1T');
  const [hover, setHover] = useState(null);
  const lastFinal = PL.lastFinalIndex(app.market, app.clock);
  const watch = new Set(app.state.watchlist);
  const xs = useMemo(() => {
    if (range === '1H') {
      const day = q.day;
      const path = stock.intraday[day] || null;
      if (!path) return [];
      const steps = q.before ? 64 : q.step;
      const out = [{ day, minute: 540, v: path[0], final: false, prev: true }];
      for (let k = 1; k <= steps; k++) out.push({ day, minute: PL.minuteOfStep(app.market.cal[day], k), v: path[k], final: false });
      return out;
    }
    const n = { '1M': 5, '1B': 21, '3B': 63, '1T': 250, '5T': 5000 }[range];
    const out = [];
    for (let d = Math.max(0, lastFinal - n); d <= lastFinal; d++) out.push({ day: d, v: stock.close[d], final: true });
    if (!q.final && !q.before) out.push({ day: q.day, minute: q.minute, v: q.price, final: false });
    return out;
  }, [range, code, app.clock]);
  const values = xs.map((p) => p.v);
  const up = values.length ? values[values.length - 1] >= values[0] : true;
  const h = hover != null ? xs[hover] : null;
  const pos = snap ? snap.positions.find((p) => p.code === code) : null;
  const ctx = snap ? conceptCtx(app, portfolio, snap, { code }) : { code };
  const m = M.stock[code];
  const corr = snap && snap.P ? PL.correlationWithPortfolio(code, snap.P, M) : null;
  let lo52 = Infinity;
  let hi52 = -Infinity;
  for (let d = Math.max(0, lastFinal - 250); d <= lastFinal; d++) {
    lo52 = Math.min(lo52, stock.low[d]);
    hi52 = Math.max(hi52, stock.high[d]);
  }
  if (!q.before) {
    lo52 = Math.min(lo52, q.low);
    hi52 = Math.max(hi52, q.high);
  }
  const rangeOptions = [
    { value: '1H', label: '1H', spoken: '1 hari' },
    { value: '1M', label: '1M', spoken: '1 minggu' },
    { value: '1B', label: '1B', spoken: '1 bulan' },
    { value: '3B', label: '3B', spoken: '3 bulan' },
    { value: '1T', label: '1T', spoken: '1 tahun' },
    { value: '5T', label: '5T', spoken: '5 tahun' },
  ];
  const long = range === '5T' || range === '1T';
  const ticketOpen = side === 'beli' || side === 'jual';
  const header = html`<div className="stack-sm" style=${{ gap: 4 }}>
    <div className="row" style=${{ gap: 4, marginLeft: -10 }}>
      <button type="button" className="icon-btn" aria-label="Kembali" onClick=${() => (history.length > 1 ? history.back() : app.nav('#/pasar'))}><${Icon} name="chevLeft" /></button>
      <${Logo} code=${code} size="lg" />
      <div className="ticker grow" style=${{ marginLeft: 6 }}><h1 style=${{ fontFamily: 'var(--f-num)', fontWeight: 500, fontSize: 22, letterSpacing: 0 }}>${code}</h1><span>${stock.name}</span></div>
      <${StarBtn} code=${code} on=${watch.has(code)} onToggle=${(c) => app.dispatch({ type: 'star', code: c })} />
    </div>
    <p className="small muted">${stock.sector} · LQ45${pos ? ' · ada di portofolio Anda' : ''}</p>
    <div className="row wrap" style=${{ gap: 10, alignItems: 'baseline', marginTop: 8 }}>
      <span className="hero-value">${F.rp(h ? h.v : q.price)}</span>
      ${h ? html`<${Delta} value=${h.v / values[0] - 1} pill />` : html`<${Delta} value=${q.price - q.prevClose} kind="rp" pill /><${Delta} value=${q.price / q.prevClose - 1} pill />`}
    </div>
    <div className="xs muted">${h ? (h.final ? 'Penutupan ' + F.date(app.market, h.day) : F.time(app.market, h.day, h.minute)) + ', ' + F.pctSigned(h.v / values[0] - 1) + ' dari awal rentang' : quoteTime(app, q) + ' · penutupan sebelumnya ' + F.rp(q.prevClose)}</div>
  </div>`;
  const chart = html`<section className="a-panel" aria-label="Grafik harga">
    <div className="a-ph" style=${{ justifyContent: 'flex-end', minHeight: 48 }}><${Ranges} options=${rangeOptions} value=${range} onChange=${setRange} label="Rentang grafik harga" /></div>
    <div style=${{ padding: '2px 10px 12px 14px' }}>
    ${xs.length
      ? html`<${TimeChart}
          xs=${xs}
          height=${app.desktop ? 300 : 230}
          series=${[{ id: code, label: code, color: up ? 'var(--gain)' : 'var(--loss)', values, area: true, tipFormat: (v) => F.rp(v) }]}
          yFormat=${(v) => F.int(v)}
          xLabel=${(p) => (range === '1H' ? F.minuteOnly(p.minute) : long ? F.monthShort(app.market, p.day) : p.final ? F.dateShort(app.market, p.day) : 'Kini')}
          tipTitle=${(p) => (range === '1H' ? (p.prev ? 'Penutupan sebelumnya' : F.time(app.market, p.day, p.minute)) : p.final ? F.date(app.market, p.day) : 'Sekarang, ' + F.time(app.market, p.day, p.minute))}
          onActive=${setHover}
          ariaLabel=${'Harga ' + code + ' ' + range + ', dari ' + F.rp(values[0]) + ' ke ' + F.rp(values[values.length - 1])}
        />`
      : html`<p className="small muted">Belum ada harga hari ini. Harga tertunda pertama datang sekitar pukul 09.10 WIB.</p>`}
    </div>
  </section>`;
  const stats = html`<section className="a-card" id="stats" aria-labelledby="stats-h">
    <div className="card-head"><h2 id="stats-h">Statistik</h2><span className="xs muted">${M.n} imbal hasil bulanan sampai ${F.month(app.market, M.months[M.months.length - 1])}</span></div>
    <div className="stat-grid auto">
      <div className="stat"><div className="stat-label"><${LabelWithQ} label="Rentang hari ini" q="rentang-hari" qctx=${ctx} /></div>${q.before ? html`<div className="small muted">Belum dibuka</div>` : html`<${RangeBar} low=${q.low} high=${q.high} value=${q.price} format=${F.int} />`}</div>
      <div className="stat"><div className="stat-label"><${LabelWithQ} label="Rentang 52 minggu" q="rentang-52" qctx=${ctx} /></div><${RangeBar} low=${lo52} high=${hi52} value=${q.price} format=${F.int} /></div>
      <${Stat} label="Beta" q="beta" qctx=${ctx} value=${F.num(m.beta)} sub=${m.beta < 0.8 ? 'lebih tenang dari pasar' : m.beta > 1.2 ? 'lebih bergejolak dari pasar' : 'mendekati pasar'} />
      <${Stat} label="Volatilitas/bln" q="risiko" qctx=${ctx} value=${F.pct(m.sd)} sub=${'IHSG ' + F.pct(M.sdM)} />
      <${Stat} label="Imbal hasil harapan/bln" q="imbal-harapan" qctx=${ctx} value=${F.pct(m.E)} sub=${'IHSG ' + F.pct(M.Em)} />
      <${Stat} label="Korelasi dengan portofolio" q="korelasi" qctx=${ctx} value=${corr == null ? 'belum ada' : F.num(corr)} sub=${corr == null ? 'setelah Anda punya saham' : corr < 0.5 ? 'cukup berbeda arah' : 'sering searah'} />
    </div>
  </section>`;
  const position = pos
    ? html`<section className="a-card" id="pos" aria-labelledby="pos-h">
        <div className="card-head"><h2 id="pos-h">Posisi Anda</h2></div>
        <div className="stat-grid auto">
          <${Stat} label="Lot" value=${F.int(pos.lots)} sub=${F.int(pos.shares) + ' lembar'} />
          <${Stat} label="Harga rata-rata" q="harga-rata" qctx=${ctx} value=${F.rp(pos.avgCost)} />
          <${Stat} label="Nilai" value=${F.rp(pos.value)} sub=${F.pct(pos.weight, 1) + ' portofolio'} />
          <${Stat} label="Laba/rugi" q="laba-rugi" qctx=${ctx} value=${html`<${Delta} value=${pos.pl} kind="rp" />`} sub=${html`<${Delta} value=${pos.plPct} />`} />
        </div>
      </section>`
    : null;
  const impact = snap ? html`<${StockImpact} stock=${stock} snap=${snap} portfolio=${portfolio} />` : null;
  const lotParam = (app.route.query && app.route.query.lot) || null;
  const ticket = snap
    ? html`<${Ticket} key=${code + (side || '') + (lotParam || '') + ((app.route.query && app.route.query.t) || '')} code=${code} initialSide=${side === 'jual' ? 'sell' : 'buy'} initialLots=${lotParam} docked=${app.wide} onClose=${() => app.nav('#/saham/' + code, true)} />`
    : null;
  if (app.wide) {
    return html`<div className="stock-layout">
      <div className="stack">${header}${chart}${position}${stats}${impact}</div>
      ${ticket ? html`<aside className="ticket-col a-card" aria-label="Tiket order"><div className="ticket-dock">${ticket}</div></aside>` : null}
    </div>`;
  }
  return html`<div className="stack">
    ${header}${chart}${position}${stats}${impact}
    ${snap
      ? html`<div className="tradebar">
          <a className="btn buy lg" href=${'#/saham/' + code + '/beli'}>Beli</a>
          <a className="btn sell lg" href=${'#/saham/' + code + '/jual'}>Jual</a>
        </div>`
      : null}
    ${ticketOpen && ticket
      ? html`<${Sheet} title=${(side === 'jual' ? 'Jual ' : 'Beli ') + code} side=${app.desktop} onClose=${() => app.nav('#/saham/' + code, true)}>${() => ticket}<//>`
      : null}
  </div>`;
}

/* ---------- the order ticket ---------- */
/* The session that an order placed now waits for, and when its first delayed price arrives. */
function nextSession(app) {
  const phase = app.phase;
  const cal = app.market.cal;
  const day = phase === 'tutup' ? app.clock.day + 1 : app.clock.day;
  const index = phase === 'istirahat' ? 1 : 0;
  const start = PL.sessionsOf(cal[day])[index][0];
  const name = index === 1 ? 'Sesi II' : 'Sesi I';
  const label = day === app.clock.day ? name + ' hari ini' : name + ' hari ' + F.dateLong(app.market, day);
  return { label, firstPrice: F.time(app.market, day, start + PL.DELAY_MINUTES) };
}
function sessionEndText(app, day) {
  return F.time(app.market, day, 950);
}

function Ticket({ code, initialSide, initialLots, docked, onClose }) {
  const app = useApp();
  const stock = app.market.byCode[code];
  const snap = app.snap;
  const q = PL.quote(stock, app.market, app.clock);
  const ref = PL.referencePrice(stock, app.market, app.clock);
  const band = PL.autoRejection(ref);
  /* An order in progress is kept for the session, per stock and side, so leaving the ticket for a lesson or a lookup and coming back finds it as it was. */
  const draftKey = code + ':' + (initialSide || 'buy');
  const kept = initialLots ? {} : app.drafts[draftKey] || {};
  const [side, setSide] = useState(kept.side || initialSide || 'buy');
  const [type, setType] = useState(app.route.query.tipe === 'limit' ? 'limit' : kept.type || 'market');
  const [lotsText, setLotsText] = useState(initialLots ? String(initialLots) : kept.lotsText || '1');
  const [priceText, setPriceText] = useState(kept.priceText || F.int(q.price));
  const [reason, setReason] = useState(kept.reason || '');
  useEffect(() => {
    app.drafts[draftKey] = { side, type, lotsText, priceText, reason };
  }, [side, type, lotsText, priceText, reason]);
  const [result, setResult] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const pos = snap.positions.find((p) => p.code === code);
  const heldShares = pos ? pos.shares : 0;
  const reservedShares = snap.reservedShares[code] || 0;
  const trading = PL.isTrading(app.phase);
  const ctx = conceptCtx(app, app.portfolio, snap, { code });
  const draft = { code, side, type, lotsText, priceText };
  const check = PL.validate(draft, { quote: q, ref, band, available: snap.available, reservedCash: snap.reservedCash, heldShares, reservedShares });
  const issues = check.issues.filter((i) => showAll || !(i.field === 'lots' && lotsText.trim() === ''));
  const lots = check.lots;
  const price = check.price;
  const ok = check.issues.length === 0;
  const amounts = lots != null && price != null ? PL.orderAmounts(side, price, lots) : null;
  const sellable = Math.floor((heldShares - reservedShares) / 100);
  const lotsInput = useRef(null);

  const apply = (set) => {
    if (set.lots != null) setLotsText(F.int(set.lots));
    if (set.price != null) setPriceText(F.int(set.price));
    if (set.side) setSide(set.side);
  };
  const quick = (share) => {
    const p = price != null ? price : q.price;
    if (side === 'buy') {
      const n = PL.maxBuyLots(snap.available * share, p);
      setLotsText(F.int(Math.max(n, share === 1 ? n : 1)));
    } else {
      setLotsText(F.int(Math.max(1, Math.floor(sellable * share))));
    }
  };
  const stepLots = (d) => {
    const v = PL.parseWhole(lotsText);
    const n = v.ok ? v.value : 0;
    setLotsText(F.int(Math.max(1, n + d)));
  };
  const stepPx = (d) => {
    const v = PL.parseWhole(priceText);
    const p = v.ok && v.value > 0 ? v.value : q.price;
    const base = PL.isOnTick(p) ? p : d > 0 ? PL.floorToTick(p) : PL.ceilToTick(p);
    setPriceText(F.int(Math.max(1, PL.stepPrice(base, d))));
  };

  let impact = null;
  if (amounts) {
    const after = impactWeights(snap, code, (side === 'buy' ? 1 : -1) * lots * 100, side === 'buy' ? -amounts.total : amounts.total, app.market, app.clock);
    const A = PL.portfolioMeasures(after.weights, snap.M) || { beta: 0, sd: 0, E: 0, alpha: -after.cashWeight * snap.M.rf, required: snap.M.rf };
    const B = beforeMeasures(snap);
    const sectorBefore = (snap.sectors.find((s) => s.name === stock.sector) || { weight: 0 }).weight;
    impact = { A, B, after, sectorBefore };
  }

  const submit = () => {
    if (!ok) {
      setShowAll(true);
      return;
    }
    const { portfolio, order } = PL.placeOrder(app.portfolio, { code, side, type, lots, limit: type === 'limit' ? price : null, reason }, app.market, app.clock);
    app.dispatch({ type: 'setPortfolio', portfolio });
    delete app.drafts[draftKey];
    setResult(order);
  };

  if (result) return html`<${TicketDone} order=${result} onClose=${onClose} docked=${docked} />`;

  const sideLabel = side === 'buy' ? 'Beli' : 'Jual';
  const issueFor = (field) => issues.filter((i) => i.field === field).map((i, k) => html`<${Issue} key=${field + k} issue=${i} onFix=${apply} />`);
  return html`<div className="ticket">
    ${docked ? null : html`<${TaskBanner} />`}
    ${docked
      ? html`<div className="row between"><span className="with-logo"><${Logo} code=${code} size="sm" /><h2 style=${{ fontSize: 17 }}>Tiket order ${code}</h2></span><span className="xs muted">${quoteTime(app, q)}</span></div>`
      : html`<div className="ticket-quote"><${Logo} code=${code} size="sm" /><span className="num" style=${{ fontSize: 22, fontWeight: 600 }}>${F.rp(q.price)}</span><${Delta} value=${q.price / q.prevClose - 1} /><span className="xs muted">${quoteTime(app, q)}</span></div>`}
    <${Seg} block className="buy-sell" label="Beli atau jual" value=${side} onChange=${setSide} options=${[{ value: 'buy', label: 'Beli', className: 'is-buy' }, { value: 'sell', label: 'Jual', className: 'is-sell' }]} />
    <div className="ticket-section">
      <div className="ticket-label">Jenis order<${Q} id="order-tipe" ctx=${ctx} label="jenis order" /></div>
      <${Seg} block label="Jenis order" value=${type} onChange=${setType} options=${[{ value: 'market', label: 'Pasar' }, { value: 'limit', label: 'Limit' }]} />
      ${type === 'market'
        ? html`<p className="xs muted">${trading ? 'Terisi sekarang di harga tertunda terakhir, ' + F.rp(q.price) + '.' : 'Bursa sedang tutup. Order menunggu ' + nextSession(app).label + ', lalu terisi di harga tertunda pertama sesi itu, sekitar pukul ' + nextSession(app).firstPrice + '.'}</p>`
        : null}
    </div>
    ${type === 'limit'
      ? html`<div className="ticket-section">
          <div className="row between"><label htmlFor="ticket-price" className="ticket-label">Harga limit<${Q} id="fraksi" ctx=${ctx} label="fraksi harga" /></label><span className="xs muted">fraksi ${F.rp(PL.tickSize(price || q.price))}</span></div>
          <div className=${'stepper' + (issues.some((i) => i.field === 'price') ? ' invalid' : '')}>
            <button type="button" aria-label="Turunkan harga satu fraksi" onClick=${() => stepPx(-1)}><${Icon} name="minus" /></button>
            <input id="ticket-price" inputMode="numeric" autoComplete="off" value=${priceText} onInput=${(e) => setPriceText(e.target.value)} aria-describedby="band-labels" />
            <button type="button" aria-label="Naikkan harga satu fraksi" onClick=${() => stepPx(1)}><${Icon} name="plus" /></button>
          </div>
          <${BandBar} band=${band} reference=${ref} price=${price} ctx=${ctx} />
          ${issueFor('price')}
        </div>`
      : null}
    <div className="ticket-section">
      <div className="row between">
        <label htmlFor="ticket-lots" className="ticket-label">Jumlah lot<${Q} id="lot" ctx=${ctx} label="lot" /></label>
        <span className="xs muted">${side === 'buy' ? 'kas tersedia ' + F.rp(snap.available) : 'dimiliki ' + F.int(Math.floor(heldShares / 100)) + ' lot' + (reservedShares ? ', ' + F.int(reservedShares / 100) + ' lot di order lain' : '')}</span>
      </div>
      <div className=${'stepper' + (issues.some((i) => i.field === 'lots') ? ' invalid' : '')}>
        <button type="button" aria-label="Kurangi 1 lot" onClick=${() => stepLots(-1)}><${Icon} name="minus" /></button>
        <input id="ticket-lots" ref=${lotsInput} inputMode="numeric" autoComplete="off" value=${lotsText} onInput=${(e) => setLotsText(e.target.value)} aria-describedby="lots-hint" />
        <button type="button" aria-label="Tambah 1 lot" onClick=${() => stepLots(1)}><${Icon} name="plus" /></button>
      </div>
      <div className="row between wrap" style=${{ gap: 8 }}>
        <div className="chips" role="group" aria-label="Isi cepat">
          ${[[0.25, '25%'], [0.5, '50%'], [1, 'Maks']].map(([s, l]) => html`<button type="button" key=${l} className="chip" onClick=${() => quick(s)}>${l}</button>`)}
        </div>
        <span id="lots-hint" className="xs muted num">${lots != null ? F.int(lots * 100) + ' lembar' : ''}</span>
      </div>
      ${issueFor('lots')}
    </div>
    ${amounts
      ? html`<div className="ticket-section">
          <div className="ticket-label">Rincian biaya<${Q} id="biaya" ctx=${ctx} label="biaya dan pajak" /></div>
          <div className="breakdown">
            <div className="b-row"><span className="k">Nilai ${F.int(lots)} lot × ${F.rp(price)}</span><span className="v">${F.rp(amounts.value)}</span></div>
            <div className="b-row"><span className="k">Biaya broker ${F.pct(PL.FEES.buy)}</span><span className="v">${(side === 'buy' ? '+' : '−') + F.rp(amounts.fee)}</span></div>
            ${side === 'sell' ? html`<div className="b-row"><span className="k">PPh final ${F.pct(PL.FEES.tax, 1)}</span><span className="v">−${F.rp(amounts.tax)}</span></div>` : null}
            <div className="b-row total"><span className="k">${side === 'buy' ? 'Total dibayar' : 'Total diterima'}</span><span className="v">${F.rp(amounts.total)}</span></div>
            <div className="b-row"><span className="k">Kas tersedia setelahnya</span><span className=${'v' + (side === 'buy' && snap.available - amounts.total < 0 ? ' down' : '')}>${F.rp(side === 'buy' ? snap.available - amounts.total : snap.available + amounts.total)}</span></div>
          </div>
        </div>`
      : null}
    ${impact && (side === 'buy' || heldShares > 0)
      ? html`<div className="ticket-section">
          <div className="ticket-label">Dampak ke portofolio<${Q} id="diversifikasi" ctx=${ctx} /></div>
          <${ImpactRows} rows=${[
            { label: 'Beta', q: 'beta', qctx: ctx, from: impact.B.beta, to: impact.A.beta, format: (v) => F.num(v) },
            { label: 'Imbal hasil harapan/bln', from: impact.B.E, to: impact.A.E, format: (v) => F.pct(v) },
            { label: 'Risiko/bln', q: 'risiko', qctx: ctx, from: impact.B.sd, to: impact.A.sd, format: (v) => F.pct(v) },
            { label: 'Bobot ' + code, from: pos ? pos.weight : 0, to: impact.after.weights[code] || 0, format: (v) => F.pct(v, 1) },
            { label: 'Bobot ' + sectorShort(stock.sector), from: impact.sectorBefore, to: impact.after.sectors[stock.sector] || 0, format: (v) => F.pct(v, 1) },
          ]} />
          <${ImpactMap} M=${snap.M} before=${impact.B} after=${impact.A} code=${code} />
        </div>`
      : null}
    <div className="field">
      <label htmlFor="ticket-reason">Alasan (opsional)</label>
      <textarea id="ticket-reason" className="input" placeholder=${side === 'buy' ? 'Mengapa Anda membeli ' + code + '?' : 'Mengapa Anda menjual ' + code + '?'} value=${reason} onInput=${(e) => setReason(e.target.value)} maxLength="500"></textarea>
      <span className="xs muted">Tersimpan di jurnal transaksi, dan dosen Anda dapat membacanya.</span>
    </div>
    ${issues.filter((i) => i.field === 'general').map((i, k) => html`<${Issue} key=${'g' + k} issue=${i} onFix=${apply} />`)}
    <div className="ticket-confirm">
      <button type="button" className=${'btn lg block ' + (side === 'buy' ? 'buy' : 'sell')} onClick=${submit}>
        ${(trading ? sideLabel : 'Pasang order ' + sideLabel.toLowerCase()) + (lots != null ? ' ' + F.int(lots) + ' lot' : '') + (amounts ? ' · ' + F.rp(amounts.total) : '')}
      </button>
      ${!ok && showAll ? html`<p className="xs down" role="alert" style=${{ marginTop: 6 }}>Perbaiki ${check.issues.length > 1 ? check.issues.length + ' hal' : 'satu hal'} di atas sebelum mengirim order.</p>` : null}
    </div>
  </div>`;
}

function Issue({ issue, onFix }) {
  return html`<div className="issue" role="alert">
    <div className="issue-head"><${Icon} name="alert" /><p>${issue.text}</p></div>
    ${issue.fixes.length ? html`<div className="fixes">${issue.fixes.map((f) => html`<button type="button" key=${f.label} className="btn" onClick=${() => onFix(f.set)}>${f.label}</button>`)}</div>` : null}
  </div>`;
}

function BandBar({ band, reference, price, ctx }) {
  const lo = band.arb;
  const hi = band.ara;
  const pad = (hi - lo) * 0.06;
  const a = lo - pad;
  const b = hi + pad;
  const pos = (v) => Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100));
  const out = price != null && (price > hi || price < lo);
  return html`<div>
    <div className="band" aria-hidden="true">
      <div className="band-track" style=${{ left: pos(lo) + '%', right: 100 - pos(hi) + '%' }}></div>
      <div className="band-ref" style=${{ left: pos(reference) + '%' }}></div>
      ${price != null ? html`<div className=${'band-price' + (out ? ' out' : '')} style=${{ left: pos(price) + '%' }}></div>` : null}
    </div>
    <div className="band-labels" id="band-labels">
      <span>ARB <b>${F.int(lo)}</b></span>
      <span className="row" style=${{ gap: 2 }}>acuan <b>${F.int(reference)}</b><${Q} id="ara-arb" ctx=${ctx} label="ARA dan ARB" /></span>
      <span>ARA <b>${F.int(hi)}</b></span>
    </div>
  </div>`;
}

function TicketDone({ order, onClose, docked }) {
  const app = useApp();
  const snap = app.snap;
  const filled = order.status === 'filled';
  const sideWord = order.side === 'buy' ? 'Beli' : 'Jual';
  const amounts = filled ? PL.orderAmounts(order.side, order.fill.price, order.lots) : PL.orderAmounts(order.side, order.limit || PL.quote(app.market.byCode[order.code], app.market, app.clock).price, order.lots);
  let waitText = null;
  if (!filled) {
    if (order.tradeDay === app.clock.day && PL.isTrading(app.phase)) {
      waitText =
        'Order ini terisi jika harga tertunda ' + (order.side === 'buy' ? 'turun ke ' + F.rp(order.limit) + ' atau lebih rendah' : 'naik ke ' + F.rp(order.limit) + ' atau lebih tinggi') + ' sebelum Sesi II ditutup pukul ' + sessionEndText(app, app.clock.day) + '. Jika tidak, order kedaluwarsa.';
    } else {
      waitText =
        'Portolab memeriksa order ini di harga tertunda pertama ' + nextSession(app).label + ', sekitar pukul ' + nextSession(app).firstPrice + '.' + (order.type === 'market' && order.side === 'buy' ? ' Jika harga saat itu naik sampai kas tidak cukup, order ditolak.' : '') + (order.type === 'limit' ? ' Jika harga limit belum tercapai saat Sesi II ditutup hari itu, order kedaluwarsa.' : '');
    }
  }
  return html`<div className="stack" style=${{ alignItems: 'flex-start', gap: 14 }} role="status">
    <span className=${'success-mark ' + (order.side === 'buy' ? 'buy' : 'sell')}><${Icon} name=${filled ? 'check' : 'hourglass'} /></span>
    <div className="stack-sm" style=${{ gap: 4 }}>
      <div className="row" style=${{ gap: 8 }}><span className=${'side-tag ' + (order.side === 'buy' ? 'buy' : 'sell')}>${sideWord}</span><${Logo} code=${order.code} size="sm" /><h2 style=${{ fontSize: 20 }}>${filled ? 'Order terisi' : 'Order menunggu'}</h2></div>
      <p className="ink2">${sideWord} ${F.int(order.lots)} lot ${order.code} ${filled ? 'di ' + F.rp(order.fill.price) + ', ' + F.time(app.market, order.fill.day, order.fill.minute) + '.' : order.type === 'limit' ? 'dengan limit ' + F.rp(order.limit) + '.' : 'di harga pasar.'}</p>
    </div>
    <div className="breakdown" style=${{ width: '100%' }}>
      <div className="b-row"><span className="k">${order.side === 'buy' ? (filled ? 'Total dibayar' : 'Kas disisihkan') : filled ? 'Total diterima' : 'Perkiraan diterima'}</span><span className="v">${F.rp(amounts.total)}</span></div>
      <div className="b-row"><span className="k">Kas sekarang</span><span className="v">${F.rp(snap.cash)}</span></div>
      ${snap.reservedCash > 0 ? html`<div className="b-row"><span className="k">Kas tersedia</span><span className="v">${F.rp(snap.available)}</span></div>` : null}
    </div>
    ${waitText ? html`<div className="note"><${Icon} name="clock" /><p>${waitText}</p></div>` : null}
    ${order.reason ? html`<div className="note"><${Icon} name="book" /><p>Alasan Anda tersimpan di jurnal: “${order.reason}”</p></div>` : null}
    <div className="row wrap" style=${{ width: '100%', gap: 8 }}>
      <a className="btn primary" href=${app.activityHref}>Lihat di Aktivitas</a>
      <button type="button" className="btn" onClick=${() => (docked ? app.nav('#/saham/' + order.code + '?t=' + Date.now(), true) : onClose())}>${docked ? 'Order baru' : 'Selesai'}</button>
    </div>
  </div>`;
}

/* ---------- Aktivitas ---------- */
function orderDetail(app, o, portfolio, who) {
  const m = app.market;
  if (o.status === 'filled') return 'Terisi di ' + F.rp(o.fill.price) + ', ' + F.dateTime(m, o.fill.day, o.fill.minute) + '.';
  if (o.status === 'cancelled') return 'Dibatalkan ' + F.dateTime(m, o.closed.day, o.closed.minute) + '.';
  if (o.status === 'expired') {
    const s = m.byCode[o.code];
    if (o.type === 'limit') {
      return o.side === 'buy'
        ? 'Kedaluwarsa ' + F.dateTime(m, o.closed.day, o.closed.minute) + '. Harga terendah hari itu ' + F.rp(s.low[o.closed.day]) + ', masih di atas limit ' + F.rp(o.limit) + '.'
        : 'Kedaluwarsa ' + F.dateTime(m, o.closed.day, o.closed.minute) + '. Harga tertinggi hari itu ' + F.rp(s.high[o.closed.day]) + ', masih di bawah limit ' + F.rp(o.limit) + '.';
    }
    return 'Kedaluwarsa ' + F.dateTime(m, o.closed.day, o.closed.minute) + '.';
  }
  if (o.status === 'rejected') {
    const r = o.rejection;
    const now = PL.quote(m.byCode[o.code], m, app.clock).price;
    const snap = PL.snapshot(portfolio, m, app.clock);
    const can = PL.maxBuyLots(snap.available, now);
    return (
      'Ditolak ' + F.dateTime(m, o.closed.day, o.closed.minute) + '. Harga naik dari ' + F.rp(r.placedPrice) + ' ke ' + F.rp(r.price) + ', jadi ' + F.int(o.lots) + ' lot butuh ' + F.rp(r.need) + ' termasuk biaya, sedangkan kas yang tersedia ' + F.rp(r.available) + '. ' +
      (can > 0 ? 'Di harga terakhir ' + F.rp(now) + ', kas ' + (who || 'Anda') + ' cukup untuk ' + F.int(can) + ' lot.' : 'Kas ' + (who || 'Anda') + ' sekarang belum cukup untuk 1 lot di harga terakhir ' + F.rp(now) + '.')
    );
  }
  if (o.tradeDay > app.clock.day) return 'Menunggu Sesi I hari ' + F.dateLong(m, o.tradeDay) + '. Portolab memeriksanya di harga tertunda pertama, sekitar pukul ' + F.time(m, o.tradeDay, PL.sessionsOf(m.cal[o.tradeDay])[0][0] + PL.DELAY_MINUTES) + '.';
  return 'Berlaku sampai Sesi II ditutup, ' + sessionEndText(app, o.tradeDay) + ' hari ini.';
}

function OrderRow({ o, portfolio, readOnly, who }) {
  const app = useApp();
  const [confirm, setConfirm] = useState(false);
  const typeText = o.type === 'limit' ? 'Limit ' + F.rp(o.limit) : 'Harga pasar';
  return html`<div className="list-row" style=${{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, padding: '12px 2px' }}>
    <div className="row" style=${{ gap: 10 }}>
      <span className=${'side-tag ' + (o.side === 'buy' ? 'buy' : 'sell')}>${o.side === 'buy' ? 'Beli' : 'Jual'}</span>
      <${Logo} code=${o.code} />
      <a href=${'#/saham/' + o.code} className="ticker grow target col" style=${{ color: 'inherit' }}><b>${o.code} <span className="num" style=${{ fontFamily: 'var(--f-ui)', fontWeight: 400, color: 'var(--ink2)', fontSize: 13.5 }}>${F.int(o.lots)} lot</span></b><span style=${{ whiteSpace: 'normal' }}>${typeText} · dipasang ${F.dateTime(app.market, o.placed.day, o.placed.minute)}</span></a>
      <${StatusChip} status=${o.status} />
    </div>
    <p className="small ink2">${orderDetail(app, o, portfolio, who)}</p>
    ${o.reason ? html`<p className="small muted">“${o.reason}”</p>` : null}
    ${o.status === 'rejected' && !readOnly ? html`<div className="row"><a className="btn" href=${'#/saham/' + o.code + '/beli'}>Buka tiket ${o.code}</a></div>` : null}
    ${o.status === 'open' && !readOnly
      ? confirm
        ? html`<div className="note" style=${{ alignItems: 'center', flexWrap: 'wrap' }}><span className="grow">Batalkan order ${o.side === 'buy' ? 'beli' : 'jual'} ${F.int(o.lots)} lot ${o.code}?${o.side === 'buy' ? ' Kas yang disisihkan kembali.' : ''}</span>
            <button type="button" className="btn dark" onClick=${() => { app.dispatch({ type: 'setPortfolio', portfolio: PL.cancelOrder(app.portfolio, o.id, app.clock) }); app.toast('Order ' + o.code + ' dibatalkan.'); }}>Ya, batalkan</button>
            <button type="button" className="btn" onClick=${() => setConfirm(false)}>Tidak</button></div>`
        : html`<div className="row"><button type="button" className="btn" onClick=${() => setConfirm(true)}>Batalkan order</button></div>`
      : null}
  </div>`;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Menunggu' },
  { value: 'filled', label: 'Terisi' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'expired', label: 'Kedaluwarsa' },
  { value: 'cancelled', label: 'Dibatalkan' },
];
function OrdersList({ portfolio, readOnly, who }) {
  const [filter, setFilter] = useState('all');
  const orders = portfolio.orders.slice().sort((a, b) => b.placed.day - a.placed.day || b.placed.minute - a.placed.minute);
  const shown = orders.filter((o) => filter === 'all' || o.status === filter);
  const count = (v) => (v === 'all' ? orders.length : orders.filter((o) => o.status === v).length);
  const useDesktop = useApp().desktop;
  return html`<section aria-labelledby="orders-h" className="stack" style=${{ gap: 10 }}>
    <h2 id="orders-h" className="sr-only">Order</h2>
    <div className=${'chips' + (useDesktop ? '' : ' scroll')} role="group" aria-label="Saring menurut status">
      ${STATUS_FILTERS.map((f) => html`<button type="button" key=${f.value} className="chip" aria-pressed=${filter === f.value ? 'true' : 'false'} onClick=${() => setFilter(f.value)}>${f.label} · <span className="count">${count(f.value)}</span></button>`)}
    </div>
    <div className="a-panel" style=${{ padding: '0 16px' }}>
      ${shown.length ? html`<div className="list">${shown.map((o) => html`<${OrderRow} key=${o.id} o=${o} portfolio=${portfolio} readOnly=${readOnly} who=${who} />`)}</div>` : html`<div className="empty">${orders.length ? 'Tidak ada order dengan status ini.' : 'Belum ada order. Order pertama muncul di sini setelah Anda membeli saham.'}</div>`}
    </div>
  </section>`;
}

function JournalList({ portfolio, who }) {
  const app = useApp();
  const L = PL.ledger(portfolio);
  const fills = portfolio.orders.filter((o) => o.status === 'filled').sort((a, b) => b.fill.day - a.fill.day || b.fill.minute - a.fill.minute);
  let maxSince = 0.01;
  for (const o of fills) maxSince = Math.max(maxSince, Math.abs(PL.quote(app.market.byCode[o.code], app.market, app.clock).price / o.fill.price - 1));
  return html`<section aria-labelledby="journal-h" className="stack" style=${{ gap: 10 }}>
    <h2 id="journal-h" className="section-title" style=${{ marginTop: 0, minHeight: 44 }}>Jurnal transaksi<span className="xs muted" style=${{ fontWeight: 400 }}>${fills.length} transaksi</span></h2>
    <div className="a-panel journal">
    ${fills.length
      ? fills.map((o) => {
          const now = PL.quote(app.market.byCode[o.code], app.market, app.clock).price;
          const since = now / o.fill.price - 1;
          const realized = L.realized[o.id];
          return html`<article className="journal-row stack-sm" key=${o.id} style=${{ gap: 10 }}>
            <div className="row between wrap" style=${{ gap: 8 }}>
              <div className="row" style=${{ gap: 10 }}>
                <span className=${'side-tag ' + (o.side === 'buy' ? 'buy' : 'sell')}>${o.side === 'buy' ? 'Beli' : 'Jual'}</span>
                <${Logo} code=${o.code} size="sm" />
                <a href=${'#/saham/' + o.code} className="target code" style=${{ color: 'inherit', minWidth: 44, fontSize: 15 }}>${o.code}</a>
                <span className="small ink2 num">${F.int(o.lots)} lot · ${F.rp(o.fill.price)}</span>
              </div>
              <span className="xs muted">${F.dateTime(app.market, o.fill.day, o.fill.minute)}</span>
            </div>
            ${o.reason ? html`<blockquote style=${{ margin: 0, paddingLeft: 12, borderLeft: '3px solid var(--line2)', color: 'var(--ink)' }}>${o.reason}</blockquote>` : html`<p className="small muted">Tanpa alasan.</p>`}
            <div className="row wrap" style=${{ gap: 16 }}>
              ${o.side === 'buy'
                ? html`<span className="small ink2 journal-since"><span>Sejak dibeli</span><${Delta} value=${since} /> <span className="muted num">(${F.rp(now)})</span><${Dv} value=${since} min=${-maxSince} max=${maxSince} /></span>`
                : html`<span className="small ink2">Laba terealisasi <${Delta} value=${realized ? realized.pl : 0} kind="rp" /></span><span className="small ink2">Harga sejak dijual <${Delta} value=${since} /></span>`}
            </div>
          </article>`;
        })
      : html`<div className="empty">${who ? 'Mahasiswa ini belum punya transaksi.' : 'Transaksi yang terisi muncul di sini bersama alasannya.'}</div>`}
    </div>
  </section>`;
}

function ActivityView({ sub, base, noTitle }) {
  const app = useApp();
  const portfolio = app.portfolio;
  const tab = sub === 'jurnal' ? 'journal' : 'orders';
  const home = base || '#/aktivitas';
  const tools = noTitle ? null : html`<div className="a-tools"><h1>Aktivitas</h1></div>`;
  if (app.desktop) {
    return html`<div className="stack">${tools}<div className="grid g-12 even">
      <div className="span-7"><${OrdersList} portfolio=${portfolio} /></div>
      <div className="span-5"><${JournalList} portfolio=${portfolio} /></div>
    </div></div>`;
  }
  return html`<div className="stack">
    ${tools}
    <${Seg} block label="Tampilan aktivitas" value=${tab} onChange=${(v) => app.nav(v === 'journal' ? home + '/jurnal' : home, true)} options=${[{ value: 'orders', label: 'Order' }, { value: 'journal', label: 'Jurnal' }]} />
    ${tab === 'orders' ? html`<${OrdersList} portfolio=${portfolio} />` : html`<${JournalList} portfolio=${portfolio} />`}
  </div>`;
}

/* ---------- Analisis ---------- */
/* The map of Analisis: on beta, the security market line runs from the risk-free rate through the IHSG, and each alpha is a stem to the line. On standard deviation, the portfolio sits left of the weighted average risk of its stocks, which is diversification. */
function analysisMapProps(app, snap, who) {
  const M = snap.M;
  const P = snap.P;
  const poss = who || 'Anda';
  const sd = app.mapAxis === 'sd';
  const axis = axisOf(app.mapAxis, M);
  const e = (v) => F.pct(v) + ' per bulan';
  const points = [];
  for (const p of snap.positions) {
    const m = M.stock[p.code];
    points.push({
      x: sd ? m.sd : m.beta,
      y: m.E,
      kind: 'stock',
      keep: true,
      r: Math.max(4.5, 2.1 * Math.sqrt(p.weight * 100)),
      stem: sd ? null : m.required,
      label: { text: p.code },
      tip: sd ? [p.code, 'Imbal hasil harapan ' + e(m.E), 'Risiko ' + F.pct(m.sd) + ' · bobot ' + F.pct(p.weight, 1)] : [p.code, 'Imbal hasil harapan ' + e(m.E), 'Diminta CAPM ' + F.pct(m.required) + ' · alpha ' + F.pctSigned(m.alpha)],
      pick: p.code,
    });
  }
  if (sd) points.push({ x: P.avgRisk, y: P.E, kind: 'now', label: { text: 'Tanpa diversifikasi', short: 'Rata-rata' }, tip: ['Rata-rata tertimbang risiko saham', 'Risiko ' + F.pct(P.avgRisk) + ' per bulan', 'Imbal hasil harapan ' + e(P.E)], pick: 'diversifikasi' });
  points.push({ x: sd ? P.sd : P.beta, y: P.E, kind: 'you', stem: sd ? null : P.required, label: { text: 'Portofolio ' + poss, short: who || 'Anda' }, tip: sd ? ['Portofolio ' + poss, 'Risiko ' + F.pct(P.sd) + ' per bulan', 'Imbal hasil harapan ' + e(P.E)] : ['Portofolio ' + poss, 'Imbal hasil harapan ' + e(P.E), 'Diminta CAPM ' + F.pct(P.required) + ' · alpha ' + F.pctSigned(P.alpha)], pick: 'portfolio' });
  points.push({ x: axis.ihsg, y: M.Em, kind: 'ihsg', label: { text: 'IHSG' }, tip: ['IHSG', 'Imbal hasil harapan ' + e(M.Em), axis.valueText(axis.ihsg)] });
  const xs = points.map((p) => p.x).concat(sd ? [] : [0]);
  const step = sd ? 0.01 : 0.2;
  const xd = niceDomain(xs, step);
  const ys = points.map((p) => p.y).concat(points.filter((p) => p.stem != null).map((p) => p.stem)).concat([0, M.rf]);
  const sml = sd ? null : { from: [0, M.rf], to: [xd[1], M.rf + xd[1] * (M.Em - M.rf)], label: 'SML' };
  if (sml) ys.push(sml.to[1]);
  return {
    points,
    x: { domain: xd, step, format: axis.format, ref: axis.ref, refLabel: axis.refLabel },
    y: { domain: niceDomain(ys, 0.005), step: 0.005, format: (v) => F.pct(v, 1) },
    sml,
    arrows: sd ? [{ from: [P.avgRisk, P.E], to: [P.sd, P.E] }] : null,
    xTitle: sd ? 'Risiko per bulan (simpangan baku)' : 'Beta (1,0 = pasar)',
    aria: sd ? 'Risiko dan imbal hasil harapan saham ' + poss + ' dan portofolio. Risiko portofolio ' + F.pct(P.sd) + ', rata-rata tertimbang risiko saham ' + F.pct(P.avgRisk) : 'Garis pasar sekuritas. Portofolio beta ' + F.num(P.beta) + ', imbal hasil harapan ' + F.pct(P.E) + ', alpha ' + F.pctSigned(P.alpha),
  };
}

function AnalysisView({ portfolio, snap, who, noTitle }) {
  const app = useApp();
  const [by, setBy] = useState('sector');
  const M = snap.M;
  const P = snap.P;
  const poss = who || 'Anda';
  const ctx = conceptCtx(app, portfolio, snap, { who });
  const history = useMemo(() => PL.history(portfolio, app.market, app.clock), [portfolio, app.clock]);
  const header = html`<div className="stack-sm" style=${{ gap: 4 }}>
    ${who || noTitle ? null : html`<div className="a-tools"><h1>Analisis</h1></div>`}
    <p className="small muted">${M.n} imbal hasil bulanan, ${F.month(app.market, M.months[0])} sampai ${F.month(app.market, M.months[M.months.length - 1])}. Semua ukuran per bulan. R<sub>f</sub> ${F.pct(M.rf, 3)} per bulan dari BI-Rate ${F.pct(PL.BI_RATE)}<${Q} id="rf" ctx=${ctx} label="tingkat bebas risiko" /></p>
  </div>`;
  if (!P) {
    return html`<div className="stack">${header}<div className="a-panel empty"><${Icon} name="pie" /><p>Analisis membutuhkan setidaknya satu saham di portofolio. ${who ? '' : 'Setelah order beli pertama terisi, halaman ini menghitung beta, risiko, dan posisi Anda terhadap garis pasar sekuritas.'}</p>${who ? null : html`<a className="btn primary" href="#/pasar">Buka Pasar</a>`}</div></div>`;
  }
  const sdMode = app.mapAxis === 'sd';
  const m = analysisMapProps(app, snap, who);
  const pick = (p) => {
    if (p.pick === 'diversifikasi') app.openConcept('diversifikasi', Object.assign({ openCalc: true }, ctx));
    else if (p.pick === 'portfolio') app.openConcept(sdMode ? 'risiko' : 'alpha', Object.assign({ openCalc: true }, ctx));
    else app.openConcept(sdMode ? 'risiko' : 'alpha', Object.assign({ openCalc: true }, ctx, { code: p.pick }));
  };
  const caption = sdMode
    ? html`Diversifikasi menurunkan risiko dari <b className="num">${F.pct(P.avgRisk)}</b> ke <b className="num">${F.pct(P.sd)}</b> dengan imbal hasil harapan yang sama.`
    : html`Portofolio ${poss} ${F.pctSigned(P.alpha) === F.pctSigned(0) ? 'tepat di' : P.alpha > 0 ? 'di atas' : 'di bawah'} garis${F.pctSigned(P.alpha) === F.pctSigned(0) ? '' : html` sejauh <b className="num">${F.num(Math.abs(P.alpha) * 100, 2)}</b> poin per bulan`}. Pilih titik untuk melihat perhitungan alphanya.`;
  const mapPanel = html`<section className=${'a-panel' + (app.wide ? ' fill' : '')} id="sml" aria-labelledby="sml-h">
    <div className="a-ph"><h2 id="sml-h">${sdMode ? 'Risiko total dan imbal hasil' : 'Garis pasar sekuritas'}<${Q} id=${sdMode ? 'diversifikasi' : 'sml'} ctx=${ctx} /></h2><span className="grow"></span><${AxisSeg} /></div>
    <div className="a-ph2"><div className="a-legend">
      <span><i className="lg-you"></i>Portofolio ${poss}</span><span><i className="lg-on"></i>Saham ${poss}, ukuran = bobot</span>${sdMode ? html`<span><i className="lg-now"></i>Tanpa diversifikasi</span>` : html`<span><i className="lg-line"></i>SML</span><span><i className="lg-gain"></i>alpha positif</span><span><i className="lg-loss"></i>alpha negatif</span>`}<span><i className="lg-ihsg"></i>IHSG</span>
    </div><span className="grow"></span><span>Tegak: imbal hasil harapan per bulan.</span></div>
    <div className=${'a-map' + (app.wide ? ' fill' : '')}><${RiskMap} fill=${app.wide} points=${m.points} x=${m.x} y=${m.y} sml=${m.sml} arrows=${m.arrows} ihsgLine=${{ y: M.Em, label: 'IHSG ' + F.pct(M.Em) }} xTitle=${m.xTitle} ratio=${0.56} minH=${320} maxH=${520} aria=${m.aria} onPick=${pick} /></div>
    <div className="a-insight"><em>${sdMode ? 'Sesi 2 · Diversifikasi' : 'Sesi 9 · CAPM'}</em><span>${caption}</span><button type="button" className="lk" onClick=${() => app.openLesson(sdMode ? '2' : '9')}>Pelajari<${Icon} name="arrowRight" /></button></div>
  </section>`;

  const mk = { sharpe: (M.Em - M.rf) / M.sdM, treynor: M.Em - M.rf };
  const scale = (v, ref) => {
    const lo = Math.min(0, v, ref);
    const hi = Math.max(v, ref, 0);
    const pad = (hi - lo) * 0.25 || 0.01;
    return [lo < 0 ? lo - pad : 0, hi + pad];
  };
  const measures = [
    { id: 'imbal-harapan', label: 'Imbal hasil harapan', value: F.pct(P.E), v: P.E, ref: M.Em, note: 'IHSG ' + F.pct(M.Em) + '.' },
    { id: 'risiko', label: 'Simpangan baku', value: F.pct(P.sd), v: P.sd, ref: M.sdM, note: 'IHSG ' + F.pct(M.sdM) + '.' },
    { id: 'beta', label: 'Beta', value: F.num(P.beta), v: P.beta, ref: 1, note: 'IHSG ' + F.num(1) + '.' },
    { id: 'sharpe', label: 'Rasio Sharpe', value: F.num(P.sharpe), v: P.sharpe, ref: mk.sharpe, note: 'IHSG ' + F.num(mk.sharpe) + '.' },
    { id: 'treynor', label: 'Rasio Treynor', value: P.treynor == null ? 'belum ada' : F.pct(P.treynor), v: P.treynor == null ? 0 : P.treynor, ref: mk.treynor, note: 'IHSG ' + F.pct(mk.treynor) + '.' },
    { id: 'alpha', label: 'Alpha Jensen', value: html`<${Delta} value=${P.alpha} />`, v: P.alpha, ref: 0, note: 'IHSG ' + F.pct(0) + ' menurut definisi.' },
  ];
  const measureCard = html`<section className="a-card" aria-labelledby="measures-h">
    <h3 id="measures-h">Ukuran portofolio ${who ? who : 'Anda'}</h3>
    ${measures.map((r) => {
      const [lo, hi] = scale(r.v, r.ref);
      return html`<div className="a-risk wide" key=${r.id}>
        <span>${r.label}<${Q} id=${r.id} ctx=${ctx} label=${r.label} /></span><b>${r.value}</b><${Ds} value=${r.v} min=${lo} max=${hi} refValue=${r.ref} me />
        <small>${r.note} <button type="button" className="link-btn calc-link" onClick=${() => app.openConcept(r.id, Object.assign({ openCalc: true }, ctx))}>Lihat perhitungan<${Icon} name="chevRight" /></button></small>
      </div>`;
    })}
  </section>`;

  const items =
    by === 'stock'
      ? snap.positions.map((p) => ({ key: p.code, label: p.code, code: true, value: p.value, weight: p.weight }))
      : snap.sectors.map((s) => ({ key: s.name, label: sectorShort(s.name), value: s.value, weight: s.weight }));
  const maxW = Math.max(snap.cashWeight, ...items.map((i) => i.weight));
  const alloc = html`<section className="a-card" id="alloc" aria-labelledby="alloc-h">
    <div className="card-head"><h2 id="alloc-h">Alokasi<${Q} id="bobot-sektor" ctx=${ctx} /></h2><${Seg} label="Kelompokkan alokasi" value=${by} onChange=${setBy} options=${[{ value: 'sector', label: 'Sektor' }, { value: 'stock', label: 'Saham' }]} /></div>
    <div className="segbar" role="img" aria-label=${'Alokasi: ' + items.map((i) => i.label + ' ' + F.pct(i.weight, 1)).join(', ') + ', kas ' + F.pct(snap.cashWeight, 1)}>
      ${items.map((i) => html`<i key=${i.key} style=${{ flex: i.weight }}></i>`)}<i className="cash" style=${{ flex: snap.cashWeight }}></i>
    </div>
    <div className="alloc-list" style=${{ marginTop: 8 }}>
      ${items.map((i) => html`<div className="alloc-row" key=${i.key}><span className=${i.code ? 'code' : ''}>${i.label}</span><${Br} value=${i.weight} max=${maxW} /><span className="w">${F.pct(i.weight, 1)}</span></div>`)}
      <div className="alloc-row"><span>Kas</span><span className="br" aria-hidden="true"><i style=${{ width: (snap.cashWeight / maxW) * 100 + '%', background: 'var(--line2)' }}></i></span><span className="w">${F.pct(snap.cashWeight, 1)}</span></div>
    </div>
  </section>`;

  const holdings = snap.positions.map((p) => ({ code: p.code, w: p.weight }));
  const heat = html`<section className="a-card" id="corr" aria-labelledby="corr-h">
    <div className="card-head"><h2 id="corr-h">Korelasi antarsaham<${Q} id="korelasi" ctx=${ctx} /></h2></div>
    <${Heatmap} codes=${holdings.map((h) => h.code)} M=${M} onPick=${(a, b) => app.openConcept('korelasi', Object.assign({ openCalc: true }, ctx, { code: a, code2: b }))} />
    <div className="row" style=${{ gap: 8, marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
      <span className="num">−1</span><span style=${{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--div-neg), var(--raised), var(--data))' }}></span><span className="num">+1</span>
    </div>
  </section>`;

  const contribRows = holdings.slice().sort((a, b) => P.contrib[b.code] - P.contrib[a.code]);
  const maxC = Math.max(...contribRows.map((h) => Math.max(P.contrib[h.code], h.w)));
  const contrib = html`<section className="a-card" id="contrib" aria-labelledby="contrib-h">
    <div className="card-head"><h2 id="contrib-h">Sumber risiko portofolio<${Q} id="kontribusi" ctx=${ctx} /></h2></div>
    <div className="a-legend" style=${{ marginBottom: 8 }}>
      <span><i className="lg-on" style=${{ borderRadius: 3 }}></i>Kontribusi risiko</span>
      <span><i className="lg-line" style=${{ width: 2, height: 12 }}></i>Bobot</span>
    </div>
    <div className="stack-sm" style=${{ gap: 0 }}>
      ${contribRows.map(
        (h) => html`<button type="button" key=${h.code} className="list-row" style=${{ gridTemplateColumns: '48px minmax(0, 1fr) 100px', minHeight: 44, padding: '4px', borderRadius: 8 }}
            onClick=${() => app.openConcept('kontribusi', Object.assign({ openCalc: true }, ctx, { code: h.code }))} aria-label=${h.code + ': kontribusi risiko ' + F.pct(P.contrib[h.code], 1) + ', bobot ' + F.pct(h.w, 1)}>
          <b className="code">${h.code}</b>
          <span aria-hidden="true" style=${{ position: 'relative', height: 16 }}>
            <span style=${{ position: 'absolute', left: 0, top: 4, height: 8, width: (Math.max(0, P.contrib[h.code]) / maxC) * 100 + '%', background: 'var(--data)', borderRadius: '0 4px 4px 0' }}></span>
            <span style=${{ position: 'absolute', top: 0, height: 16, width: 2, marginLeft: -1, left: (h.w / maxC) * 100 + '%', background: 'var(--ink2)', borderRadius: 1 }}></span>
          </span>
          <span className="num small nowrap" style=${{ textAlign: 'right' }}>${F.pct(P.contrib[h.code], 1)} <span className="muted">/ ${F.pct(h.w, 1)}</span></span>
        </button>`
      )}
    </div>
    <p className="small ink2" style=${{ marginTop: 6 }}>Kas ${F.pct(snap.cashWeight, 1)} tidak menyumbang risiko.</p>
  </section>`;

  const ihsgRet = history.length ? history[history.length - 1].ihsg : 0;
  const perf = html`<section className="a-panel" aria-labelledby="perf-h">
    <div className="a-ph"><h2 id="perf-h">Kinerja vs IHSG</h2><span className="grow"></span><span className="small muted">${leadHeadline(snap.totalReturn - ihsgRet)}</span></div>
    <div className="a-ph2"><div className="a-legend"><span className="key"><i></i>Portofolio ${poss} ${F.pctSigned(snap.totalReturn)}</span><span className="key ih"><i></i>IHSG ${F.pctSigned(ihsgRet)}</span></div><span className="grow"></span><span>Garis tegak: awal setiap sesi kuliah.</span></div>
    <div className="a-map"><${LineChart} history=${history} ses end who=${who} ratio=${0.32} minH=${220} maxH=${320} aria=${'Imbal hasil portofolio ' + poss + ' dan IHSG sejak ' + F.date(app.market, snap.startDay)} /></div>
  </section>`;

  return html`<div className="stack">
    ${header}
    <div className="a-main a-x">
      <div className="a-col">${mapPanel}</div>
      <div className="a-side">${measureCard}</div>
    </div>
    <div className="grid g-12 even">
      <div className=${app.desktop ? 'span-4' : ''}>${alloc}</div>
      <div className=${app.desktop ? 'span-4' : ''}>${heat}</div>
      <div className=${app.desktop ? 'span-4' : ''}>${contrib}</div>
      <div className=${app.desktop ? 'span-12' : ''}>${perf}</div>
    </div>
  </div>`;
}

function Heatmap({ codes, M, onPick }) {
  const n = codes.length;
  return html`<div className="table-wrap">
    <div role="table" aria-label="Korelasi antarsaham" style=${{ display: 'grid', gridTemplateColumns: '48px repeat(' + n + ', minmax(40px, 1fr))', gap: 2, minWidth: 48 + n * 42 }}>
      <div role="row" style=${{ display: 'contents' }}>
        <span role="columnheader"></span>
        ${codes.map((c) => html`<span role="columnheader" key=${c} className="xs code muted" style=${{ textAlign: 'center', padding: '2px 0' }}>${c}</span>`)}
      </div>
      ${codes.map(
        (a) => html`<div role="row" key=${a} style=${{ display: 'contents' }}>
          <span role="rowheader" className="xs code muted" style=${{ display: 'flex', alignItems: 'center' }}>${a}</span>
          ${codes.map((b) => {
            const r = M.cov[a][b] / (M.stock[a].sd * M.stock[b].sd);
            const diag = a === b;
            const strong = Math.abs(r) > 0.55 && !diag;
            return html`<button type="button" role="cell" key=${b} disabled=${diag} onClick=${() => onPick(a, b)} aria-label=${a + ' dan ' + b + ': korelasi ' + F.num(r)}
              style=${{ border: 0, minHeight: 44, borderRadius: 6, background: diag ? 'var(--raised)' : divergingFill(r), color: strong ? '#fff' : 'var(--ink)', font: '500 12px var(--f-num)', cursor: diag ? 'default' : 'pointer' }}>${diag ? '1' : F.num(r)}</button>`;
          })}
        </div>`
      )}
    </div>
  </div>`;
}
