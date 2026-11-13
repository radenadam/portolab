/* Portolab mock: Belajar, the lessons, and the glossary. A lesson opens as a page from Belajar, and in a sheet over any other screen. */
function LearnView() {
  const app = useApp();
  const now = PL.sessionOf(app.market, app.clock.day);
  return html`<div className="stack">
    <div className="a-tools">
      <h1>Belajar</h1>
      <span className="grow"></span>
      <a href="#/kamus" className="btn"><${Icon} name="book" />Kamus istilah</a>
    </div>
    <div className="lesson-grid">
      ${LESSONS.map((l) => html`<${LessonCard} key=${l.n} l=${l} now=${now} />`)}
    </div>
  </div>`;
}
function LessonCard({ l, now }) {
  if (l.exam) {
    return html`<div className="lesson-card exam">
      <span className="sess"><span className="n">${PL.sessionLabel(l.n)}</span>Ujian${now === l.n ? ' · minggu ini' : ''}</span>
      <h3>${l.title}</h3>
      <p>${l.summary}</p>
    </div>`;
  }
  return html`<a className=${'lesson-card' + (now === l.n ? ' now' : '')} href=${'#/belajar/' + l.n}>
    <span className="sess"><span className="n">Sesi ${l.n}</span>${l.full ? 'Pelajaran interaktif' : 'Ringkasan'}${now === l.n ? ' · minggu ini' : ''}</span>
    <h3>${l.title}</h3>
    <p>${l.summary}</p>
    <span className="foot">
      ${l.practice ? html`<span className="info-note"><${Icon} name="flask" />Ada praktik dengan portofolio Anda</span>` : null}
      ${l.cannot ? html`<span className="info-note">Belum dapat dipraktikkan</span>` : null}
    </span>
  </a>`;
}

/* The task of a lesson's practice that needs another screen: one line, and the exact place it opens. */
function practiceTask(app, id) {
  const snap = app.snap;
  if (id === 'harga') return { line: 'Temukan saham dengan perubahan hari ini terbesar, lalu baca kode, harga, perubahan, dan waktu harganya.', href: '#/pasar?tugas=harga', label: 'Buka Pasar untuk tugas ini' };
  if (id === '6') {
    const code = snap && snap.positions.length ? snap.positions[0].code : app.state.watchlist[0] || app.market.stocks[0].code;
    return { line: 'Tiket ini sudah memakai order Limit. Naikkan harganya dengan tombol + sampai melewati ARA, baca pesannya, lalu tutup tiket tanpa mengirim order.', href: '#/saham/' + code + '/beli?tugas=6&tipe=limit', label: 'Buka tiket ' + code + ' dengan Limit' };
  }
  if ((id === '2' || id === '9' || id === '10') && !(snap && snap.P)) return { line: 'Beli saham pertama Anda, lalu kembali ke pelajaran ini untuk melihat angkanya.', href: '#/pasar?tugas=' + id, label: 'Cari saham pertama Anda' };
  return null;
}
/* A task that needs another screen opens it. In a sheet, the task opens the lesson page first, so the order in progress under the sheet is not left by surprise. */
function TaskButton({ id, inSheet }) {
  const app = useApp();
  const task = practiceTask(app, id);
  if (!task) return null;
  return html`<div className="task">
    <p><b>Tugas.</b> ${task.line}</p>
    ${inSheet
      ? html`<a className="btn" href=${'#/belajar/' + id + '?ke=praktik'}>Kerjakan di halaman pelajaran<${Icon} name="arrowRight" /></a>`
      : html`<a className="btn primary" href=${task.href}>${task.label}<${Icon} name="arrowRight" /></a>`}
  </div>`;
}

function TermList({ ids }) {
  const app = useApp();
  const [open, setOpen] = useState(null);
  return html`<section className="stack-sm"><h2 className="section-title">Istilah kunci</h2>
    <div className="terms">${ids.map((id) => {
      const g = GLOSSARY_BY_ID[id];
      if (!g) return null;
      const on = open === id;
      return html`<div key=${id} className=${'term' + (on ? ' open' : '')}>
        <button type="button" className="term-btn" aria-expanded=${on ? 'true' : 'false'} onClick=${() => setOpen(on ? null : id)}><b>${g.term}</b><${Icon} name="chevDown" /></button>
        ${on
          ? html`<div className="term-body"><p>${g.def}</p>${g.concept && CONCEPTS[g.concept] ? html`<button type="button" className="link-btn" onClick=${() => app.openConcept(g.concept, {})}>Lihat dengan angka Anda<${Icon} name="chevRight" /></button>` : null}</div>`
          : null}
      </div>`;
    })}</div></section>`;
}

function LessonShell({ l, children, yours, terms, practice, inSheet }) {
  const list = LESSONS.filter((x) => !x.exam);
  const i = list.findIndex((x) => x.n === l.n);
  const prev = list[i - 1];
  const next = list[i + 1];
  const practiceId = 'praktik-' + l.n + (inSheet ? '-s' : '');
  return html`<article className=${'lesson' + (inSheet ? ' in-sheet' : '')}>
    <div className="lesson-hero">
      ${inSheet ? null : html`<a className="link-btn" href="#/belajar" style=${{ marginLeft: -2, alignSelf: 'flex-start' }}><${Icon} name="chevLeft" />Belajar</a>`}
      <div className="row wrap" style=${{ gap: 8 }}>
        <span className="badge">Sesi ${l.n}</span>
        ${practice ? html`<button type="button" className="lk tight" onClick=${() => { const el = document.getElementById(practiceId); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }}>Langsung ke praktik<${Icon} name="chevDown" /></button>` : null}
        ${l.cannot ? html`<span className="info-note">Belum dapat dipraktikkan</span>` : null}
        ${inSheet ? html`<span className="grow"></span><a className="lk tight" href=${'#/belajar/' + l.n}>Buka di Belajar<${Icon} name="arrowRight" /></a>` : null}
      </div>
      ${inSheet ? null : html`<h1>${l.title}</h1>`}
    </div>
    ${children}
    ${yours ? html`<section className="a-card yours" aria-label="Angka Anda"><span className="label">Angka Anda</span>${yours}</section>` : null}
    ${terms && terms.length ? html`<${TermList} ids=${terms} />` : null}
    ${practice ? html`<section className="a-card practice" id=${practiceId} aria-labelledby=${practiceId + '-h'}><h2 id=${practiceId + '-h'} className="section-title" style=${{ marginTop: 0 }}><${Icon} name="flask" />Praktik dengan portofolio Anda</h2>${practice}</section>` : null}
    ${inSheet
      ? null
      : html`<nav className="row between wrap lesson-nav" aria-label="Pelajaran lain">
          ${prev ? html`<a className="link-btn" href=${'#/belajar/' + prev.n}><${Icon} name="chevLeft" />Sesi ${prev.n}: ${prev.title}</a>` : html`<span></span>`}
          ${next ? html`<a className="link-btn" href=${'#/belajar/' + next.n}>Sesi ${next.n}: ${next.title}<${Icon} name="chevRight" /></a>` : null}
        </nav>`}
  </article>`;
}

function studentNumbers(app) {
  if (!app.snap || !app.snap.P) return null;
  return app.snap;
}
const noNumbersYet = () => html`<p>Angka Anda muncul di sini setelah order beli pertama terisi.</p>`;

/* ---------- Sesi 2 ---------- */
function Lesson2({ inSheet }) {
  const app = useApp();
  const snap = app.snap;
  const pre = inSheet ? 's-' : '';
  const M = snap ? snap.M : PL.measures(app.market, PL.lastFinalIndex(app.market, app.clock));
  const own = snap && snap.positions.length >= 2 ? snap.positions.map((p) => p.code) : ['BBCA', 'ANTM'];
  const [a, setA] = useState(own[0]);
  const [b, setB] = useState(own.find((c) => c !== own[0] && c !== undefined) || own[1]);
  const corrOf = (x, y) => M.cov[x][y] / (M.stock[x].sd * M.stock[y].sd);
  const realRho = corrOf(a, b);
  const [rho, setRho] = useState(null);
  const [w, setW] = useState(50);
  const r = rho == null ? realRho : rho;
  const A = M.stock[a];
  const B = M.stock[b];
  const sdOf = (wa) => Math.sqrt(wa * wa * A.var + (1 - wa) * (1 - wa) * B.var + 2 * wa * (1 - wa) * r * A.sd * B.sd);
  const curve = [];
  for (let k = 0; k <= 40; k++) {
    const wa = k / 40;
    curve.push([sdOf(wa), wa * A.E + (1 - wa) * B.E]);
  }
  const wa = w / 100;
  const sd = sdOf(wa);
  const E = wa * A.E + (1 - wa) * B.E;
  const avg = wa * A.sd + (1 - wa) * B.sd;
  const xMax = Math.max(A.sd, B.sd) * 1.15;
  const ys = [A.E, B.E];
  const yMin = Math.min(...ys) - 0.003;
  const yMax = Math.max(...ys) + 0.003;
  const sel = (value, set, other) => html`<div className="chips" role="group">${own.filter((c) => c !== other).map((c) => html`<button type="button" key=${c} className="chip" aria-pressed=${value === c ? 'true' : 'false'} onClick=${() => { set(c); setRho(null); }}>${c}</button>`)}</div>`;
  const sn = studentNumbers(app);
  let practice = null;
  if (sn && sn.positions.length >= 2) {
    const pairs = [];
    const codes = sn.positions.map((p) => p.code);
    for (let i = 0; i < codes.length; i++) for (let j = i + 1; j < codes.length; j++) pairs.push({ a: codes[i], b: codes[j], r: corrOf(codes[i], codes[j]) });
    pairs.sort((x, y) => x.r - y.r);
    practice = html`<p className="small ink2">Korelasi setiap pasangan saham Anda, dari ${M.n} bulan. Pasangan teratas paling jarang bergerak searah.</p>
      <div className="pair-list pairs">${pairs.slice(0, 5).map((p) => html`<button type="button" key=${p.a + p.b} className=${'pair-row' + (a === p.a && b === p.b ? ' on' : '')} onClick=${() => { setA(p.a); setB(p.b); setRho(null); setW(50); }}>
        <span className="code">${p.a} · ${p.b}</span><span className="num">ρ ${F.num(p.r)}</span><span className="lk">Pakai di grafik</span>
      </button>`)}</div>
      <div className="task"><p><b>Tugas.</b> Pakai pasangan dengan korelasi terendah di grafik atas, lalu catat berapa poin risiko portofolio lebih kecil daripada rata-rata risikonya pada bobot 50%.</p></div>`;
  } else if (sn) {
    practice = html`<p className="small ink2">Praktik ini membandingkan pasangan saham Anda, dan portofolio Anda baru berisi ${sn.positions.length} saham.</p><${TaskButton} id="2" inSheet=${inSheet} />`;
  } else {
    practice = html`<${TaskButton} id="2" inSheet=${inSheet} />`;
  }
  return html`<${LessonShell} l=${LESSON_BY_N[2]} inSheet=${inSheet}
    terms=${['diversifikasi', 'korelasi', 'simpangan-baku']}
    practice=${practice}
    yours=${sn
      ? html`<p>Rata-rata tertimbang risiko isi portofolio Anda <b className="num">${F.pct(sn.P.avgRisk)}</b> per bulan, tetapi risiko portofolionya <b className="num">${F.pct(sn.P.sd)}</b>. Diversifikasi menghemat <b className="num">${F.num((sn.P.avgRisk - sn.P.sd) * 100)}</b> poin risiko.</p>`
      : noNumbersYet()}>
    <p className="key-idea">Menggabungkan saham yang tidak selalu bergerak searah membuat risiko portofolio lebih kecil dari rata-rata risiko isinya, tanpa mengurangi imbal hasil yang diharapkan.</p>
    <section className="a-card stack" aria-labelledby=${pre + 'l2-h'}>
      <div className="card-head" style=${{ marginBottom: 0 }}><h2 id=${pre + 'l2-h'}>Dua saham, satu portofolio</h2></div>
      ${own.length > 2 ? html`<div className="stack-sm"><span className="label">Saham A</span>${sel(a, setA, b)}<span className="label">Saham B</span>${sel(b, setB, a)}</div>` : html`<p className="small muted">${snap && snap.positions.length >= 2 ? 'Dua saham terbesar di portofolio Anda.' : 'Contoh dengan dua saham LQ45.'}</p>`}
      <div className="slider-row">
        <label htmlFor=${pre + 'l2-w'}>Bobot ${a}</label><output htmlFor=${pre + 'l2-w'}>${w}% ${a} · ${100 - w}% ${b}</output>
        <input id=${pre + 'l2-w'} type="range" min="0" max="100" step="5" value=${w} onInput=${(e) => setW(Number(e.target.value))} />
      </div>
      <div className="slider-row">
        <label htmlFor=${pre + 'l2-r'}>Korelasi ρ</label><output htmlFor=${pre + 'l2-r'}>${F.num(r)}</output>
        <input id=${pre + 'l2-r'} type="range" min="-1" max="1" step="0.05" value=${r} onInput=${(e) => setRho(Number(e.target.value))} />
      </div>
      ${rho != null ? html`<button type="button" className="link-btn" style=${{ alignSelf: 'flex-start' }} onClick=${() => setRho(null)}>Pakai korelasi asli ${a} dan ${b}, ${F.num(realRho)}</button>` : html`<p className="xs muted">Korelasi asli dari ${M.n} bulan. Geser untuk melihat apa yang terjadi bila keduanya lebih searah atau berlawanan.</p>`}
      <${Scatter}
        height=${240}
        xDomain=${[0, xMax]}
        yDomain=${[yMin, yMax]}
        xFormat=${(v) => F.pct(v, 0)}
        yFormat=${(v) => F.pct(v, 1)}
        xTitle="Risiko/bln"
        yTitle="Imbal hasil/bln"
        guides=${({ X, Y }) => html`<g>
          <path d=${'M' + X(B.sd) + ' ' + Y(B.E) + 'L' + X(A.sd) + ' ' + Y(A.E)} stroke="var(--line2)" strokeWidth="1.5" fill="none" />
          <path d=${pathOf(curve.map(([x, y]) => [X(x), Y(y)]))} stroke="var(--you)" strokeWidth="2" fill="none" />
        </g>`}
        points=${[
          { x: A.sd, y: A.E, color: 'var(--data)', r: 5.5, label: a, name: a },
          { x: B.sd, y: B.E, color: 'var(--data)', r: 5.5, label: b, name: b },
          { x: avg, y: E, color: 'var(--you)', hollow: true, r: 6, name: 'Tanpa diversifikasi (ρ = 1)' },
          { x: sd, y: E, color: 'var(--you)', r: 7, label: 'Portofolio', name: 'Portofolio', strong: true },
        ]}
        tip=${(p) => html`<div className="tip-title">${p.name}</div><div className="tip-row"><span className="k">Risiko</span><span className="v">${F.pct(p.x)}</span></div><div className="tip-row"><span className="k">Imbal hasil</span><span className="v">${F.pct(p.y)}</span></div>`}
        ariaLabel=${'Kurva risiko dan imbal hasil gabungan ' + a + ' dan ' + b + ' dengan korelasi ' + F.num(r)}
      />
      <div className="legend"><span><span className="key-line" style=${{ background: 'var(--you)' }}></span>Semua bobot dengan ρ ${F.num(r)}</span><span><span className="key-line" style=${{ background: 'var(--line2)' }}></span>Jika ρ = 1</span></div>
      <div className="stat-grid three">
        <${Stat} label="Risiko portofolio" value=${F.pct(sd)} />
        <${Stat} label="Rata-rata risiko" value=${F.pct(avg)} />
        <${Stat} label="Imbal hasil" value=${F.pct(E)} />
      </div>
      <div className="formula" style=${{ paddingTop: 0 }}>
        <div className="f-line">σ<sub>p</sub> = √(w²σ<sub>A</sub>² + (1 − w)²σ<sub>B</sub>² + 2w(1 − w)ρσ<sub>A</sub>σ<sub>B</sub>)</div>
        <div className="f-line">= √(${F.num(wa)}² × ${F.pct(A.sd)}² + ${F.num(1 - wa)}² × ${F.pct(B.sd)}² + 2 × ${F.num(wa)} × ${F.num(1 - wa)} × ${F.num(r)} × ${F.pct(A.sd)} × ${F.pct(B.sd)})</div>
        <div className="f-line result">= ${F.pct(sd, 3)}</div>
      </div>
    </section>
  <//>`;
}

/* ---------- Sesi 6 ---------- */
function Lesson6({ inSheet }) {
  const app = useApp();
  const pre = inSheet ? 's-' : '';
  const [k, setK] = useState(62);
  const price = PL.roundToTick(Math.round(50 * Math.pow(30000 / 50, k / 100)));
  const band = PL.autoRejection(price);
  const a = PL.orderAmounts('buy', price, 1);
  const s = PL.orderAmounts('sell', price, 1);
  const last = app.portfolio ? app.portfolio.orders.filter((o) => o.status === 'filled').sort((x, y) => y.fill.day - x.fill.day || y.fill.minute - x.fill.minute)[0] : null;
  const la = last ? PL.orderAmounts(last.side, last.fill.price, last.lots) : null;
  const task = practiceTask(app, '6');
  const code = task.href.split('/')[2];
  const live = PL.quote(app.market.byCode[code], app.market, app.clock);
  const liveBand = PL.autoRejection(PL.referencePrice(app.market.byCode[code], app.market, app.clock));
  const practice = html`<p className="small ink2">Harga ${code} sekarang <b className="num">${F.rp(live.price)}</b>, jadi hari ini harga order ${code} harus di antara ARB <b className="num">${F.rp(liveBand.arb)}</b> dan ARA <b className="num">${F.rp(liveBand.ara)}</b>, dan bergerak per <b className="num">${F.rp(PL.tickSize(live.price))}</b>.</p>
    <${TaskButton} id="6" inSheet=${inSheet} />`;
  return html`<${LessonShell} l=${LESSON_BY_N[6]} inSheet=${inSheet}
    terms=${['lot', 'fraksi-harga', 'ara', 'arb', 'sesi', 'pph-final']}
    practice=${practice}
    yours=${last
      ? html`<p>Order terakhir Anda: ${last.side === 'buy' ? 'beli' : 'jual'} ${F.int(last.lots)} lot ${last.code} di ${F.rp(last.fill.price)}. Nilainya ${F.rp(la.value)}, biaya broker ${F.rp(la.fee)}${last.side === 'sell' ? ', PPh ' + F.rp(la.tax) : ''}, jadi total ${last.side === 'buy' ? 'dibayar' : 'diterima'} <b className="num">${F.rp(la.total)}</b>.</p>`
      : noNumbersYet()}>
    <p className="key-idea">Di BEI Anda membeli dalam lot, dengan harga yang bergerak per fraksi, di dalam batas ARA dan ARB, selama sesi perdagangan.</p>
    <section className="a-card stack" aria-labelledby=${pre + 'l6a-h'}>
      <h2 id=${pre + 'l6a-h'} style=${{ fontSize: 15 }}>Jam perdagangan</h2>
      <${SessionTimeline} />
      <p className="small ink2">Order yang Anda pasang di luar sesi menunggu sesi berikutnya. Setiap order berlaku satu hari bursa.</p>
    </section>
    <section className="a-card stack" aria-labelledby=${pre + 'l6b-h'}>
      <h2 id=${pre + 'l6b-h'} style=${{ fontSize: 15 }}>Coba satu harga</h2>
      <div className="slider-row">
        <label htmlFor=${pre + 'l6-p'}>Harga acuan</label><output htmlFor=${pre + 'l6-p'} style=${{ fontSize: 18 }}>${F.rp(price)}</output>
        <input id=${pre + 'l6-p'} type="range" min="0" max="100" step="1" value=${k} onInput=${(e) => setK(Number(e.target.value))} />
      </div>
      <div className="stat-grid auto">
        <${Stat} label="Fraksi" value=${F.rp(PL.tickSize(price))} sub=${'harga berikutnya ' + F.rp(PL.stepPrice(price, 1))} />
        <${Stat} label=${'ARA +' + F.pct(band.up, 0)} value=${F.rp(band.ara)} sub="batas atas hari ini" />
        <${Stat} label=${'ARB −' + F.pct(band.down, 0)} value=${F.rp(band.arb)} sub="batas bawah hari ini" />
        <${Stat} label="1 lot" value=${F.rp(a.value)} sub="100 lembar" />
        <${Stat} label="Beli 1 lot" value=${F.rp(a.total)} sub=${'biaya ' + F.rp(a.fee)} />
        <${Stat} label="Jual 1 lot" value=${F.rp(s.total)} sub=${'biaya ' + F.rp(s.fee) + ' + PPh ' + F.rp(s.tax)} />
      </div>
      <${TickTable} highlight=${price} />
      <p className="xs muted">Persentase ARA dan ARB di sini adalah asumsi mock: +35% dan −15% sampai harga ${F.rp(5000)}, +25% dan −15% di atasnya.</p>
    </section>
  <//>`;
}

/* ---------- Sesi 9 ---------- */
function Lesson9({ inSheet }) {
  const app = useApp();
  const snap = app.snap;
  const pre = inSheet ? 's-' : '';
  const M = snap ? snap.M : PL.measures(app.market, PL.lastFinalIndex(app.market, app.clock));
  const sn = studentNumbers(app);
  const [beta, setBeta] = useState(sn ? Math.round(sn.P.beta * 20) / 20 : 1);
  const [mine, setMine] = useState(true);
  const req = M.rf + beta * (M.Em - M.rf);
  const maxB = 2;
  const pts = [{ x: beta, y: req, color: 'var(--you)', r: 7, label: 'β ' + F.num(beta), name: 'Titik pilihan Anda', strong: true }, { x: 1, y: M.Em, shape: 'diamond', label: 'IHSG', name: 'IHSG' }];
  if (sn && mine) {
    for (const p of sn.positions) pts.push({ x: M.stock[p.code].beta, y: M.stock[p.code].E, stem: M.stock[p.code].required, color: 'var(--data)', r: 5.5, label: p.code, name: p.code, code: p.code });
  }
  const ys = pts.map((p) => p.y).concat([M.rf, M.rf + maxB * (M.Em - M.rf)]);
  let practice = html`<${TaskButton} id="9" inSheet=${inSheet} />`;
  if (sn) {
    const rows = sn.positions.map((p) => ({ code: p.code, alpha: M.stock[p.code].alpha })).sort((x, y) => x.alpha - y.alpha);
    let lim = 0.001;
    for (const r of rows) lim = Math.max(lim, Math.abs(r.alpha));
    practice = html`<p className="small ink2">Alpha setiap saham Anda per bulan adalah jarak titiknya dari garis pasar sekuritas di grafik atas.</p>
      <div className="pair-list">${rows.map((r) => html`<button type="button" key=${r.code} className="pair-row" onClick=${() => app.openConcept('alpha', { openCalc: true, code: r.code })} aria-label=${r.code + ', alpha ' + F.pctSigned(r.alpha) + '. Buka perhitungannya'}>
        <span className="code">${r.code}</span><span className="pair-bar"><${Dv} value=${r.alpha} min=${-lim * 1.1} max=${lim * 1.1} /></span><span className="num"><${Delta} value=${r.alpha} /></span>
      </button>`)}</div>
      <div className="task"><p><b>Tugas.</b> Pilih saham dengan alpha paling negatif di daftar ini dan baca perhitungannya. Bagian mana yang membuatnya di bawah garis, imbal hasilnya atau betanya?</p></div>`;
  }
  return html`<${LessonShell} l=${LESSON_BY_N[9]} inSheet=${inSheet}
    terms=${['beta', 'premi-risiko-pasar', 'alpha-jensen', 'bi-rate']}
    practice=${practice}
    yours=${sn
      ? html`<p>Beta portofolio Anda <b className="num">${F.num(sn.P.beta)}</b>, jadi CAPM meminta <b className="num">${F.pct(sn.P.required)}</b> per bulan. Imbal hasil yang diharapkan <b className="num">${F.pct(sn.P.E)}</b>, sehingga alpha Anda <${Delta} value=${sn.P.alpha} />.</p>`
      : noNumbersYet()}>
    <p className="key-idea">Pasar hanya membayar risiko yang tidak hilang dengan diversifikasi. Ukurannya beta, dan CAPM menerjemahkan beta menjadi imbal hasil yang pantas.</p>
    <section className="a-card stack" aria-labelledby=${pre + 'l9-h'}>
      <div className="card-head" style=${{ marginBottom: 0 }}><h2 id=${pre + 'l9-h'}>Geser beta di garis pasar sekuritas</h2></div>
      <div className="slider-row">
        <label htmlFor=${pre + 'l9-b'}>Beta</label><output htmlFor=${pre + 'l9-b'} style=${{ fontSize: 18 }}>${F.num(beta)}</output>
        <input id=${pre + 'l9-b'} type="range" min="0" max="2" step="0.05" value=${beta} onInput=${(e) => setBeta(Number(e.target.value))} />
      </div>
      <${Scatter}
        height=${260}
        xDomain=${[0, maxB]}
        yDomain=${[Math.min(...ys) - 0.002, Math.max(...ys) + 0.002]}
        xFormat=${(v) => F.num(v, 1)}
        yFormat=${(v) => F.pct(v, 1)}
        xTitle="Beta"
        yTitle="Imbal hasil/bln"
        line=${[[0, M.rf], [maxB, M.rf + maxB * (M.Em - M.rf)]]}
        points=${pts}
        onPick=${(p) => (p.code ? app.openConcept('alpha', { openCalc: true, code: p.code }) : null)}
        tip=${(p) => html`<div className="tip-title">${p.name}</div><div className="tip-row"><span className="k">Beta</span><span className="v">${F.num(p.x)}</span></div><div className="tip-row"><span className="k">Imbal hasil</span><span className="v">${F.pct(p.y)}</span></div>`}
        ariaLabel=${'Garis pasar sekuritas dengan titik beta ' + F.num(beta) + ' dan imbal hasil yang diminta ' + F.pct(req)}
      />
      ${sn ? html`<label className="row" style=${{ minHeight: 44, gap: 10 }}><input type="checkbox" checked=${mine} onChange=${(e) => setMine(e.target.checked)} style=${{ width: 20, height: 20, accentColor: 'var(--data)' }} />Tampilkan saham Anda dan alphanya</label>` : null}
      <div className="formula" style=${{ paddingTop: 0 }}>
        <div className="f-line">E(R) = R<sub>f</sub> + β × (E(R<sub>m</sub>) − R<sub>f</sub>)</div>
        <div className="f-line">= ${F.pct(M.rf, 3)} + ${F.num(beta)} × (${F.pct(M.Em, 3)} − ${F.pct(M.rf, 3)})</div>
        <div className="f-line result">= ${F.pct(req, 3)} per bulan</div>
        <div className="f-note">R<sub>f</sub> adalah BI-Rate ${F.pct(PL.BI_RATE)} dibagi 12. E(R<sub>m</sub>) adalah rata-rata ${M.n} imbal hasil bulanan IHSG.</div>
      </div>
    </section>
  <//>`;
}

/* ---------- Sesi 10 ---------- */
function Lesson10({ inSheet }) {
  const app = useApp();
  const sn = studentNumbers(app);
  const snap = app.snap;
  const pre = inSheet ? 's-' : '';
  const M = snap ? snap.M : PL.measures(app.market, PL.lastFinalIndex(app.market, app.clock));
  const base = sn ? Object.fromEntries(sn.positions.map((p) => [p.code, Math.round(p.weight * 100)])) : { BBCA: 30, TLKM: 20, ANTM: 15, ICBP: 15 };
  const [w, setW] = useState(base);
  const codes = Object.keys(base);
  const sum = codes.reduce((s, c) => s + w[c], 0);
  const cash = 100 - sum;
  const weights = Object.fromEntries(codes.map((c) => [c, w[c] / 100]));
  const P = PL.portfolioMeasures(weights, M);
  const setOne = (c, v) => {
    const others = sum - w[c];
    setW(Object.assign({}, w, { [c]: Math.max(0, Math.min(v, 100 - others)) }));
  };
  let maxTerm = 0;
  for (const a of codes) for (const b of codes) maxTerm = Math.max(maxTerm, Math.abs(weights[a] * weights[b] * M.cov[a][b]));
  let practice = html`<${TaskButton} id="10" inSheet=${inSheet} />`;
  if (sn) {
    const rows = sn.positions.map((p) => ({ code: p.code, w: p.weight, c: sn.P.contrib[p.code] })).sort((x, y) => y.c - x.c);
    const top = rows[0];
    const target = sn.P.sd * 0.9;
    const done = P && P.sd < target;
    let maxC = 0.01;
    for (const r of rows) maxC = Math.max(maxC, r.c, r.w);
    practice = html`<p className="small ink2">Bagian risiko portofolio Anda dari setiap saham, dibandingkan dengan bobotnya.</p>
      <div className="pair-list">${rows.map((r) => html`<div key=${r.code} className="pair-row static">
        <span className="code">${r.code}</span>
        <span className="pair-bar contrib"><i style=${{ width: (Math.max(0, r.c) / maxC) * 100 + '%' }}></i><b style=${{ left: (r.w / maxC) * 100 + '%' }}></b></span>
        <span className="num">${F.pct(r.c, 0)} <span className="muted">/ ${F.pct(r.w, 0)}</span></span>
      </div>`)}</div>
      <div className="task"><p><b>Tugas.</b> Dengan penggeser di atas, turunkan bobot ${top.code}, penyumbang risiko terbesar, sampai simpangan baku portofolio di bawah <b className="num">${F.pct(target)}</b>. Sekarang <b className="num">${P ? F.pct(P.sd) : F.pct(0)}</b>.</p>
        <p className=${done ? 'up' : 'muted'} role="status">${done ? 'Tercapai. Perhatikan juga apa yang terjadi pada imbal hasil harapan.' : 'Belum tercapai.'}</p></div>`;
  }
  return html`<${LessonShell} l=${LESSON_BY_N[10]} inSheet=${inSheet}
    terms=${['kovarians', 'rasio-sharpe', 'rasio-treynor', 'kontribusi-risiko']}
    practice=${practice}
    yours=${sn
      ? html`<p>Imbal hasil harapan <b className="num">${F.pct(sn.P.E)}</b>, risiko <b className="num">${F.pct(sn.P.sd)}</b>, Sharpe <b className="num">${F.num(sn.P.sharpe)}</b>, dan Treynor <b className="num">${F.pct(sn.P.treynor)}</b> per bulan. Penggeser di atas dimulai dari bobot portofolio Anda sekarang.</p>`
      : noNumbersYet()}>
    <p className="key-idea">Imbal hasil portofolio adalah rata-rata tertimbang imbal hasil isinya. Risikonya bukan rata-rata, karena kovarians antarsaham ikut dihitung.</p>
    <section className="a-card stack" aria-labelledby=${pre + 'l10-h'}>
      <div className="card-head" style=${{ marginBottom: 0 }}>
        <h2 id=${pre + 'l10-h'}>Ubah bobot, lihat ukurannya</h2>
        <button type="button" className="btn ghost" onClick=${() => setW(base)}>Kembalikan</button>
      </div>
      ${codes.map(
        (c) => html`<div className="slider-row" key=${c}>
          <label htmlFor=${pre + 'l10-' + c} className="code">${c}</label><output htmlFor=${pre + 'l10-' + c}>${w[c]}%</output>
          <input id=${pre + 'l10-' + c} type="range" min="0" max="100" step="1" value=${w[c]} onInput=${(e) => setOne(c, Number(e.target.value))} />
        </div>`
      )}
      <p className="small ink2">Kas <b className="num">${cash}%</b>. Kas tidak berisiko dan tidak berbunga.</p>
      ${P
        ? html`<div className="stat-grid auto">
            <${Stat} label="Imbal hasil harapan" value=${F.pct(P.E)} sub=${sn ? 'sekarang ' + F.pct(sn.P.E) : null} />
            <${Stat} label="Simpangan baku" value=${F.pct(P.sd)} sub=${sn ? 'sekarang ' + F.pct(sn.P.sd) : null} />
            <${Stat} label="Beta" value=${F.num(P.beta)} sub=${sn ? 'sekarang ' + F.num(sn.P.beta) : null} />
            <${Stat} label="Sharpe" value=${F.num(P.sharpe)} sub=${sn ? 'sekarang ' + F.num(sn.P.sharpe) : null} />
            <${Stat} label="Treynor" value=${P.treynor == null ? 'belum ada' : F.pct(P.treynor)} sub=${sn ? 'sekarang ' + F.pct(sn.P.treynor) : null} />
            <${Stat} label="Alpha" value=${html`<${Delta} value=${P.alpha} />`} sub=${sn ? 'sekarang ' + F.pctSigned(sn.P.alpha) : null} />
          </div>
          <div className="stack-sm">
            <h3 style=${{ fontSize: 13 }}>Dari mana varians berasal: w<sub>i</sub> × w<sub>j</sub> × Cov(R<sub>i</sub>, R<sub>j</sub>)</h3>
            <div className="table-wrap">
              <div style=${{ display: 'grid', gridTemplateColumns: '52px repeat(' + codes.length + ', minmax(52px, 1fr))', gap: 2, minWidth: 52 + codes.length * 54 }}>
                <span></span>${codes.map((c) => html`<span key=${c} className="xs code muted" style=${{ textAlign: 'center' }}>${c}</span>`)}
                ${codes.map((a) => html`<${Fragment} key=${a}><span className="xs code muted" style=${{ display: 'flex', alignItems: 'center' }}>${a}</span>
                  ${codes.map((b) => {
                    const t = weights[a] * weights[b] * M.cov[a][b];
                    const k = maxTerm > 0 ? Math.abs(t) / maxTerm : 0;
                    return html`<span key=${b} className="num" title=${a + ' × ' + b} style=${{ minHeight: 40, display: 'grid', placeItems: 'center', borderRadius: 6, fontSize: 11, background: 'color-mix(in oklab, var(--data) ' + Math.round(k * 70) + '%, var(--raised))', color: k > 0.55 ? '#ffffff' : 'var(--ink)' }}>${F.num(t * 10000, 1)}</span>`;
                  })}<//>`)}
              </div>
            </div>
            <p className="xs muted">Angka dalam satuan 0,0001. Jumlah semua sel = σ<sub>p</sub>² = <span className="num">${F.num(P.variance, 6)}</span>, jadi σ<sub>p</sub> = <span className="num">${F.pct(P.sd, 3)}</span>. Sel di luar diagonal adalah kovarians, yang tidak ada di rata-rata biasa.</p>
          </div>`
        : html`<p className="small muted">Naikkan bobot salah satu saham untuk melihat ukurannya.</p>`}
      <div className="formula" style=${{ paddingTop: 0 }}>
        <div className="f-line">Sharpe = (E(R<sub>p</sub>) − R<sub>f</sub>) ÷ σ<sub>p</sub></div>
        <div className="f-line">Treynor = (E(R<sub>p</sub>) − R<sub>f</sub>) ÷ β<sub>p</sub></div>
        <div className="f-note">Sharpe membagi dengan risiko total, Treynor hanya dengan risiko pasar. Untuk portofolio yang belum terdiversifikasi, keduanya bisa memberi peringkat yang berbeda.</div>
      </div>
    </section>
  <//>`;
}

/* ---------- short lessons ---------- */
function ShortLesson({ l, inSheet }) {
  return html`<${LessonShell} l=${l} terms=${l.terms} inSheet=${inSheet}>
    ${l.cannot ? html`<div className="note"><${Icon} name="info" /><p>Materi ini belum dapat dipraktikkan di simulasi. Portolab saat ini hanya memperdagangkan saham LQ45.</p></div>` : null}
    <p className="key-idea">${l.summary}</p>
    <section className="a-card" aria-label="Ide kunci">
      <h2 style=${{ fontSize: 15, marginBottom: 8 }}>Ide kunci</h2>
      <ol style=${{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>${l.ideas.map((t, i) => html`<li key=${i}>${t}</li>`)}</ol>
    </section>
  <//>`;
}

/* ---------- the guide on reading a price ---------- */
function PriceGuide({ inSheet }) {
  const app = useApp();
  const s = app.market.byCode.BBCA;
  const q = PL.quote(s, app.market, app.clock);
  const ch = q.price / q.prevClose - 1;
  const marks = [
    ['1', 'Kode saham', 'Empat huruf yang mewakili perusahaan. BBCA adalah Bank Central Asia.'],
    ['2', 'Harga terakhir', 'Harga per lembar dari transaksi terakhir yang sampai ke Portolab, tertunda sekitar 10 menit.'],
    ['3', 'Perubahan', 'Selisih dengan harga penutupan hari bursa sebelumnya, dalam rupiah dan persen. Hijau dengan panah naik, merah dengan panah turun.'],
    ['4', 'Waktu kutipan', 'Kapan harga itu terjadi. Setelah bursa tutup, yang tampil adalah harga penutupan.'],
  ];
  const Mark = ({ n }) => html`<span aria-hidden="true" style=${{ display: 'inline-grid', placeItems: 'center', width: 20, height: 20, borderRadius: 10, background: 'var(--data)', color: '#ffffff', font: '600 11px var(--f-ui)', flex: 'none' }}>${n}</span>`;
  return html`<article className=${'lesson' + (inSheet ? ' in-sheet' : '')}>
    <div className="lesson-hero">
      ${inSheet ? null : html`<a className="link-btn" href="#/belajar" style=${{ alignSelf: 'flex-start' }}><${Icon} name="chevLeft" />Belajar</a>`}
      <div className="row wrap" style=${{ gap: 8 }}><span className="badge">Panduan · 5 menit</span>${inSheet ? html`<span className="grow"></span><a className="lk tight" href="#/belajar/harga">Buka di Belajar<${Icon} name="arrowRight" /></a>` : null}</div>
      ${inSheet ? null : html`<h1>Cara membaca harga saham</h1>`}
    </div>
    <p className="key-idea">Satu baris di Pasar memuat semua yang Anda perlukan untuk mulai: kode, harga, perubahan, dan waktunya.</p>
    <section className="a-card stack" aria-label="Contoh baris harga">
      <div className="row" style=${{ gap: 12, padding: '12px', border: '1px dashed var(--line2)', borderRadius: 12 }}>
        <${Logo} code="BBCA" />
        <div className="ticker grow"><span className="row" style=${{ gap: 6 }}><b>BBCA</b><${Mark} n="1" /></span><span>${s.name}</span></div>
        <div className="price-col" style=${{ gap: 2 }}>
          <span className="row" style=${{ gap: 6 }}><${Mark} n="2" /><span className="p">${F.rp(q.price)}</span></span>
          <span className="row" style=${{ gap: 6 }}><${Mark} n="3" /><${Delta} value=${ch} /></span>
          <span className="row xs muted" style=${{ gap: 6 }}><${Mark} n="4" />${quoteTime(app, q)}</span>
        </div>
      </div>
      <ol style=${{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        ${marks.map(([n, t, d]) => html`<li key=${n} className="row" style=${{ alignItems: 'flex-start', gap: 10 }}><${Mark} n=${n} /><div><b>${t}</b><p className="small ink2">${d}</p></div></li>`)}
      </ol>
    </section>
    <section className="a-card stack-sm" aria-label="Berapa uang untuk satu lot">
      <h2 style=${{ fontSize: 15 }}>Berapa uang untuk satu lot?</h2>
      <p>1 lot = 100 lembar. Di ${F.rp(q.price)}, 1 lot BBCA bernilai <b className="num">${F.rp(q.price * 100)}</b>, ditambah biaya broker ${F.pct(PL.FEES.buy)}, yaitu ${F.rp(PL.orderAmounts('buy', q.price, 1).fee)}.</p>
      <p className="small ink2">Harga BBCA bergerak per ${F.rp(PL.tickSize(q.price))}. Ini disebut fraksi harga.<${Q} id="fraksi" ctx=${{ code: 'BBCA' }} /></p>
    </section>
    <section className="a-card practice" id=${'praktik-harga' + (inSheet ? '-s' : '')} aria-label="Praktik">
      <h2 className="section-title" style=${{ marginTop: 0 }}><${Icon} name="flask" />Praktik</h2>
      <${TaskButton} id="harga" inSheet=${inSheet} />
    </section>
  </article>`;
}

function LessonView({ id, inSheet }) {
  const app = useApp();
  useEffect(() => {
    if (inSheet || app.route.query.ke !== 'praktik') return;
    const el = document.getElementById('praktik-' + id);
    if (el) el.scrollIntoView({ block: 'start' });
  }, [id]);
  if (id === 'harga') return html`<${PriceGuide} inSheet=${inSheet} />`;
  const n = Number(id);
  if (n === 2) return html`<${Lesson2} inSheet=${inSheet} />`;
  if (n === 6) return html`<${Lesson6} inSheet=${inSheet} />`;
  if (n === 9) return html`<${Lesson9} inSheet=${inSheet} />`;
  if (n === 10) return html`<${Lesson10} inSheet=${inSheet} />`;
  const l = LESSON_BY_N[n];
  if (!l || l.exam) return html`<${NotFound} />`;
  return html`<${ShortLesson} l=${l} inSheet=${inSheet} />`;
}

/* ---------- Kamus ---------- */
function GlossaryView({ focus, inSheet }) {
  const app = useApp();
  const [query, setQuery] = useState('');
  const t = query.trim().toLowerCase();
  const items = GLOSSARY.filter((g) => !t || g.term.toLowerCase().includes(t) || g.def.toLowerCase().includes(t)).sort((a, b) => a.term.localeCompare(b.term, 'id'));
  const pre = inSheet ? 's-' : '';
  useEffect(() => {
    if (focus) {
      const el = document.getElementById(pre + 'term-' + focus);
      if (el) el.scrollIntoView({ block: 'center' });
    } else if (!inSheet) {
      const input = document.getElementById('kamus-q');
      if (input && app.desktop) input.focus({ preventScroll: true });
    }
  }, [focus]);
  return html`<div className="stack reading">
    ${inSheet ? null : html`<a className="link-btn" href="#/belajar" style=${{ marginLeft: -2, marginBottom: -10, alignSelf: 'flex-start' }}><${Icon} name="chevLeft" />Belajar</a>`}
    ${inSheet ? null : html`<div className="a-tools"><h1>Kamus</h1></div>`}
    <label className="search"><${Icon} name="search" /><input id=${pre + 'kamus-q'} className="input" type="search" placeholder="Cari istilah atau artinya" value=${query} onInput=${(e) => setQuery(e.target.value)} aria-label="Cari di Kamus" autoComplete="off" /></label>
    <p className="xs muted" aria-live="polite">${items.length} istilah</p>
    <div className="a-panel" style=${{ padding: '4px 18px' }}>
      ${items.length
        ? items.map(
            (g) => html`<div key=${g.id} id=${pre + 'term-' + g.id} className=${'gloss-row' + (focus === g.id ? ' focus' : '')}>
              <h2 style=${{ fontSize: 15 }}>${g.term}</h2>
              <p className="ink2">${g.def}</p>
              <div className="row wrap" style=${{ gap: 4 }}>
                <button type="button" className="link-btn" onClick=${() => app.openLesson(String(g.session))}>Sesi ${g.session}: ${LESSON_BY_N[g.session].title}</button>
                ${g.concept && CONCEPTS[g.concept] ? html`<button type="button" className="link-btn" style=${{ marginLeft: 12 }} onClick=${() => app.openConcept(g.concept, { code: 'BBCA' })}>Lihat dengan angka</button>` : null}
              </div>
            </div>`
          )
        : html`<div className="empty">Tidak ada istilah yang memuat "${query.trim()}". Coba kata yang lebih pendek, misalnya "risiko".</div>`}
    </div>
  </div>`;
}
