/* Portolab mock: the lecturer's screens. */
function CopyButton({ text, label }) {
  const app = useApp();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      app.toast(label + ' tersalin.');
    } catch (e) {
      app.toast('Browser ini menolak menyalin otomatis. Pilih teksnya lalu salin.');
    }
  };
  return html`<button type="button" className="btn outline" onClick=${copy} aria-label=${'Salin ' + label.toLowerCase()}><${Icon} name="copy" />Salin kode</button>`;
}
function CopyField({ text, label }) {
  const app = useApp();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      app.toast(label + ' tersalin.');
    } catch (e) {
      app.toast('Browser ini menolak menyalin otomatis. Pilih teksnya lalu salin.');
    }
  };
  return html`<div className="copy-field"><code>${text}</code><button type="button" className="btn ghost" onClick=${copy} aria-label=${'Salin ' + label.toLowerCase()}><${Icon} name="copy" />Salin</button></div>`;
}

/* The map of a class: every student with stocks by beta or risk against the return since the start, with the IHSG. */
function classMapProps(app, s, opts) {
  const axis = axisOf(app.mapAxis, s.M);
  const ws = s.withStocks;
  const since = F.dateShort(app.market, s.start);
  const tipOf = (i) => [i.name, 'Imbal hasil ' + F.pctSigned(i.ret) + ' · ' + axis.valueText(axis.get(i.P)), i.active ? 'Aktif minggu ini' : 'Terakhir aktif ' + lastActivityText(app, i.last)];
  const named = new Set();
  if (ws.length) {
    named.add(extremeOf(ws, (i) => i.ret, true).id);
    named.add(extremeOf(ws, (i) => i.P.alpha, true).id);
    named.add(extremeOf(ws, (i) => i.ret, false).id);
    named.add(extremeOf(ws, (i) => i.P.sd, true).id);
  }
  const points = ws.map((i) => {
    const selected = opts.selected === i.id;
    const kind = opts.mini ? (selected ? 'sel' : 'dim') : i.active ? 'on' : 'off';
    const label = opts.mini ? (selected ? { text: i.short, short: i.short } : null) : named.has(i.id) ? { text: i.name, short: i.short, val: F.pctSigned(i.ret) } : null;
    return { x: axis.get(i.P), y: i.ret, kind, tip: tipOf(i), pick: i.id, label };
  });
  points.push({ x: axis.ihsg, y: s.ihsgRet, kind: 'ihsg', tip: ['IHSG', F.pctSigned(s.ihsgRet) + ' sejak ' + since + ' · ' + axis.valueText(axis.ihsg)], label: { text: 'IHSG' } });
  const xs = ws.map((i) => axis.get(i.P)).concat([axis.ihsg]);
  const ys = s.items.map((i) => i.ret).concat([s.ihsgRet, 0]);
  return {
    points,
    x: { domain: niceDomain(xs, axis.step), step: axis.step, format: axis.format, ref: axis.ref, refLabel: axis.refLabel },
    y: { domain: niceDomain(ys, 0.02), step: 0.02, format: yPct },
    ihsgLine: { y: s.ihsgRet, label: 'IHSG ' + F.pctSigned(s.ihsgRet) },
    aria: 'Peta ' + axis.word + ' dan imbal hasil ' + ws.length + ' mahasiswa, dengan IHSG sebagai pembanding',
    axis,
  };
}

function ClassView() {
  const app = useApp();
  const rows = useClassRows();
  const s = classStats(app, rows);
  const [allReasons, setAllReasons] = useState(false);
  const m = classMapProps(app, s, {});
  const ws = s.withStocks;
  const since = F.dateShort(app.market, s.start);
  const q = PL.quote(app.market.ihsg, app.market, app.clock);
  const flags = classFlags(app, s);
  const disc = discussionFor(app, s);
  const onMapActive = ws.filter((i) => i.active).length;
  const feed = [];
  for (const i of s.items) for (const o of i.portfolio.orders) if (o.status === 'filled' && o.reason) feed.push({ i, o });
  feed.sort((a, b) => b.o.fill.day - a.o.fill.day || b.o.fill.minute - a.o.fill.minute);
  const feedRow = ({ i, o }) => html`<a key=${o.id} className="a-feed" href=${'#/mahasiswa/' + i.id + '/jurnal'}><span className="avatar">${initials(i.name)}</span><div><b>${i.name}</b><small>${(o.side === 'buy' ? 'beli ' : 'jual ') + F.int(o.lots) + ' lot ' + o.code + ' · ' + F.dateTimeBare(app.market, o.fill.day, o.fill.minute)}</small><p>“${o.reason}”</p></div></a>`;
  return html`<div className="a-main a-k">
    <div className="a-col">
      <div className="a-head">
        <div className="only-phone" style=${{ marginBottom: 2, marginLeft: -11 }}><${JoinChip} /></div>
        <div className="eyebrow">${F.dateWeekday(app.market, app.clock.day)} · ${q.final ? 'harga penutupan ' + F.dateShort(app.market, q.day) : F.time(app.market, q.day, q.minute)}</div>
        <h1>${leadHeadline(s.med - s.ihsgRet, 'Kelas')}</h1>
        <p>${classSummary(app, s)}</p>
      </div>
      <section className=${'a-panel' + (app.wide ? ' fill' : '')} aria-labelledby="map-h">
        <div className="a-ph"><h2 id="map-h">Peta risiko dan imbal hasil</h2><span className="grow"></span><${AxisSeg} /></div>
        <div className="a-ph2">
          <div className="a-legend"><span><i className="lg-on"></i>Aktif minggu ini · ${onMapActive}</span><span><i className="lg-off"></i>Belum bertransaksi minggu ini · ${ws.length - onMapActive}</span><span><i className="lg-ihsg"></i>IHSG</span></div>
          <span className="grow"></span><span>Tegak: imbal hasil sejak ${since}. Batang di tepi: sebaran kelas.</span>
        </div>
        <div className=${'a-map' + (app.wide ? ' fill' : '')} style=${{ '--map-min': '340px' }}>
          <${RiskMap} fill=${app.wide}
            points=${m.points} x=${m.x} y=${m.y} ihsgLine=${m.ihsgLine} zeroLabel="Modal awal"
            median=${s.med != null ? { y: s.med, label: 'Median kelas ' + F.pctSigned(s.med), short: 'Median ' + F.pctSigned(s.med) } : null}
            marg=${ws.length ? { x: { vals: ws.map((i) => m.axis.get(i.P)), step: m.axis.step, tip: m.axis.binTip }, y: { vals: ws.map((i) => i.ret), step: 0.01, tip: (a, b, n) => ['Imbal hasil ' + F.pctSigned(a, 0) + ' sampai ' + F.pctSigned(b, 0), n + ' mahasiswa'] } } : null}
            quad=${QUAD} xTitle=${m.axis.title} ratio=${0.68} minH=${340} maxH=${600}
            aria=${m.aria} onPick=${(p) => app.nav('#/mahasiswa?pilih=' + p.pick)} />
        </div>
        <div className="a-strip">
          <div><b>${F.int(s.N)}</b>mahasiswa</div>
          <div><b>${F.int(s.active)}</b>aktif minggu ini (${F.pct(s.N ? s.active / s.N : 0, 0)})</div>
          <div><b>${F.int(s.ordersWeek)}</b>order minggu ini</div>
          <div><b>${s.medBeta == null ? 'belum ada' : F.num(s.medBeta)}</b>median beta kelas</div>
        </div>
      </section>
    </div>
    <div className="a-side pair">
      <section className="a-card" aria-labelledby="flags-h">
        <h3 id="flags-h">Perlu perhatian</h3>
        ${flags.length
          ? flags.map((f) => html`<a key=${f.key} className="a-flag" href=${f.href}><span className=${'st ' + f.tone}><${Icon} name=${f.icon} /></span><div><b>${f.name}</b><p>${f.text}</p></div><${Icon} name="chevRight" /></a>`)
          : html`<p className="small muted">Tidak ada mahasiswa yang rugi, tanpa saham, atau belum bertransaksi minggu ini.</p>`}
      </section>
      <section className="a-card" aria-labelledby="ask-h">
        <h3 id="ask-h">Bahan diskusi <em>${disc.badge}</em></h3>
        <ul className="a-ask">${disc.questions.map((t, k) => html`<li key=${k}>${t}</li>`)}</ul>
        <div style=${{ marginTop: 2 }}><button type="button" className="lk" onClick=${() => app.openLesson(String(disc.lesson))}>Buka materi sesi ${disc.lesson}<${Icon} name="arrowRight" /></button></div>
      </section>
      <section className="a-card" aria-labelledby="feed-h">
        <h3 id="feed-h">Alasan terbaru<span className="grow"></span>${feed.length > 2 ? html`<button type="button" className="lk tight" onClick=${() => setAllReasons(true)}>Semua<${Icon} name="chevRight" /></button>` : null}</h3>
        ${feed.length ? feed.slice(0, 2).map(feedRow) : html`<p className="small muted">Belum ada alasan tertulis di kelas ini.</p>`}
      </section>
    </div>
    ${allReasons
      ? html`<${Sheet} title="Alasan terbaru" side=${app.desktop} onClose=${() => setAllReasons(false)}>${() => html`<div>${feed.slice(0, 30).map(feedRow)}</div>`}<//>`
      : null}
  </div>`;
}

const MEASURES = {
  alpha: { label: 'Alpha Jensen', get: (P) => P.alpha, cell: (v) => html`<${Delta} value=${v} />`, q: 'alpha' },
  sharpe: { label: 'Sharpe', get: (P) => P.sharpe, cell: (v) => html`<span className="num">${F.num(v)}</span>`, q: 'sharpe' },
  treynor: { label: 'Treynor', get: (P) => P.treynor, cell: (v) => (v == null ? html`<span className="muted">belum ada</span>` : html`<span className="num">${F.pct(v)}</span>`), q: 'treynor' },
};
const STUDENT_FILTERS = [
  { value: 'semua', label: 'Semua', test: () => true },
  { value: 'di-bawah', label: 'Di bawah IHSG', test: (i, s) => i.ret <= s.ihsgRet },
  { value: 'belum-aktif', label: 'Belum aktif minggu ini', test: (i) => !i.active },
  { value: 'beta-tinggi', label: 'Beta di atas 1', test: (i) => i.P && i.P.beta > 1 },
  { value: 'tanpa-saham', label: 'Tanpa saham', test: (i) => !i.P, hidden: true },
];
function studentsHash(params) {
  const parts = [];
  if (params.saring && params.saring !== 'semua') parts.push('saring=' + params.saring);
  if (params.pilih) parts.push('pilih=' + params.pilih);
  return '#/mahasiswa' + (parts.length ? '?' + parts.join('&') : '');
}

/* The panel of one student: their point on the class map, their numbers, one sentence, their allocation, and their latest reason. */
function StudentPanel({ s, item, rank, ranked, inSheet }) {
  const app = useApp();
  const m = classMapProps(app, s, { mini: true, selected: item.id });
  const note = studentNote(s, item);
  const snap = item.snap;
  const lastReason = item.portfolio.orders.filter((o) => o.status === 'filled' && o.reason).sort((a, b) => b.fill.day - a.fill.day || b.fill.minute - a.fill.minute)[0];
  const holdings = snap.positions;
  const none = html`<b className="muted" style=${{ fontWeight: 500, fontSize: 14 }}>belum ada</b>`;
  return html`<div className="a-insp">
    <div className="a-insp-head"><span className="avatar">${initials(item.name)}</span><div>${inSheet ? null : html`<b>${item.name}</b>`}<small><span className="code">${item.st.nim}</span> · ${rank ? 'peringkat ' + rank + ' dari ' + ranked : 'belum ada peringkat'}</small></div></div>
    ${item.P
      ? html`<${RiskMap} points=${m.points} x=${m.x} y=${m.y} ihsgLine=${m.ihsgLine} compact ratio=${0.73} minH=${200} maxH=${240} aria=${'Posisi ' + item.name + ' di peta kelas'} onPick=${(p) => app.nav(studentsHash({ saring: app.route.query.saring, pilih: p.pick }), true)} />`
      : null}
    <div className="a-kv">
      <div><b><${Delta} value=${item.ret} /></b>Imbal hasil</div>
      <div>${item.P ? html`<b>${F.num(item.P.beta)}</b>` : none}Beta</div>
      <div>${item.P ? html`<b>${F.pct(item.P.sd)}</b>` : none}Risiko per bulan</div>
      <div>${item.P ? html`<b><${Delta} value=${item.P.alpha} /></b>` : none}Alpha Jensen</div>
      <div><b>${F.num(snap.total / 1e6, 1)} jt</b>Nilai (Rp)</div>
      <div><b>${F.int(item.portfolio.orders.length)}</b>Order</div>
    </div>
    <p className="a-note"><b>${note.bold}</b> ${note.rest}</p>
    ${holdings.length
      ? html`<div className="a-hold">
          <div className="segbar" role="img" aria-label=${holdings.map((p) => p.code + ' ' + F.pct(p.weight, 0)).join(', ') + ', kas ' + F.pct(snap.cashWeight, 0)}>
            ${holdings.map((p) => html`<i key=${p.code} style=${{ flex: p.weight }}></i>`)}<i className="cash" style=${{ flex: snap.cashWeight }}></i>
          </div>
          <span>${holdings.map((p, k) => html`<${Fragment} key=${p.code}>${k ? ' · ' : ''}<b>${p.code}</b> ${F.pct(p.weight, 0)}<//>`)} · Kas ${F.pct(snap.cashWeight, 0)}</span>
        </div>`
      : null}
    <div className="a-feed" style=${{ padding: 0 }}><span className="avatar">${initials(item.name)}</span><div><b>Alasan terakhir</b>${lastReason ? html`<small>${(lastReason.side === 'buy' ? 'beli ' : 'jual ') + F.int(lastReason.lots) + ' lot ' + lastReason.code + ' · ' + F.dateShort(app.market, lastReason.fill.day)}</small><p>“${lastReason.reason}”</p>` : html`<p>Belum ada alasan tertulis.</p>`}</div></div>
    <div className="a-acts"><a className="btn primary" href=${'#/mahasiswa/' + item.id}>Buka portofolio</a><a className="btn" href=${'#/mahasiswa/' + item.id + '/jurnal'}>Jurnal alasan</a></div>
  </div>`;
}

function StudentsView() {
  const app = useApp();
  const rows = useClassRows();
  const s = classStats(app, rows);
  const [measure, setMeasure] = useState('alpha');
  const [query, setQuery] = useState('');
  const ms = MEASURES[measure];
  const filter = STUDENT_FILTERS.find((f) => f.value === app.route.query.saring) || STUDENT_FILTERS[0];
  const ranked = s.withStocks.slice().sort((a, b) => {
    const va = ms.get(a.P);
    const vb = ms.get(b.P);
    return va == null ? 1 : vb == null ? -1 : vb - va;
  });
  const rankOf = {};
  ranked.forEach((i, k) => {
    if (ms.get(i.P) != null) rankOf[i.id] = k + 1;
  });
  const ordered = ranked.concat(s.items.filter((i) => !i.P));
  const t = query.trim().toLowerCase();
  const shown = ordered.filter((i) => filter.test(i, s) && (!t || i.name.toLowerCase().includes(t) || i.st.nim.includes(t)));
  /* The table of the class needs about 860 pixels, so the panel docks beside it only where both fit. */
  const docked = app.xwide;
  const pilih = app.route.query.pilih;
  const selected = (pilih && s.byId[pilih]) || (docked ? shown[0] || ordered[0] : null);
  const select = (id) => app.nav(studentsHash({ saring: filter.value, pilih: id }), docked);
  const setFilter = (v) => app.nav(studentsHash({ saring: v, pilih: docked && selected ? selected.id : null }), true);
  const retLo = Math.min(0, s.ihsgRet, ...s.items.map((i) => i.ret));
  const retHi = Math.max(0, s.ihsgRet, ...s.items.map((i) => i.ret));
  const retPad = (retHi - retLo) * 0.07 || 0.01;
  const betaDomain = niceDomain(s.withStocks.map((i) => i.P.beta).concat([1]), 0.1);
  const exportClick = () => app.toast('Mock: di aplikasi, tombol ini mengunduh workbook dengan portofolio dan imbal hasil bulanan setiap mahasiswa.');
  const valueOf = (i) => (i.P ? ms.cell(ms.get(i.P)) : html`<span className="none">belum ada</span>`);
  const chips = STUDENT_FILTERS.filter((f) => !f.hidden || f === filter);
  const count = (f) => s.items.filter((i) => f.test(i, s)).length;
  const tools = html`<div className="a-tools">
    <h1>Mahasiswa</h1>
    <${Seg} label="Ukuran peringkat" value=${measure} onChange=${setMeasure} options=${Object.keys(MEASURES).map((k) => ({ value: k, label: MEASURES[k].label }))} />
    <span className="grow"></span>
    <label className="search" style=${{ flex: app.desktop ? '0 1 210px' : '1 1 200px' }}><${Icon} name="search" /><input className="input" type="search" placeholder="Cari nama atau NIM" value=${query} onInput=${(e) => setQuery(e.target.value)} aria-label="Cari nama atau NIM" autoComplete="off" /></label>
    <button type="button" className="btn" onClick=${exportClick} aria-label="Unduh workbook"><${Icon} name="download" /><span className="only-desk">Unduh workbook</span></button>
  </div>`;
  const filters = html`<div className=${'a-filters' + (app.desktop ? '' : ' chips scroll')} role="group" aria-label="Saring mahasiswa">
    ${chips.map((f) => html`<button type="button" key=${f.value} className="chip" aria-pressed=${f === filter ? 'true' : 'false'} onClick=${() => setFilter(f.value)}>${f.label} · <span className="count">${count(f)}</span></button>`)}
  </div>`;
  const ihsgNote = html`<div className="a-tnote">
    <span><i></i>Garis tegak: IHSG (imbal hasil ${F.pctSigned(s.ihsgRet)}, beta ${F.num(1, 1)})</span>
    <span>${shown.length < s.N ? shown.length + ' dari ' + s.N + ' mahasiswa tampil' : s.N + ' mahasiswa'}</span>
    <span>Peringkat menurut ${ms.label} per bulan, dari ${s.M.n} imbal hasil bulanan<${Q} id=${ms.q} label=${ms.label} /></span>
  </div>`;
  const empty = html`<div className="empty">Tidak ada mahasiswa yang cocok${t ? ' dengan "' + query.trim() + '"' : ''}${filter.value !== 'semua' ? ' di saringan ' + filter.label : ''}.</div>`;
  const table = html`<section className="a-panel" aria-label="Peringkat mahasiswa">
    ${shown.length
      ? html`<div className="table-wrap"><table className="a-tbl">
          <thead><tr><th><span className="sr-only">Peringkat</span></th><th>Mahasiswa</th><th style=${{ width: 184 }}>Imbal hasil</th><th style=${{ width: 112 }}>Beta</th><th style=${{ width: 80, textAlign: 'right' }}>Risiko/bln</th><th className="srt" style=${{ width: 108 }}>${ms.label} ↓</th><th style=${{ width: 112 }}>Terakhir aktif</th></tr></thead>
          <tbody>
            ${shown.map(
              (i) => html`<tr key=${i.id} className=${selected && selected.id === i.id ? 'sel' : ''} onClick=${() => select(i.id)}>
                <td className="rk">${rankOf[i.id] || ''}</td>
                <td><button type="button" className="a-who" aria-pressed=${selected && selected.id === i.id ? 'true' : 'false'} onClick=${(e) => { e.stopPropagation(); select(i.id); }}><span className="avatar">${initials(i.name)}</span><span><b>${i.name}</b><small>${i.st.nim}</small></span></button></td>
                <td><div className="cellbar"><span className="v"><${Delta} value=${i.ret} /></span><${Dv} value=${i.ret} min=${retLo - retPad} max=${retHi + retPad} refValue=${s.ihsgRet} /></div></td>
                <td>${i.P ? html`<div className="cellbar" style=${{ gridTemplateColumns: '34px minmax(0, 1fr)' }}><span className="v">${F.num(i.P.beta)}</span><${Ds} value=${i.P.beta} min=${betaDomain[0]} max=${betaDomain[1]} refValue=${1} /></div>` : html`<span className="none">belum ada</span>`}</td>
                <td className="num" style=${{ textAlign: 'right' }}>${i.P ? F.pct(i.P.sd) : html`<span className="none">belum ada</span>`}</td>
                <td style=${{ fontWeight: 600 }}>${valueOf(i)}</td>
                <td><span className=${'a-last' + (i.active ? ' on' : '')}><i></i>${lastActivityText(app, i.last)}</span></td>
              </tr>`
            )}
          </tbody>
        </table></div>`
      : empty}
    ${ihsgNote}
  </section>`;
  const list = html`<section className="a-panel" aria-label="Peringkat mahasiswa">
    ${shown.length
      ? html`<div className="m-list">${shown.map(
          (i) => html`<button type="button" key=${i.id} className=${'m-row student' + (selected && selected.id === i.id ? ' sel' : '')} onClick=${() => select(i.id)}>
            <span className="code xs muted" style=${{ textAlign: 'right', alignSelf: 'start', paddingTop: 2 }}>${rankOf[i.id] || ''}</span>
            <span style=${{ minWidth: 0 }}><b style=${{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${i.name}</b><span className="code xs muted">${i.st.nim}</span></span>
            <span className="price-col"><span style=${{ fontWeight: 600 }}>${valueOf(i)}</span><span className="xs muted">${ms.label}</span></span>
            <span className="marks" style=${{ gridColumn: '2 / -1' }}>
              <span><${Delta} value=${i.ret} /><${Dv} value=${i.ret} min=${retLo - retPad} max=${retHi + retPad} refValue=${s.ihsgRet} /></span>
              <span>${i.P ? html`<span className="num">β ${F.num(i.P.beta)}</span><${Ds} value=${i.P.beta} min=${betaDomain[0]} max=${betaDomain[1]} refValue=${1} />` : html`<span className="whole">tanpa saham</span>`}</span>
            </span>
            <span className=${'a-last' + (i.active ? ' on' : '')} style=${{ gridColumn: '2 / -1' }}><i></i>${lastActivityText(app, i.last)}</span>
          </button>`
        )}</div>`
      : empty}
    ${ihsgNote}
  </section>`;
  const panelProps = selected ? { s, item: selected, rank: rankOf[selected.id], ranked: Object.keys(rankOf).length } : null;
  return html`<div className="a-main a-s">
    <div className="a-col">
      ${tools}
      ${filters}
      ${app.desktop ? table : list}
    </div>
    ${docked && panelProps ? html`<aside className="a-card insp-col" aria-label=${'Mahasiswa terpilih: ' + selected.name}><div className="insp-sticky"><${StudentPanel} ...${panelProps} /></div></aside>` : null}
    ${!docked && panelProps
      ? html`<${Sheet} title=${selected.name} side=${app.desktop} onClose=${() => app.nav(studentsHash({ saring: filter.value }), true)}>${() => html`<${StudentPanel} ...${panelProps} inSheet />`}<//>`
      : null}
  </div>`;
}

function StudentDetail({ id, tab }) {
  const app = useApp();
  const rows = useClassRows();
  const row = rows.find((r) => r.st.id === id);
  if (!row) return html`<${NotFound} />`;
  const who = firstName(row.st.name);
  const t = tab || 'ringkasan';
  return html`<div className="stack">
    <div className="row" style=${{ gap: 6, marginLeft: -10 }}>
      <a className="icon-btn" href=${'#/mahasiswa?pilih=' + id} aria-label="Kembali ke Mahasiswa"><${Icon} name="chevLeft" /></a>
      <span className="avatar you" style=${{ width: 40, height: 40, fontSize: 14 }}>${initials(row.st.name)}</span>
      <div className="ticker grow" style=${{ marginLeft: 4 }}><h1 style=${{ fontSize: 22, letterSpacing: '-0.02em' }}>${row.st.name}</h1><span style=${{ whiteSpace: 'normal' }}>NIM <span className="code">${row.st.nim}</span> · aktivitas terakhir ${lastActivityText(app, row.last)}</span></div>
    </div>
    <div className="readonly-banner"><${Icon} name="eye" />Tampilan dosen. Hanya baca.</div>
    <${Seg} block=${!app.desktop} label="Bagian" value=${t} onChange=${(v) => app.nav('#/mahasiswa/' + id + (v === 'ringkasan' ? '' : '/' + v), true)} options=${[{ value: 'ringkasan', label: 'Ringkasan' }, { value: 'analisis', label: 'Analisis' }, { value: 'jurnal', label: 'Jurnal dan order' }]} />
    ${t === 'ringkasan'
      ? row.snap.empty
        ? html`<div className="card empty"><${Icon} name="clock" /><p>${who} belum memasang order. Modalnya masih ${F.rp(row.portfolio.startCash)} kas.</p></div>`
        : html`<${HomeView} portfolio=${row.portfolio} snap=${row.snap} who=${who} readOnly classId=${app.state.lecturerClass} selfId=${row.st.id} />`
      : t === 'analisis'
        ? html`<${AnalysisView} portfolio=${row.portfolio} snap=${row.snap} who=${who} />`
        : html`<div className="grid g-12 even">
            <div className=${app.desktop ? 'span-6' : ''}><${JournalList} portfolio=${row.portfolio} who=${who} /></div>
            <div className=${app.desktop ? 'span-6' : ''}><h2 className="section-title" style=${{ marginTop: 0, marginBottom: 10, minHeight: 44 }}>Order</h2><${OrdersList} portfolio=${row.portfolio} readOnly who=${who} /></div>
          </div>`}
  </div>`;
}

/* The lecturer's own portfolio for demonstrations in class: the same Beranda, Aktivitas, and Analisis as a student, as tabs. It counts in no statistic of the class, and students do not see it. */
function LecturerPortfolioView({ tab }) {
  const app = useApp();
  const t = tab === 'aktivitas' || tab === 'analisis' ? tab : 'ringkasan';
  return html`<div className="stack">
    <div className="a-tools">
      <h1>Portofolio demonstrasi</h1>
      <${Seg} label="Bagian portofolio" value=${t} onChange=${(v) => app.nav('#/portofolio' + (v === 'ringkasan' ? '' : '/' + v), true)} options=${[{ value: 'ringkasan', label: 'Ringkasan' }, { value: 'aktivitas', label: 'Aktivitas' }, { value: 'analisis', label: 'Analisis' }]} />
    </div>
    <p className="small muted" style=${{ marginTop: -6 }}>Portofolio Anda sendiri untuk peragaan di kelas, dengan modal awal ${F.rp(PL.START_CASH)} seperti mahasiswa. Portofolio ini tidak dihitung dalam statistik, peta, atau peringkat kelas, dan mahasiswa tidak melihatnya.</p>
    ${t === 'ringkasan'
      ? html`<${HomeView} portfolio=${app.portfolio} snap=${app.snap} classId=${app.state.lecturerClass} allMates matesLabel="Mahasiswa kelas" noTitle />`
      : t === 'aktivitas'
        ? html`<${ActivityView} sub=${app.route.parts[2]} base="#/portofolio/aktivitas" noTitle />`
        : html`<${AnalysisView} portfolio=${app.portfolio} snap=${app.snap} noTitle />`}
  </div>`;
}
