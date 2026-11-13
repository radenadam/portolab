/* Portolab mock: state, routing, the shell, the concept card, onboarding, and the demo control. */
const MARKET = PL.generateMarket();
const CLASSES = PL.buildClasses(MARKET);
const OPEN_MINUTE = 624;
const CLOSED_MINUTE = 1180;
const STORE_KEY = 'portolab-mock-v6';

const STUDENT_CLASSES = {
  'mp-a': { course: 'Manajemen Portofolio', name: 'Kelas A', short: 'Manajemen Portofolio · Kelas A', lecturer: 'Dr. Ratna Wulandari', term: 'Ganjil 2026/2027' },
  'ai-c': { course: 'Analisis Investasi', name: 'Kelas C', short: 'Analisis Investasi · Kelas C', lecturer: 'Dr. Yudi Hartono', term: 'Ganjil 2026/2027' },
};
const LECTURER_CLASSES = {
  'mp-a': { course: 'Manajemen Portofolio', name: 'Kelas A', short: 'Manajemen Portofolio · Kelas A', code: '7K4Q2M', term: 'Ganjil 2026/2027' },
  'mp-b': { course: 'Manajemen Portofolio', name: 'Kelas B', short: 'Manajemen Portofolio · Kelas B', code: 'R8N3TX', term: 'Ganjil 2026/2027' },
};
const PEOPLE = {
  student: { name: 'Nadia Putri Maharani', initials: 'NP', sub: 'NIM 1202220101' },
  lecturer: { name: 'Dr. Ratna Wulandari', initials: 'RW', sub: 'Dosen' },
};

function initialState() {
  return {
    v: 6,
    role: 'student',
    clock: { day: MARKET.today0, minute: OPEN_MINUTE },
    studentClass: 'mp-a',
    lecturerClass: 'mp-a',
    portfolios: { 'mp-a': PL.buildNadia(MARKET), 'ai-c': PL.emptyPortfolio(MARKET) },
    /* The lecturer's own demonstration portfolio in each class. It is kept apart from the students, so it counts in no statistic of the class. */
    lecturerPortfolios: { 'mp-a': PL.buildLecturerDemo(MARKET, 'mp-a'), 'mp-b': PL.buildLecturerDemo(MARKET, 'mp-b') },
    watchlist: ['BBRI', 'ADRO'],
    events: [],
    onboarding: false,
    theme: 'system',
  };
}
function loadState() {
  const raw = storageGet(STORE_KEY);
  if (!raw) return initialState();
  try {
    const s = JSON.parse(raw);
    if (s.v !== 6 || !s.portfolios || !s.lecturerPortfolios || !s.clock || s.clock.day >= MARKET.T - 1) return initialState();
    return Object.assign(initialState(), s, { onboarding: false });
  } catch (e) {
    return initialState();
  }
}

function ownerOf(state) {
  return state.role === 'student' ? 'student:' + state.studentClass : 'lecturer:' + state.lecturerClass;
}
function advanceAll(state, to) {
  const portfolios = {};
  const lecturerPortfolios = {};
  let events = [];
  for (const id of Object.keys(state.portfolios)) {
    const r = PL.advance(state.portfolios[id], MARKET, state.clock, to);
    portfolios[id] = r.portfolio;
    if (id === state.studentClass) events = events.concat(r.events.map((e) => Object.assign({ owner: 'student:' + id }, e)));
  }
  for (const id of Object.keys(state.lecturerPortfolios)) {
    const r = PL.advance(state.lecturerPortfolios[id], MARKET, state.clock, to);
    lecturerPortfolios[id] = r.portfolio;
    if (id === state.lecturerClass) events = events.concat(r.events.map((e) => Object.assign({ owner: 'lecturer:' + id }, e)));
  }
  return Object.assign({}, state, { portfolios, lecturerPortfolios, clock: to, events: state.events.concat(events) });
}

function reducer(state, a) {
  switch (a.type) {
    case 'setPortfolio':
      return state.role === 'student'
        ? Object.assign({}, state, { portfolios: Object.assign({}, state.portfolios, { [state.studentClass]: a.portfolio }) })
        : Object.assign({}, state, { lecturerPortfolios: Object.assign({}, state.lecturerPortfolios, { [state.lecturerClass]: a.portfolio }) });
    case 'star': {
      const has = state.watchlist.includes(a.code);
      return Object.assign({}, state, { watchlist: has ? state.watchlist.filter((c) => c !== a.code) : state.watchlist.concat([a.code]) });
    }
    case 'clearEvents':
      return Object.assign({}, state, { events: state.events.filter((e) => e.owner !== ownerOf(state)) });
    case 'setRole':
      return Object.assign({}, state, { role: a.role });
    case 'setClass':
      return Object.assign({}, state, state.role === 'student' ? { studentClass: a.id, events: [] } : { lecturerClass: a.id });
    case 'closeMarket':
      return advanceAll(Object.assign({}, state, { events: [] }), { day: state.clock.day, minute: CLOSED_MINUTE });
    case 'nextDay':
      return advanceAll(Object.assign({}, state, { events: [] }), { day: state.clock.day + 1, minute: OPEN_MINUTE });
    case 'newStudent':
      return Object.assign({}, state, {
        role: 'student',
        events: [],
        onboarding: true,
        portfolios: Object.assign({}, state.portfolios, { [state.studentClass]: PL.emptyPortfolio(MARKET, state.clock) }),
      });
    case 'restoreSample': {
      const fresh = initialState();
      return Object.assign({}, fresh, { theme: state.theme, role: 'student' });
    }
    case 'onboarding':
      return Object.assign({}, state, { onboarding: a.open });
    case 'theme':
      return Object.assign({}, state, { theme: a.theme });
    default:
      return state;
  }
}

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const query = {};
  if (qs) for (const kv of qs.split('&')) {
    const [k, v] = kv.split('=');
    query[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return { parts, query, raw: h };
}
function useRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, []);
  const nav = useCallback((hash, replace) => {
    if (replace) {
      history.replaceState(null, '', hash);
      setRoute(parseHash());
    } else if (location.hash === hash) {
      setRoute(parseHash());
    } else {
      location.hash = hash;
    }
  }, []);
  return [route, nav];
}

const STUDENT_NAV = [
  { key: 'beranda', label: 'Beranda', icon: 'map' },
  { key: 'pasar', label: 'Pasar', icon: 'trend' },
  { key: 'aktivitas', label: 'Aktivitas', icon: 'list' },
  { key: 'analisis', label: 'Analisis', icon: 'pie' },
  { key: 'belajar', label: 'Belajar', icon: 'book' },
];
const LECTURER_NAV = [
  { key: 'kelas', label: 'Kelas', icon: 'cap' },
  { key: 'mahasiswa', label: 'Mahasiswa', icon: 'users' },
  { key: 'portofolio', label: 'Portofolio', icon: 'brief' },
  { key: 'pasar', label: 'Pasar', icon: 'trend' },
  { key: 'belajar', label: 'Belajar', icon: 'book' },
];
const TAB_OF = { saham: 'pasar', kamus: 'belajar' };
const TITLES = { beranda: 'Beranda', pasar: 'Pasar', aktivitas: 'Aktivitas', analisis: 'Analisis', belajar: 'Belajar', kamus: 'Kamus', kelas: 'Kelas', mahasiswa: 'Mahasiswa', portofolio: 'Portofolio demonstrasi', saham: 'Saham' };

function NotFound() {
  return html`<div className="card empty"><${Icon} name="info" /><p>Halaman ini tidak ada di kelas Anda.</p><a className="btn primary" href="#/">Kembali ke awal</a></div>`;
}

/* ---------- the concept card ---------- */
function ConceptSheet({ id, ctx, onClose, depth }) {
  const app = useApp();
  const concept = CONCEPTS[id];
  const snap = ctx.snap || app.snap;
  const portfolio = ctx.portfolio || app.portfolio;
  const M = snap ? snap.M : PL.measures(MARKET, PL.lastFinalIndex(MARKET, app.clock));
  const c = Object.assign({ market: MARKET, clock: app.clock, M, snap, portfolio, P: snap ? snap.P : null }, ctx);
  if (snap && portfolio && !c.history && id === 'sejak-awal') c.history = PL.history(portfolio, MARKET, app.clock);
  const forLecturer = html`<p>Angka ini muncul setelah portofolio berisi saham.</p>`;
  let yours = null;
  let calc = null;
  try {
    yours = concept.yours ? concept.yours(c) : null;
  } catch (e) {
    yours = forLecturer;
  }
  try {
    calc = concept.calc ? concept.calc(c) : null;
  } catch (e) {
    calc = null;
  }
  if (!yours && c.code && (id === 'rentang-hari' || id === 'rentang-52' || id === 'harga-acuan')) yours = stockRangeYours(id, c);
  const lesson = LESSON_BY_N[concept.lesson];
  const term = GLOSSARY_BY_ID[concept.term];
  const label = c.who ? 'Angka ' + c.who : 'Angka Anda';
  return html`<${Sheet} title=${concept.title} onClose=${onClose} depth=${depth}>
    ${(close) => html`<div className="stack" style=${{ gap: 14 }}>
      <p className="concept-meaning">${concept.meaning}</p>
      ${yours ? html`<div className="yours"><span className="label">${label}</span>${yours}</div>` : null}
      ${calc
        ? html`<details className="calc" open=${!!c.openCalc}>
            <summary><${Icon} name="chevRight" />Lihat perhitungan</summary>
            <div className="calc-body">${calc}</div>
          </details>`
        : null}
      <div className="row wrap" style=${{ gap: 4 }}>
        ${lesson ? html`<button type="button" className="link-btn" onClick=${() => app.openLesson(String(lesson.n))}>Pelajari lebih lanjut: Sesi ${lesson.n}<${Icon} name="chevRight" /></button>` : null}
        ${term ? html`<button type="button" className="link-btn" style=${{ marginLeft: 12 }} onClick=${() => app.openKamus(term.id)}>Kamus</button>` : null}
      </div>
    </div>`}
  <//>`;
}
/* A lesson opened from another screen, in a sheet over it. Closing the sheet keeps the screen as it was. */
function LessonSheet({ id, onClose, depth }) {
  const l = id === 'harga' ? { title: 'Cara membaca harga saham' } : LESSON_BY_N[Number(id)];
  if (!l) return null;
  return html`<${Sheet} title=${l.title} onClose=${onClose} depth=${depth} width=${760}>${() => html`<${LessonView} id=${id} inSheet />`}<//>`;
}
function KamusSheet({ focus, onClose, depth }) {
  return html`<${Sheet} title="Kamus" onClose=${onClose} depth=${depth} width=${640}>${() => html`<${GlossaryView} focus=${focus} inSheet />`}<//>`;
}
/* The one-line task of a lesson's practice, on the screen that the practice opened, with the way back to the same place in the lesson. */
function TaskBanner() {
  const app = useApp();
  const id = app.route.query.tugas;
  const task = id ? practiceTask(app, id) : null;
  if (!task) return null;
  const l = id === 'harga' ? 'Panduan harga' : 'Sesi ' + id;
  return html`<div className="task-banner" role="note">
    <span className="badge">Tugas · ${l}</span>
    <span className="task-line">${task.line}</span>
    <a className="lk" href=${'#/belajar/' + id + '?ke=praktik'}><${Icon} name="chevLeft" />Kembali ke pelajaran</a>
  </div>`;
}
function stockRangeYours(id, c) {
  const s = MARKET.byCode[c.code];
  const q = PL.quote(s, MARKET, c.clock);
  if (id === 'harga-acuan') return html`<p>Harga acuan ${c.code} sekarang <b className="num">${F.rp(PL.referencePrice(s, MARKET, c.clock))}</b>.</p>`;
  if (id === 'rentang-hari') return q.before ? html`<p>Sesi hari ini belum dibuka.</p>` : html`<p>Hari ini ${c.code} bergerak dari <b className="num">${F.rp(q.low)}</b> sampai <b className="num">${F.rp(q.high)}</b>. Harga terakhir ${F.rp(q.price)}.</p>`;
  const last = PL.lastFinalIndex(MARKET, c.clock);
  let lo = Infinity;
  let hi = -Infinity;
  for (let d = Math.max(0, last - 250); d <= last; d++) {
    lo = Math.min(lo, s.low[d]);
    hi = Math.max(hi, s.high[d]);
  }
  if (!q.before) {
    lo = Math.min(lo, q.low);
    hi = Math.max(hi, q.high);
  }
  return html`<p>Dalam 52 minggu ${c.code} bergerak dari <b className="num">${F.rp(lo)}</b> sampai <b className="num">${F.rp(hi)}</b>. Harga terakhir ${F.rp(q.price)}, ${F.pct((q.price - lo) / (hi - lo), 0)} dari jarak terendah ke tertinggi.</p>`;
}

/* ---------- header pieces ---------- */
function ClassSwitch() {
  const app = useApp();
  const [anchor, setAnchor] = useState(null);
  const isStudent = app.state.role === 'student';
  const classes = isStudent ? STUDENT_CLASSES : LECTURER_CLASSES;
  const current = isStudent ? app.state.studentClass : app.state.lecturerClass;
  const info = classes[current];
  return html`<${Fragment}>
    <button type="button" className="class-switch" aria-haspopup="dialog" aria-expanded=${anchor ? 'true' : 'false'} aria-label=${'Kelas ' + info.short + ', ' + info.term + '. Ganti kelas'} onClick=${(e) => setAnchor(anchor ? null : e.currentTarget)}>
      <span className="cs-text">
        <span className="cs-course only-phone">${info.course}</span>
        <span className="cs-name"><span className="only-desk">${info.course} · </span>${info.name}</span>
        <span className="cs-term only-desk">${info.term}</span>
      </span>
      <${Icon} name="chevDown" />
    </button>
    ${anchor
      ? html`<${Menu} anchor=${anchor} onClose=${() => setAnchor(null)} label="Pilih kelas">
          <div className="menu-label">${isStudent ? 'Kelas Anda' : 'Kelas yang Anda ajar'}</div>
          ${Object.keys(classes).map(
            (id) => html`<button type="button" key=${id} className="menu-item" onClick=${() => {
              app.dispatch({ type: 'setClass', id });
              setAnchor(null);
              app.nav(isStudent ? '#/beranda' : '#/kelas');
            }}>
              <span className="mi-text"><span>${classes[id].short}</span><small>${isStudent ? classes[id].lecturer : (CLASSES[id] || []).length + ' mahasiswa'} · ${classes[id].term}</small></span>
              ${id === current ? html`<${Icon} name="check" className="check" />` : null}
            </button>`
          )}
        <//>`
      : null}
  <//>`;
}
function SimBadge() {
  const app = useApp();
  return html`<button type="button" className="chip-btn sim-chip" onClick=${() => app.openConcept('simulasi', {})} aria-label="Simulasi, harga tertunda sekitar 10 menit. Apa artinya?">
    <i aria-hidden="true"></i><span className="only-desk" aria-hidden="true">Simulasi · harga tertunda ±10 mnt</span><span className="only-phone" aria-hidden="true">Simulasi · ±10 mnt</span>
  </button>`;
}
function joinAddress(code) {
  return 'https://portolab.kampusanda.ac.id/gabung/' + code;
}
/* The join code in the top bar copies itself and shows the join address. */
function JoinChip() {
  const app = useApp();
  const [anchor, setAnchor] = useState(null);
  const info = app.lecturerClassInfo;
  const open = async (e) => {
    const target = e.currentTarget;
    if (anchor) {
      setAnchor(null);
      return;
    }
    setAnchor(target);
    try {
      await navigator.clipboard.writeText(info.code);
      app.toast('Kode ' + info.code + ' tersalin.');
    } catch (err) {
      app.toast('Browser ini menolak menyalin otomatis. Pilih kodenya lalu salin.');
    }
  };
  return html`<${Fragment}>
    <button type="button" className="chip-btn" aria-haspopup="dialog" aria-expanded=${anchor ? 'true' : 'false'} aria-label=${'Kode gabung ' + info.code.split('').join(' ') + '. Salin kode dan lihat alamat gabung'} onClick=${open}>
      <span aria-hidden="true">Kode gabung</span><b aria-hidden="true">${info.code}</b><${Icon} name="copy" />
    </button>
    ${anchor
      ? html`<${Menu} anchor=${anchor} onClose=${() => setAnchor(null)} label="Kode gabung" align="right">
          <div className="join-pop">
            <div className="row between wrap" style=${{ gap: 8 }}><div><div className="xs muted">Kode gabung ${info.short}</div><div className="code-big">${info.code}</div></div><${CopyButton} text=${info.code} label="Kode" /></div>
            <${CopyField} text=${joinAddress(info.code)} label="Alamat" />
            <p className="small ink2">Mahasiswa membuka alamat ini di perangkatnya, atau memasukkan kode setelah masuk. Setiap mahasiswa mulai dengan ${F.rp(PL.START_CASH)} uang virtual.</p>
            <p className="xs muted">Alamat ini contoh untuk mock. Di aplikasi, alamatnya mengikuti server kampus Anda.</p>
          </div>
        <//>`
      : null}
  <//>`;
}
/* The name in the top bar opens the profile, so it does what a chip that looks clickable promises. */
function NameChip() {
  const app = useApp();
  const [anchor, setAnchor] = useState(null);
  const me = PEOPLE[app.state.role];
  return html`<${Fragment}>
    <button type="button" className="chip-btn" aria-haspopup="dialog" aria-expanded=${anchor ? 'true' : 'false'} aria-label=${'Profil dan tema, ' + me.name} onClick=${(e) => setAnchor(anchor ? null : e.currentTarget)}>${me.name}</button>
    ${anchor ? html`<${ProfileMenu} anchor=${anchor} onClose=${() => setAnchor(null)} below />` : null}
  <//>`;
}
function ThemeSeg() {
  const app = useApp();
  return html`<${Seg} block label="Tema" value=${app.state.theme} onChange=${(t) => app.dispatch({ type: 'theme', theme: t })} options=${[{ value: 'system', label: 'Sistem' }, { value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }]} />`;
}
function ProfileMenu({ anchor, onClose, below }) {
  const app = useApp();
  const me = PEOPLE[app.state.role];
  return html`<${Menu} anchor=${anchor} onClose=${onClose} label="Profil" align=${app.desktop && !below ? 'left' : 'right'} above=${app.desktop && !below}>
    <div className="row" style=${{ padding: '10px 10px 12px', gap: 10 }}><span className=${'avatar' + (app.state.role === 'student' ? ' you' : '')}>${me.initials}</span><span className="ticker"><b style=${{ fontFamily: 'var(--f-ui)', fontWeight: 600, fontSize: 14 }}>${me.name}</b><span>${me.sub}</span></span></div>
    <div className="menu-label">Tema</div>
    <div style=${{ padding: '0 4px 6px' }}><${ThemeSeg} /></div>
  <//>`;
}
function AvatarButton() {
  const app = useApp();
  const [anchor, setAnchor] = useState(null);
  const me = PEOPLE[app.state.role];
  return html`<${Fragment}>
    <button type="button" className="avatar-btn" aria-label=${'Profil dan tema, ' + me.name} aria-haspopup="dialog" aria-expanded=${anchor ? 'true' : 'false'} onClick=${(e) => setAnchor(anchor ? null : e.currentTarget)}><span className="avatar">${me.initials}</span></button>
    ${anchor ? html`<${ProfileMenu} anchor=${anchor} onClose=${() => setAnchor(null)} />` : null}
  <//>`;
}

/* ---------- demo control, part of the mock only ---------- */
/* It sits at the end of the top bar on a desktop and at the end of the content on a phone, so it never covers the rail or the content. */
function DemoControl() {
  const app = useApp();
  const [anchor, setAnchor] = useState(null);
  const s = app.state;
  const close = () => setAnchor(null);
  const trading = PL.isTrading(app.phase);
  const canNext = s.clock.day + 1 < MARKET.T - 1;
  const act = (fn) => () => {
    fn();
    close();
  };
  return html`<${Fragment}>
    <button type="button" className="demo-btn" aria-haspopup="dialog" aria-expanded=${anchor ? 'true' : 'false'} onClick=${(e) => setAnchor(anchor ? null : e.currentTarget)}><${Icon} name="sliders" />Demo</button>
    ${anchor
      ? html`<${Menu} anchor=${anchor} onClose=${close} label="Kontrol demo" className="demo-panel" align="right">
          <div className="demo-title"><b>Kontrol demo</b><span>Hanya ada di mock ini, bukan bagian aplikasi.</span></div>
          <div className="menu-label">Peran</div>
          <${Seg} label="Peran" value=${s.role} onChange=${(r) => { app.dispatch({ type: 'setRole', role: r }); app.nav(r === 'student' ? '#/beranda' : '#/kelas'); close(); }} options=${[{ value: 'student', label: 'Mahasiswa' }, { value: 'lecturer', label: 'Dosen' }]} />
          <div className="menu-label">Waktu · ${F.dateLong(MARKET, s.clock.day)}, ${F.minuteOnly(s.clock.minute)} WIB · ${PL.sessionLabel(PL.sessionOf(MARKET, s.clock.day))} · ${trading ? 'sesi bursa berjalan' : 'bursa tutup'}</div>
          ${trading ? html`<button type="button" className="menu-item" onClick=${act(() => { app.dispatch({ type: 'closeMarket' }); app.toast('Sekarang ' + F.minuteOnly(CLOSED_MINUTE) + ' WIB. Bursa tutup, dan order baru menunggu sesi berikutnya.'); })}><${Icon} name="moon" /><span className="mi-text">Lompat ke malam ini<small>Order yang menunggu terisi atau kedaluwarsa</small></span></button>` : null}
          <button type="button" className="menu-item" disabled=${!canNext} onClick=${act(() => { app.dispatch({ type: 'nextDay' }); app.nav(s.role === 'student' ? '#/beranda' : '#/kelas'); })}><${Icon} name="sun" /><span className="mi-text">Lompat ke hari bursa berikutnya<small>${F.dateLong(MARKET, Math.min(MARKET.T - 1, s.clock.day + 1))}, ${F.minuteOnly(OPEN_MINUTE)} WIB</small></span></button>
          <div className="menu-label">Keadaan</div>
          <button type="button" className="menu-item" onClick=${act(() => { app.dispatch({ type: 'newStudent' }); app.nav('#/beranda'); })}><${Icon} name="plus" /><span className="mi-text">Mulai sebagai mahasiswa baru<small>Onboarding lalu portofolio kosong</small></span></button>
          <button type="button" className="menu-item" onClick=${act(() => app.dispatch({ type: 'onboarding', open: true }))}><${Icon} name="info" /><span className="mi-text">Buka onboarding saja</span></button>
          <button type="button" className="menu-item" onClick=${act(() => { app.dispatch({ type: 'restoreSample' }); app.nav('#/beranda'); app.toast('Data contoh dipulihkan.'); })}><${Icon} name="clock" /><span className="mi-text">Pulihkan data contoh<small>Portofolio Nadia, Kamis 12 November 10.24 WIB</small></span></button>
        <//>`
      : null}
  <//>`;
}

/* ---------- onboarding ---------- */
function Onboarding() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const ref = useDialog(() => app.dispatch({ type: 'onboarding', open: false }), true);
  const M = PL.measures(MARKET, PL.lastFinalIndex(MARKET, app.clock));
  const finish = () => {
    app.dispatch({ type: 'onboarding', open: false });
    app.nav('#/beranda');
  };
  const steps = [
    {
      title: 'Rp 100 juta untuk berlatih',
      lead: 'Bangun portofolio saham LQ45 selama semester ini. Uangnya virtual, harganya harga BEI yang tertunda sekitar 10 menit.',
      visual: html`<span className="eyebrow">Modal awal Anda</span>
        <div className="hero-value">${F.rp(PL.START_CASH)}</div>
        <div className="row wrap" style=${{ gap: 8 }}><span className="name-chip" style=${{ borderColor: 'transparent', background: 'var(--warn-soft)', color: 'var(--warn)', fontWeight: 600, gap: 6 }}><i style=${{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }}></i>Simulasi · harga tertunda ±10 mnt</span></div>
        <${Spark} values=${MARKET.ihsg.close.slice(MARKET.today0 - 60, MARKET.today0)} width=${300} height=${60} />
        <span className="xs muted">IHSG, 3 bulan terakhir</span>`,
    },
    {
      title: 'Lihat dampaknya sebelum membeli',
      lead: 'Tiket order menunjukkan perubahan beta, risiko, dan bobot sektor portofolio Anda sebelum Anda menekan Beli.',
      visual: html`<span className="eyebrow">Contoh: beli 10% di saham bank</span>
        <${ImpactRows} rows=${[
          { label: 'Beta', from: 0.65, to: 0.68, format: (v) => F.num(v) },
          { label: 'Risiko/bln', from: 0.0367, to: 0.0372, format: (v) => F.pct(v) },
          { label: 'Bobot Keuangan', from: 0.409, to: 0.502, format: (v) => F.pct(v, 1) },
        ]} />`,
    },
    {
      title: 'Teori di samping keputusan',
      lead: 'Pilih ? di samping istilah untuk arti singkat, angka Anda sendiri, dan cara menghitungnya ulang di spreadsheet.',
      visual: html`<div className="row" style=${{ gap: 4 }}><b>Beta</b><span className="q" style=${{ margin: 0 }}><span>?</span></span></div>
        <p className="small ink2">Seberapa kuat imbal hasil bergerak mengikuti IHSG.</p>
        <div className="yours"><span className="label">Angka Anda</span><p className="small">Beta portofolio Anda muncul di sini setelah order pertama.</p></div>
        <div className="formula" style=${{ paddingTop: 0 }}><div className="f-line">β = Cov(R<sub>i</sub>, R<sub>m</sub>) ÷ Var(R<sub>m</sub>)</div><div className="f-note">R<sub>f</sub> ${F.pct(M.rf, 2)} per bulan dari BI-Rate ${F.pct(PL.BI_RATE)}</div></div>`,
    },
  ];
  const s = steps[step];
  return html`<div className="onboard" ref=${ref} role="dialog" aria-modal="true" aria-labelledby="ob-h">
    <div className="onboard-inner">
      <div className="row between"><span className="brand"><${AppIcon} size=${44} />Portolab</span><button type="button" className="btn ghost" onClick=${finish}>Lewati</button></div>
      <div className="onboard-visual" key=${step}>${s.visual}</div>
      <div className="stack-sm" style=${{ gap: 10 }}>
        <div className="dots" aria-hidden="true">${steps.map((_, i) => html`<span key=${i} className=${i === step ? 'on' : ''}></span>`)}</div>
        <h1 id="ob-h">${s.title}</h1>
        <p className="lead">${s.lead}</p>
        <p className="sr-only" aria-live="polite">Langkah ${step + 1} dari ${steps.length}</p>
      </div>
      <div className="row" style=${{ gap: 10 }}>
        ${step > 0 ? html`<button type="button" className="btn outline lg" onClick=${() => setStep(step - 1)}>Kembali</button>` : null}
        <button type="button" className="btn primary lg grow" data-autofocus onClick=${() => (step < steps.length - 1 ? setStep(step + 1) : finish())}>${step < steps.length - 1 ? 'Lanjut' : 'Mulai'}</button>
      </div>
    </div>
  </div>`;
}

/* ---------- the app ---------- */
function App() {
  const [state, dispatch] = React.useReducer(reducer, null, loadState);
  const [route, nav] = useRoute();
  const desktop = useMedia('(min-width: 960px)');
  const wide = useMedia('(min-width: 1180px)');
  const xwide = useMedia('(min-width: 1320px)');
  const [mapAxis, setMapAxis] = useState('beta');
  const [sheets, setSheets] = useState([]);
  const drafts = useRef({});
  const [toasts, setToasts] = useState([]);
  const clock = state.clock;
  const phase = PL.phaseOf(MARKET, clock);
  const isStudent = state.role === 'student';
  const portfolio = isStudent ? state.portfolios[state.studentClass] : state.lecturerPortfolios[state.lecturerClass];
  const snap = useMemo(() => PL.snapshot(portfolio, MARKET, clock), [portfolio, clock]);

  useEffect(() => storageSet(STORE_KEY, JSON.stringify(Object.assign({}, state, { onboarding: false }))), [state]);
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const toast = useCallback((text) => {
    const id = Math.random();
    setToasts((t) => t.concat([{ id, text }]));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  const openConcept = useCallback((id, ctx) => setSheets((st) => st.concat([{ type: 'concept', id, ctx: ctx || {} }])), []);
  const openLesson = useCallback((id) => setSheets((st) => st.concat([{ type: 'lesson', id: String(id) }])), []);
  const openKamus = useCallback((focus) => setSheets((st) => st.concat([{ type: 'kamus', focus }])), []);
  const closeSheet = useCallback((depth) => setSheets((st) => st.slice(0, depth)), []);

  const nav0 = isStudent ? 'beranda' : 'kelas';
  let page = route.parts[0] || nav0;
  const studentOnly = { beranda: 1, aktivitas: 1, analisis: 1 };
  const lecturerOnly = { kelas: 1, mahasiswa: 1, portofolio: 1 };
  if ((isStudent && lecturerOnly[page]) || (!isStudent && studentOnly[page])) page = nav0;
  const navItems = isStudent ? STUDENT_NAV : LECTURER_NAV;
  const activeTab = TAB_OF[page] || page;

  const app = {
    state,
    dispatch,
    market: MARKET,
    clock,
    phase,
    classes: CLASSES,
    route,
    nav,
    desktop,
    wide,
    xwide,
    portfolio,
    snap,
    toast,
    openConcept,
    openLesson,
    openKamus,
    ownerKey: ownerOf(state),
    drafts: drafts.current,
    activityHref: isStudent ? '#/aktivitas' : '#/portofolio/aktivitas',
    mapAxis,
    setMapAxis,
    classInfo: STUDENT_CLASSES[state.studentClass],
    lecturerClassInfo: LECTURER_CLASSES[state.lecturerClass],
  };

  const topKey = route.parts.slice(0, 2).join('/');
  useEffect(() => {
    setSheets([]);
    if (!route.query.ke) window.scrollTo(0, 0);
  }, [topKey]);
  let title = TITLES[page] || 'Portolab';
  if (page === 'saham' && route.parts[1]) title = route.parts[1];
  if (page === 'belajar' && route.parts[1]) {
    const l = LESSON_BY_N[Number(route.parts[1])];
    title = l ? l.title : route.parts[1] === 'harga' ? 'Cara membaca harga saham' : 'Belajar';
  }
  if (page === 'mahasiswa' && route.parts[1]) {
    const st = (CLASSES[state.lecturerClass] || []).find((x) => x.id === route.parts[1]);
    if (st) title = st.name;
  }
  useEffect(() => {
    document.title = title + ' · Portolab';
  }, [title]);

  let content;
  if (page === 'beranda') content = html`<${HomeView} portfolio=${portfolio} snap=${snap} />`;
  else if (page === 'pasar') content = html`<${MarketView} key=${route.query.tampilan || 'daftar'} />`;
  else if (page === 'saham' && MARKET.byCode[route.parts[1]]) content = html`<${StockView} key=${route.parts[1]} code=${route.parts[1]} side=${route.parts[2]} />`;
  else if (page === 'aktivitas') content = html`<${ActivityView} sub=${route.parts[1]} />`;
  else if (page === 'analisis') content = html`<${AnalysisView} portfolio=${portfolio} snap=${snap} />`;
  else if (page === 'belajar' && route.parts[1]) content = html`<${LessonView} key=${route.parts[1]} id=${route.parts[1]} />`;
  else if (page === 'belajar') content = html`<${LearnView} />`;
  else if (page === 'kamus') content = html`<${GlossaryView} focus=${route.parts[1]} />`;
  else if (page === 'kelas') content = html`<${ClassView} />`;
  else if (page === 'mahasiswa' && route.parts[1]) content = html`<${StudentDetail} id=${route.parts[1]} tab=${route.parts[2]} />`;
  else if (page === 'mahasiswa') content = html`<${StudentsView} />`;
  else if (page === 'portofolio') content = html`<${LecturerPortfolioView} tab=${route.parts[1]} />`;
  else content = html`<${NotFound} />`;

  const hasTradebar = page === 'saham' && !wide;
  const me = PEOPLE[state.role];

  return html`<${AppCtx.Provider} value=${app}>
    <a className="skip" href="#main" onClick=${(e) => { e.preventDefault(); const m = document.getElementById('main'); if (m) m.focus(); }}>Lewati ke konten</a>
    <div className="shell">
      <aside className="rail" aria-label="Navigasi"><div className="rail-in">
        <span className="rail-logo" aria-hidden="true" title="Portolab"><${AppIcon} size=${36} /></span>
        <nav className="rail-nav" aria-label="Menu utama">
          ${navItems.map((n) => html`<a key=${n.key} href=${'#/' + n.key} aria-current=${activeTab === n.key ? 'page' : undefined}><${Icon} name=${n.icon} />${n.label}</a>`)}
        </nav>
        <div className="rail-foot"><${AvatarButton} /></div>
      </div></aside>
      <div className="app-body">
        <header className="topbar"><div className="topbar-in">
          <${ClassSwitch} />
          <span className="grow"></span>
          ${isStudent ? html`<span className="only-desk"><${NameChip} /></span>` : html`<span className="only-desk"><${JoinChip} /></span>`}
          <${SimBadge} />
          <span className="only-desk"><${DemoControl} /></span>
          <span className="only-phone"><${AvatarButton} /></span>
        </div></header>
        <main id="main" tabIndex="-1" className=${'main' + (hasTradebar ? ' has-tradebar' : '')} style=${{ outline: 'none' }}>
          <div className="page">
          <${TaskBanner} />
          ${content}
          </div>
          <div className="demo-foot only-phone"><${DemoControl} /></div>
        </main>
      </div>
      <nav className="tabbar" aria-label="Menu utama">
        ${navItems.map((n) => html`<a key=${n.key} className="tab" href=${'#/' + n.key} aria-current=${activeTab === n.key ? 'page' : undefined}><${Icon} name=${n.icon} />${n.label}</a>`)}
      </nav>
    </div>
    ${sheets.map((sh, i) =>
      sh.type === 'concept'
        ? html`<${ConceptSheet} key=${'s' + i + sh.id} id=${sh.id} ctx=${sh.ctx} depth=${i} onClose=${() => closeSheet(i)} />`
        : sh.type === 'lesson'
          ? html`<${LessonSheet} key=${'s' + i + sh.id} id=${sh.id} depth=${i} onClose=${() => closeSheet(i)} />`
          : html`<${KamusSheet} key=${'s' + i + 'kamus'} focus=${sh.focus} depth=${i} onClose=${() => closeSheet(i)} />`
    )}
    ${state.onboarding ? html`<${Onboarding} />` : null}
    <div className="toast-wrap" aria-live="polite">${toasts.map((t) => html`<div className="toast" key=${t.id}><${Icon} name="info" />${t.text}</div>`)}</div>
  <//>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
