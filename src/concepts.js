/* Portolab mock: the "?" concept cards, the glossary, and the catalogue of lessons. */
const P4 = (x) => F.num(x, 4);
const PC = (x, d = 2) => F.pct(x, d);
const V6 = (x) => F.num(x, 6);

function FLine({ children, result, note }) {
  return html`<div className=${'f-line' + (result ? ' result' : '')}>${children}</div>`;
}
function FNote({ children }) {
  return html`<div className="f-note">${children}</div>`;
}
function SheetHint({ children }) {
  return html`<div className="sheet-hint"><${Icon} name="table" /><div>${children}</div></div>`;
}
const R = (sub) => html`R<sub>${sub}</sub>`;

/* A table of the 60 monthly returns behind a measure, which a student can copy into a spreadsheet. */
function ReturnsTable({ columns, M, market }) {
  const [copied, setCopied] = useState('');
  const rows = M.months.map((day, t) => [F.month(market, day), ...columns.map((c) => c.values[t])]);
  const tsv = () => {
    const lines = [['Bulan', ...columns.map((c) => c.name)].join('\t')];
    for (const r of rows) lines.push([r[0], ...r.slice(1).map((v) => F.num(v, 6))].join('\t'));
    return lines.join('\n');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tsv());
      setCopied('Tabel tersalin. Tempel di sel A1 spreadsheet.');
    } catch (e) {
      setCopied('Browser ini menolak menyalin otomatis. Pilih tabel lalu salin dengan Ctrl+C.');
    }
  };
  return html`<details className="calc">
    <summary><${Icon} name="chevRight" />Data: ${M.n} imbal hasil bulanan</summary>
    <div className="calc-body">
      <div className="returns-table" tabIndex="0" aria-label="Tabel imbal hasil bulanan">
        <table>
          <thead><tr><th>Bulan</th>${columns.map((c) => html`<th key=${c.name}>${c.name}</th>`)}</tr></thead>
          <tbody>${rows.map((r, i) => html`<tr key=${i}><td>${r[0]}</td>${r.slice(1).map((v, j) => html`<td key=${j}>${F.pct(v, 2)}</td>`)}</tr>`)}</tbody>
        </table>
      </div>
      <div className="row wrap"><button type="button" className="btn outline" onClick=${copy}><${Icon} name="copy" />Salin tabel</button><span className="small muted" aria-live="polite">${copied}</span></div>
    </div>
  </details>`;
}

function whoOf(c) {
  return c.who ? { poss: c.who, label: 'Angka ' + c.who } : { poss: 'Anda', label: 'Angka Anda' };
}
function holdingTerms(c, fn) {
  return c.snap.positions.map((p) => fn(p, c.M.stock[p.code]));
}
const noPortfolio = (c) => html`<p>${whoOf(c).poss === 'Anda' ? 'Anda belum memiliki saham, jadi ukuran ini belum ada.' : 'Mahasiswa ini belum memiliki saham, jadi ukuran ini belum ada.'}</p>`;

const CONCEPTS = {
  simulasi: {
    title: 'Simulasi dan harga tertunda',
    meaning: 'Uang di Portolab virtual, dan harganya adalah harga Bursa Efek Indonesia yang tertunda sekitar 10 menit.',
    lesson: 6,
    term: 'harga-tertunda',
    yours: (c) => {
      const q = PL.quote(c.market.byCode.BBCA, c.market, c.clock);
      return html`<p>Harga yang Anda lihat sekarang dikutip pukul <b className="num">${F.time(c.market, q.day, q.minute)}</b>${q.final ? ' sebagai harga penutupan' : ''}. Order pasar terisi di harga tertunda itu, dan setiap harga menunjukkan waktunya di bawahnya.</p>`;
    },
  },
  nilai: {
    title: 'Nilai portofolio',
    meaning: 'Kas ditambah nilai semua saham di harga tertunda terakhir.',
    lesson: 10,
    term: 'nilai-portofolio',
    yours: (c) => html`<p>Kas <span className="num">${F.rp(c.snap.cash)}</span> ditambah saham <span className="num">${F.rp(c.snap.stockValue)}</span> sama dengan <b className="num">${F.rp(c.snap.total)}</b>.</p>`,
    calc: (c) => html`<div className="formula">
      ${holdingTerms(c, (p) => html`<${FLine} key=${p.code}>${p.code}  ${F.int(p.shares)} lembar × ${F.rp(p.price)} = ${F.rp(p.value)}<//>`)}
      <${FLine}>Kas = ${F.rp(c.snap.cash)}<//>
      <${FLine} result>Nilai = ${F.rp(c.snap.total)}<//>
    </div>`,
  },
  'hari-ini': {
    title: 'Perubahan hari ini',
    meaning: 'Selisih nilai portofolio sekarang dengan nilainya di penutupan hari bursa sebelumnya.',
    lesson: 10,
    term: 'imbal-hasil',
    yours: (c) => html`<p>Nilai di penutupan sebelumnya <span className="num">${F.rp(c.snap.total - c.snap.dayChange)}</span>, sekarang <span className="num">${F.rp(c.snap.total)}</span>, jadi berubah <${Delta} value=${c.snap.dayChange} kind="rp" /> atau <${Delta} value=${c.snap.dayChangePct} />.</p>`,
  },
  'sejak-awal': {
    title: 'Imbal hasil sejak awal',
    meaning: 'Perubahan nilai portofolio dibandingkan dengan modal awal Rp 100 juta, setelah biaya dan pajak.',
    lesson: 10,
    term: 'imbal-hasil',
    yours: (c) => {
      const h = c.history;
      const last = h[h.length - 1];
      return html`<p>Sejak ${F.date(c.market, c.snap.startDay)}, portofolio ${whoOf(c).poss} <${Delta} value=${c.snap.totalReturn} />. IHSG pada periode yang sama <${Delta} value=${last.ihsg} />.</p>`;
    },
    calc: (c) => html`<div className="formula">
      <${FLine}>Imbal hasil = Nilai sekarang ÷ Modal awal − 1<//>
      <${FLine}>= ${F.rp(c.snap.total)} ÷ ${F.rp(c.portfolio.startCash)} − 1<//>
      <${FLine} result>= ${F.pctSigned(c.snap.totalReturn)}<//>
    </div>`,
  },
  kas: {
    title: 'Kas',
    meaning: 'Uang yang belum dipakai untuk membeli saham, dan di Portolab kas tidak berbunga.',
    lesson: 9,
    term: 'kas',
    yours: (c) =>
      html`<p>Kas ${whoOf(c).poss} <b className="num">${F.rp(c.snap.cash)}</b>, yaitu ${F.pct(c.snap.cashWeight, 1)} dari portofolio.${c.snap.reservedCash > 0
        ? html` Sebanyak <span className="num">${F.rp(c.snap.reservedCash)}</span> disisihkan untuk order beli yang menunggu, jadi yang bisa dipakai <span className="num">${F.rp(c.snap.available)}</span>.`
        : null} Kas yang menganggur menurunkan alpha, karena CAPM tetap meminta tingkat bebas risiko untuknya.</p>`,
  },
  'harga-rata': {
    title: 'Harga rata-rata',
    meaning: 'Biaya per lembar yang sudah Anda bayar, termasuk biaya broker 0,15% saat membeli.',
    lesson: 6,
    term: 'harga-rata-rata',
    yours: (c) => {
      const p = c.snap.positions.find((x) => x.code === c.code);
      return p ? html`<p>Untuk ${c.code}: biaya ${F.rp(p.cost)} untuk ${F.int(p.shares)} lembar, jadi <b className="num">${F.rp(p.avgCost)}</b> per lembar.</p>` : html`<p>Anda belum memiliki ${c.code}.</p>`;
    },
  },
  'laba-rugi': {
    title: 'Laba atau rugi belum terealisasi',
    meaning: 'Selisih nilai saham sekarang dengan biaya belinya, yang baru menjadi nyata saat Anda menjual.',
    lesson: 6,
    term: 'laba-rugi',
    yours: (c) => {
      const p = c.snap.positions.find((x) => x.code === c.code) || c.snap.positions[0];
      if (!p) return noPortfolio(c);
      return html`<p>${p.code}: nilai <span className="num">${F.rp(p.value)}</span> dikurangi biaya <span className="num">${F.rp(p.cost)}</span> sama dengan <${Delta} value=${p.pl} kind="rp" />.</p>`;
    },
    calc: (c) => {
      const p = c.snap.positions.find((x) => x.code === c.code) || c.snap.positions[0];
      if (!p) return null;
      return html`<div className="formula">
        <${FLine}>L/R = (Harga − Harga rata-rata) × Lembar<//>
        <${FLine}>= (${F.rp(p.price)} − ${F.rp(p.avgCost)}) × ${F.int(p.shares)}<//>
        <${FLine} result>= ${F.rpSigned(p.pl)} (${F.pctSigned(p.plPct)})<//>
        <${FNote}>Biaya jual 0,15% dan PPh 0,1% baru dipotong saat Anda menjual.<//>
      </div>`;
    },
  },
  beta: {
    title: 'Beta',
    meaning: 'Seberapa kuat imbal hasil bergerak mengikuti IHSG. Beta 1 bergerak sejalan dengan pasar, di bawah 1 lebih tenang, dan di atas 1 lebih bergejolak.',
    lesson: 9,
    term: 'beta',
    yours: (c) => {
      if (c.code) {
        const s = c.M.stock[c.code];
        return html`<p>Beta ${c.code} <b className="num">${F.num(s.beta)}</b>. Jika IHSG naik 1% dalam sebulan, ${c.code} rata-rata ${s.beta >= 0 ? 'naik' : 'turun'} sekitar ${F.num(Math.abs(s.beta))}%.</p>`;
      }
      if (!c.P) return noPortfolio(c);
      return html`<p>Beta portofolio ${whoOf(c).poss} <b className="num">${F.num(c.P.beta)}</b>. Jika IHSG naik 1% dalam sebulan, portofolio ini rata-rata naik sekitar ${F.num(c.P.beta)}%.</p>`;
    },
    calc: (c) => {
      if (c.code) {
        const s = c.M.stock[c.code];
        return html`<div className="formula">
            <${FLine}>β = Cov(${R(c.code)}, ${R('IHSG')}) ÷ Var(${R('IHSG')})<//>
            <${FLine}>= ${V6(s.covM)} ÷ ${V6(c.M.varM)}<//>
            <${FLine} result>= ${F.num(s.beta, 4)}<//>
          </div>
          <${SheetHint}>Di spreadsheet: <code>=SLOPE(B2:B61;C2:C61)</code> dengan kolom B ${c.code} dan kolom C IHSG.<//>
          <${ReturnsTable} M=${c.M} market=${c.market} columns=${[{ name: c.code, values: c.M.R[c.code] }, { name: 'IHSG', values: c.M.Rm }]} />`;
      }
      if (!c.P) return null;
      return html`<div className="formula">
          <${FLine}>β${html`<sub>p</sub>`} = Σ w${html`<sub>i</sub>`} × β${html`<sub>i</sub>`}<//>
          ${holdingTerms(c, (p, s) => html`<${FLine} key=${p.code}>${p.code}  ${P4(p.weight)} × ${P4(s.beta)} = ${P4(p.weight * s.beta)}<//>`)}
          <${FLine}>Kas  ${P4(c.snap.cashWeight)} × 0 = 0<//>
          <${FLine} result>β${html`<sub>p</sub>`} = ${P4(c.P.beta)}<//>
          <${FNote}>Bobot dihitung dari nilai sekarang, termasuk kas. Kas tidak bergerak dengan IHSG, jadi betanya 0.<//>
        </div>
        <${SheetHint}>Di spreadsheet: <code>=SUMPRODUCT(bobot;beta)</code>, atau <code>=SLOPE</code> dari kolom imbal hasil portofolio terhadap IHSG.<//>`;
    },
  },
  risiko: {
    title: 'Risiko (simpangan baku)',
    meaning: 'Simpangan baku imbal hasil bulanan, yaitu seberapa jauh imbal hasil biasanya menyimpang dari rata-ratanya.',
    lesson: 10,
    term: 'simpangan-baku',
    yours: (c) => {
      if (c.code) {
        const s = c.M.stock[c.code];
        return html`<p>Risiko ${c.code} <b className="num">${PC(s.sd)}</b> per bulan. Dalam bulan yang biasa, imbal hasilnya sekitar ${PC(s.E)} ± ${PC(s.sd)}.</p>`;
      }
      if (!c.P) return noPortfolio(c);
      return html`<p>Risiko portofolio ${whoOf(c).poss} <b className="num">${PC(c.P.sd)}</b> per bulan. IHSG ${PC(c.M.sdM)}. Dalam bulan yang biasa, imbal hasilnya sekitar ${PC(c.P.E)} ± ${PC(c.P.sd)}.</p>`;
    },
    calc: (c) => {
      if (c.code) {
        const s = c.M.stock[c.code];
        return html`<div className="formula">
            <${FLine}>σ = √( Σ (R${html`<sub>t</sub>`} − R̄)² ÷ (n − 1) )<//>
            <${FLine}>= √${V6(s.var)}<//>
            <${FLine} result>= ${PC(s.sd, 3)}<//>
            <${FNote}>n = ${c.M.n} bulan. Pembaginya n − 1 karena data ini sampel.<//>
          </div>
          <${SheetHint}>Di spreadsheet: <code>=STDEV.S(B2:B61)</code><//>
          <${ReturnsTable} M=${c.M} market=${c.market} columns=${[{ name: c.code, values: c.M.R[c.code] }]} />`;
      }
      if (!c.P) return null;
      return html`<div className="formula">
          <${FLine}>σ${html`<sub>p</sub>`}² = Σ${html`<sub>i</sub>`} Σ${html`<sub>j</sub>`} w${html`<sub>i</sub>`} w${html`<sub>j</sub>`} Cov(R${html`<sub>i</sub>`}, R${html`<sub>j</sub>`}) = Σ w${html`<sub>i</sub>`} × Cov(R${html`<sub>i</sub>`}, R${html`<sub>p</sub>`})<//>
          ${holdingTerms(c, (p) => html`<${FLine} key=${p.code}>${p.code}  ${P4(p.weight)} × ${V6(c.P.covWithP[p.code])} = ${V6(p.weight * c.P.covWithP[p.code])}<//>`)}
          <${FLine}>σ${html`<sub>p</sub>`}² = ${V6(c.P.variance)}<//>
          <${FLine} result>σ${html`<sub>p</sub>`} = √${V6(c.P.variance)} = ${PC(c.P.sd, 3)}<//>
          <${FNote}>Kas tidak berisiko, jadi tidak muncul di penjumlahan ini.<//>
        </div>
        <${SheetHint}>Cara cepat: buat kolom imbal hasil portofolio tiap bulan (Σ bobot × imbal hasil saham), lalu <code>=STDEV.S(...)</code> pada kolom itu.<//>
        <${ReturnsTable} M=${c.M} market=${c.market} columns=${[...c.P.codes.map((code) => ({ name: code, values: c.M.R[code] })), { name: 'Portofolio', values: c.P.series }]} />`;
    },
  },
  'imbal-harapan': {
    title: 'Imbal hasil yang diharapkan',
    meaning: 'Rata-rata imbal hasil bulanan selama 60 bulan terakhir, yang Portolab pakai sebagai perkiraan imbal hasil ke depan.',
    lesson: 10,
    term: 'imbal-hasil-harapan',
    yours: (c) => {
      if (c.code) return html`<p>${c.code}: <b className="num">${PC(c.M.stock[c.code].E)}</b> per bulan. IHSG ${PC(c.M.Em)} per bulan.</p>`;
      if (!c.P) return noPortfolio(c);
      return html`<p>Portofolio ${whoOf(c).poss}: <b className="num">${PC(c.P.E)}</b> per bulan. IHSG ${PC(c.M.Em)} per bulan.</p>`;
    },
    calc: (c) => {
      if (c.code) {
        const s = c.M.stock[c.code];
        return html`<div className="formula">
            <${FLine}>E(R) = Σ R${html`<sub>t</sub>`} ÷ n<//>
            <${FLine} result>= ${PC(s.E, 3)}<//>
          </div>
          <${SheetHint}>Di spreadsheet: <code>=AVERAGE(B2:B61)</code><//>
          <${ReturnsTable} M=${c.M} market=${c.market} columns=${[{ name: c.code, values: c.M.R[c.code] }]} />`;
      }
      if (!c.P) return null;
      return html`<div className="formula">
          <${FLine}>E(R${html`<sub>p</sub>`}) = Σ w${html`<sub>i</sub>`} × E(R${html`<sub>i</sub>`})<//>
          ${holdingTerms(c, (p, s) => html`<${FLine} key=${p.code}>${p.code}  ${P4(p.weight)} × ${PC(s.E, 3)} = ${PC(p.weight * s.E, 3)}<//>`)}
          <${FLine}>Kas  ${P4(c.snap.cashWeight)} × 0% = 0%<//>
          <${FLine} result>E(R${html`<sub>p</sub>`}) = ${PC(c.P.E, 3)}<//>
        </div>
        <${SheetHint}>Di spreadsheet: <code>=SUMPRODUCT(bobot;imbal_hasil_harapan)</code><//>`;
    },
  },
  sharpe: {
    title: 'Rasio Sharpe',
    meaning: 'Imbal hasil di atas tingkat bebas risiko untuk setiap 1% risiko total.',
    lesson: 10,
    term: 'rasio-sharpe',
    yours: (c) => {
      if (!c.P) return noPortfolio(c);
      const m = (c.M.Em - c.M.rf) / c.M.sdM;
      return html`<p>Sharpe portofolio ${whoOf(c).poss} <b className="num">${F.num(c.P.sharpe)}</b>, sedangkan IHSG ${F.num(m)}. ${c.P.sharpe > m ? 'Setiap 1% risiko Anda dibayar lebih baik daripada pasar.' : 'Setiap 1% risiko dibayar lebih rendah daripada pasar.'}</p>`;
    },
    calc: (c) =>
      c.P
        ? html`<div className="formula">
            <${FLine}>Sharpe = (E(R${html`<sub>p</sub>`}) − R${html`<sub>f</sub>`}) ÷ σ${html`<sub>p</sub>`}<//>
            <${FLine}>= (${PC(c.P.E, 3)} − ${PC(c.M.rf, 3)}) ÷ ${PC(c.P.sd, 3)}<//>
            <${FLine} result>= ${F.num(c.P.sharpe, 4)}<//>
            <${FNote}>R${html`<sub>f</sub>`} = BI-Rate ${PC(PL.BI_RATE)} per tahun ÷ 12.<//>
          </div>`
        : null,
  },
  treynor: {
    title: 'Rasio Treynor',
    meaning: 'Imbal hasil di atas tingkat bebas risiko untuk setiap satu satuan beta.',
    lesson: 10,
    term: 'rasio-treynor',
    yours: (c) => {
      if (!c.P) return noPortfolio(c);
      const m = c.M.Em - c.M.rf;
      return html`<p>Treynor portofolio ${whoOf(c).poss} <b className="num">${PC(c.P.treynor, 3)}</b> per bulan, sedangkan IHSG ${PC(m, 3)}. Treynor hanya menghitung risiko pasar, jadi cocok untuk portofolio yang sudah terdiversifikasi.</p>`;
    },
    calc: (c) =>
      c.P
        ? html`<div className="formula">
            <${FLine}>Treynor = (E(R${html`<sub>p</sub>`}) − R${html`<sub>f</sub>`}) ÷ β${html`<sub>p</sub>`}<//>
            <${FLine}>= (${PC(c.P.E, 3)} − ${PC(c.M.rf, 3)}) ÷ ${P4(c.P.beta)}<//>
            <${FLine} result>= ${PC(c.P.treynor, 3)}<//>
          </div>`
        : null,
  },
  alpha: {
    title: 'Alpha Jensen',
    meaning: 'Selisih imbal hasil yang diharapkan dengan imbal hasil yang diminta CAPM untuk beta yang sama.',
    lesson: 9,
    term: 'alpha-jensen',
    yours: (c) => {
      if (c.code) {
        const s = c.M.stock[c.code];
        return html`<p>${c.code}: imbal hasil yang diharapkan ${PC(s.E)}, CAPM meminta ${PC(s.required)}, jadi alpha <${Delta} value=${s.alpha} />. Titiknya ${s.alpha >= 0 ? 'di atas' : 'di bawah'} garis pasar sekuritas.</p>`;
      }
      if (!c.P) return noPortfolio(c);
      return html`<p>Portofolio ${whoOf(c).poss}: imbal hasil yang diharapkan ${PC(c.P.E)}, CAPM meminta ${PC(c.P.required)} untuk beta ${F.num(c.P.beta)}, jadi alpha <${Delta} value=${c.P.alpha} /> per bulan.</p>`;
    },
    calc: (c) => {
      const t = c.code ? { E: c.M.stock[c.code].E, beta: c.M.stock[c.code].beta, required: c.M.stock[c.code].required, alpha: c.M.stock[c.code].alpha, n: c.code } : c.P && { E: c.P.E, beta: c.P.beta, required: c.P.required, alpha: c.P.alpha, n: 'p' };
      if (!t) return null;
      return html`<div className="formula">
        <${FLine}>α = E(R${html`<sub>${t.n}</sub>`}) − [R${html`<sub>f</sub>`} + β × (E(R${html`<sub>m</sub>`}) − R${html`<sub>f</sub>`})]<//>
        <${FLine}>= ${PC(t.E, 3)} − [${PC(c.M.rf, 3)} + ${P4(t.beta)} × (${PC(c.M.Em, 3)} − ${PC(c.M.rf, 3)})]<//>
        <${FLine}>= ${PC(t.E, 3)} − ${PC(t.required, 3)}<//>
        <${FLine} result>α = ${F.pctSigned(t.alpha, 3)}<//>
        ${!c.code ? html`<${FNote}>Sama dengan Σ bobot × alpha tiap saham, dikurangi bobot kas × R${html`<sub>f</sub>`}, karena kas tidak berbunga.<//>` : null}
      </div>`;
    },
  },
  korelasi: {
    title: 'Korelasi',
    meaning: 'Seberapa searah dua imbal hasil bergerak, dari −1 yang selalu berlawanan sampai 1 yang selalu searah.',
    lesson: 2,
    term: 'korelasi',
    yours: (c) => {
      if (c.code && c.code2) {
        const r = c.M.cov[c.code][c.code2] / (c.M.stock[c.code].sd * c.M.stock[c.code2].sd);
        return html`<p>Korelasi ${c.code} dan ${c.code2} <b className="num">${F.num(r)}</b>. ${r < 0.3 ? 'Keduanya sering bergerak sendiri-sendiri, jadi saling meredam risiko.' : r < 0.6 ? 'Keduanya cukup sering searah.' : 'Keduanya sangat sering searah, jadi manfaat diversifikasinya kecil.'}</p>`;
      }
      if (c.code) {
        if (!c.P) return html`<p>Korelasi dengan portofolio muncul setelah Anda memiliki saham.</p>`;
        const r = PL.correlationWithPortfolio(c.code, c.P, c.M);
        return html`<p>Korelasi ${c.code} dengan portofolio ${whoOf(c).poss} <b className="num">${F.num(r)}</b>. ${r < 0.5 ? 'Menambah saham ini cenderung menurunkan risiko relatif.' : 'Saham ini sering bergerak bersama portofolio Anda.'}</p>`;
      }
      return html`<p>Lihat peta korelasi di Analisis.</p>`;
    },
    calc: (c) => {
      if (!c.code) return null;
      if (c.code2) {
        const a = c.M.stock[c.code];
        const b = c.M.stock[c.code2];
        const cov = c.M.cov[c.code][c.code2];
        return html`<div className="formula">
            <${FLine}>ρ = Cov(${R(c.code)}, ${R(c.code2)}) ÷ (σ${html`<sub>${c.code}</sub>`} × σ${html`<sub>${c.code2}</sub>`})<//>
            <${FLine}>= ${V6(cov)} ÷ (${PC(a.sd, 3)} × ${PC(b.sd, 3)})<//>
            <${FLine} result>= ${F.num(cov / (a.sd * b.sd), 4)}<//>
          </div>
          <${SheetHint}>Di spreadsheet: <code>=CORREL(B2:B61;C2:C61)</code><//>
          <${ReturnsTable} M=${c.M} market=${c.market} columns=${[{ name: c.code, values: c.M.R[c.code] }, { name: c.code2, values: c.M.R[c.code2] }]} />`;
      }
      if (!c.P) return null;
      let cov = 0;
      for (const j of c.P.codes) cov += c.P.weights[j] * c.M.cov[c.code][j];
      return html`<div className="formula">
          <${FLine}>ρ = Cov(${R(c.code)}, ${R('p')}) ÷ (σ${html`<sub>${c.code}</sub>`} × σ${html`<sub>p</sub>`})<//>
          <${FLine}>= ${V6(cov)} ÷ (${PC(c.M.stock[c.code].sd, 3)} × ${PC(c.P.sd, 3)})<//>
          <${FLine} result>= ${F.num(cov / (c.M.stock[c.code].sd * c.P.sd), 4)}<//>
        </div>
        <${SheetHint}>Di spreadsheet: <code>=CORREL(B2:B61;C2:C61)</code> dengan kolom C imbal hasil portofolio.<//>
        <${ReturnsTable} M=${c.M} market=${c.market} columns=${[{ name: c.code, values: c.M.R[c.code] }, { name: 'Portofolio', values: c.P.series }]} />`;
    },
  },
  kontribusi: {
    title: 'Kontribusi risiko',
    meaning: 'Bagian dari varians portofolio yang berasal dari satu saham, dari bobotnya dan kovariansnya dengan portofolio.',
    lesson: 10,
    term: 'kontribusi-risiko',
    yours: (c) => {
      if (!c.P) return noPortfolio(c);
      const code = c.code || c.P.codes.slice().sort((a, b) => c.P.contrib[b] - c.P.contrib[a])[0];
      const p = c.snap.positions.find((x) => x.code === code);
      return html`<p>${code} berbobot ${PC(p.weight, 1)} tetapi menyumbang <b className="num">${PC(c.P.contrib[code], 1)}</b> risiko portofolio.</p>`;
    },
    calc: (c) => {
      if (!c.P) return null;
      return html`<div className="formula">
        <${FLine}>Kontribusi${html`<sub>i</sub>`} = w${html`<sub>i</sub>`} × Cov(R${html`<sub>i</sub>`}, R${html`<sub>p</sub>`}) ÷ σ${html`<sub>p</sub>`}²<//>
        ${holdingTerms(c, (p) => html`<${FLine} key=${p.code}>${p.code}  ${P4(p.weight)} × ${V6(c.P.covWithP[p.code])} ÷ ${V6(c.P.variance)} = ${PC(c.P.contrib[p.code], 1)}<//>`)}
        <${FNote}>Jumlah semua kontribusi 100%.<//>
      </div>`;
    },
  },
  diversifikasi: {
    title: 'Diversifikasi',
    meaning: 'Menggabungkan saham yang tidak selalu bergerak searah, sehingga risiko portofolio lebih kecil dari rata-rata risiko isinya.',
    lesson: 2,
    term: 'diversifikasi',
    yours: (c) =>
      c.P
        ? html`<p>Rata-rata tertimbang risiko isi portofolio ${whoOf(c).poss} ${PC(c.P.avgRisk)}, tetapi risiko portofolionya hanya <b className="num">${PC(c.P.sd)}</b>. Selisih ${F.num((c.P.avgRisk - c.P.sd) * 100)} poin itu adalah hasil diversifikasi.</p>`
        : noPortfolio(c),
    calc: (c) =>
      c.P
        ? html`<div className="formula">
            <${FLine}>Rata-rata tertimbang risiko = Σ w${html`<sub>i</sub>`} × σ${html`<sub>i</sub>`}<//>
            ${holdingTerms(c, (p, s) => html`<${FLine} key=${p.code}>${p.code}  ${P4(p.weight)} × ${PC(s.sd, 3)} = ${PC(p.weight * s.sd, 3)}<//>`)}
            <${FLine}>= ${PC(c.P.avgRisk, 3)}<//>
            <${FLine} result>σ${html`<sub>p</sub>`} = ${PC(c.P.sd, 3)}, lebih kecil karena korelasinya di bawah 1<//>
          </div>`
        : null,
  },
  sml: {
    title: 'Garis pasar sekuritas (SML)',
    meaning: 'Garis yang menunjukkan imbal hasil yang diminta CAPM untuk setiap tingkat beta.',
    lesson: 9,
    term: 'sml',
    yours: (c) =>
      c.P
        ? html`<p>Untuk beta ${F.num(c.P.beta)}, garis ini meminta ${PC(c.P.required)} per bulan. Portofolio ${whoOf(c).poss} diharapkan ${PC(c.P.E)}, jadi titiknya ${c.P.alpha >= 0 ? 'di atas' : 'di bawah'} garis sejauh ${F.num(Math.abs(c.P.alpha) * 100, 3)} poin.</p>`
        : html`<p>Garis ini dimulai di R<sub>f</sub> ${PC(c.M.rf)} pada beta 0 dan melewati IHSG di beta 1.</p>`,
    calc: (c) => html`<div className="formula">
      <${FLine}>E(R) = R${html`<sub>f</sub>`} + β × (E(R${html`<sub>m</sub>`}) − R${html`<sub>f</sub>`})<//>
      <${FLine} result>= ${PC(c.M.rf, 3)} + β × ${PC(c.M.Em - c.M.rf, 3)}<//>
      <${FNote}>E(R${html`<sub>m</sub>`}) adalah rata-rata ${c.M.n} imbal hasil bulanan IHSG. Selisihnya dengan R${html`<sub>f</sub>`} disebut premi risiko pasar.<//>
    </div>`,
  },
  'bobot-sektor': {
    title: 'Bobot sektor',
    meaning: 'Bagian nilai portofolio yang berada di satu sektor, karena saham satu sektor cenderung bergerak bersama.',
    lesson: 2,
    term: 'bobot',
    yours: (c) => {
      const s = c.snap.sectors[0];
      if (!s) return noPortfolio(c);
      return html`<p>Sektor terbesar ${whoOf(c).poss}: ${s.name}, <b className="num">${PC(s.weight, 1)}</b> dari portofolio.</p>`;
    },
  },
  'rentang-hari': {
    title: 'Rentang hari ini',
    meaning: 'Harga terendah dan tertinggi hari ini sampai harga tertunda terakhir.',
    lesson: 6,
    term: 'harga-tertunda',
  },
  'rentang-52': {
    title: 'Rentang 52 minggu',
    meaning: 'Harga terendah dan tertinggi dalam 52 minggu terakhir, yang menunjukkan di mana harga sekarang berada dalam setahun.',
    lesson: 6,
    term: 'harga-tertunda',
  },
  lot: {
    title: 'Lot',
    meaning: 'Satu lot berisi 100 lembar saham, dan order di Bursa Efek Indonesia selalu dalam lot.',
    lesson: 6,
    term: 'lot',
    yours: (c) => {
      if (!c.code) return null;
      const q = PL.quote(c.market.byCode[c.code], c.market, c.clock);
      return html`<p>1 lot ${c.code} di ${F.rp(q.price)} bernilai <b className="num">${F.rp(q.price * 100)}</b> sebelum biaya.</p>`;
    },
  },
  fraksi: {
    title: 'Fraksi harga',
    meaning: 'Langkah terkecil perubahan harga, yang besarnya bergantung pada tingkat harga saham.',
    lesson: 6,
    term: 'fraksi-harga',
    yours: (c) => {
      const q = c.code ? PL.quote(c.market.byCode[c.code], c.market, c.clock) : null;
      return html`<div className="stack-sm">
        ${q ? html`<p>${c.code} di ${F.rp(q.price)} bergerak per <b className="num">${F.rp(PL.tickSize(q.price))}</b>.</p>` : null}
        <${TickTable} highlight=${q ? q.price : null} />
      </div>`;
    },
  },
  'ara-arb': {
    title: 'ARA dan ARB',
    meaning: 'Auto rejection atas (ARA) dan bawah (ARB) adalah batas harga order dalam satu hari, dihitung dari harga acuan.',
    lesson: 6,
    term: 'ara',
    yours: (c) => {
      const s = c.code ? c.market.byCode[c.code] : null;
      const ref = s ? PL.referencePrice(s, c.market, c.clock) : null;
      const band = ref ? PL.autoRejection(ref) : null;
      return html`<div className="stack-sm">
        ${band
          ? html`<p>${c.code}: harga acuan ${F.rp(ref)}, jadi ARA <b className="num">${F.rp(band.ara)}</b> (+${F.pct(band.up, 0)}) dan ARB <b className="num">${F.rp(band.arb)}</b> (−${F.pct(band.down, 0)}). Batas dibulatkan ke fraksi harga ke arah dalam.</p>`
          : null}
        <${BandTable} />
        <p className="small muted">Ini asumsi mock. Persentase ARA dan ARB berubah dari waktu ke waktu sesuai keputusan BEI, dan Portolab akan menyimpannya sebagai data bertanggal.</p>
      </div>`;
    },
  },
  biaya: {
    title: 'Biaya dan pajak',
    meaning: 'Setiap transaksi dikenai biaya broker, dan setiap penjualan juga dikenai PPh final 0,1% dari nilainya.',
    lesson: 6,
    term: 'biaya-broker',
    yours: () => html`<div className="breakdown">
      <div className="b-row"><span className="k">Beli</span><span className="v">biaya broker ${F.pct(PL.FEES.buy)}</span></div>
      <div className="b-row"><span className="k">Jual</span><span className="v">biaya broker ${F.pct(PL.FEES.sell)} + PPh ${F.pct(PL.FEES.tax, 1)}</span></div>
      <p className="small muted">Tarif broker di mock ini 0,15% untuk semua mahasiswa. Biaya dibulatkan ke rupiah terdekat.</p>
    </div>`,
  },
  'order-tipe': {
    title: 'Order pasar dan order limit',
    meaning: 'Order pasar terisi di harga tertunda terakhir, sedangkan order limit hanya terisi di harga limit atau yang lebih baik.',
    lesson: 6,
    term: 'order-limit',
    yours: () => html`<p>Kedua jenis order berlaku satu hari bursa. Order yang belum terisi saat Sesi II ditutup menjadi kedaluwarsa, dan kas yang disisihkan kembali.</p>`,
  },
  sesi: {
    title: 'Sesi perdagangan',
    meaning: 'Bursa Efek Indonesia berdagang dalam dua sesi setiap hari bursa, dan order di luar sesi menunggu sesi berikutnya.',
    lesson: 6,
    term: 'sesi',
    yours: () => html`<${SessionTimeline} />`,
  },
  'harga-acuan': {
    title: 'Harga acuan',
    meaning: 'Harga penutupan hari bursa sebelumnya, yang menjadi dasar batas ARA dan ARB hari ini.',
    lesson: 6,
    term: 'harga-acuan',
  },
  ihsg: {
    title: 'IHSG',
    meaning: 'Indeks Harga Saham Gabungan, ukuran pergerakan semua saham di BEI, yang Portolab pakai sebagai portofolio pasar.',
    lesson: 4,
    term: 'ihsg',
    yours: (c) => {
      const q = PL.quote(c.market.ihsg, c.market, c.clock);
      return html`<p>IHSG <b className="num">${F.num(q.price)}</b>, <${Delta} value=${q.price / q.prevClose - 1} /> dari penutupan sebelumnya. Rata-rata imbal hasil bulanannya ${PC(c.M.Em)} dengan risiko ${PC(c.M.sdM)}.</p>`;
    },
  },
  rf: {
    title: 'Tingkat bebas risiko',
    meaning: 'Imbal hasil aset tanpa risiko. Portolab memakai BI-Rate yang dibagi 12 menjadi tingkat per bulan.',
    lesson: 9,
    term: 'bi-rate',
    yours: (c) => html`<p>BI-Rate <b className="num">${PC(PL.BI_RATE)}</b> per tahun ÷ 12 = <b className="num">${PC(c.M.rf, 3)}</b> per bulan.</p>`,
  },
};

function TickTable({ highlight }) {
  return html`<div className="table-wrap"><table className="data">
    <thead><tr><th>Harga saham</th><th className="r">Fraksi</th></tr></thead>
    <tbody>
      ${PL.TICK_TABLE.map((row) => {
        const on = highlight != null && highlight >= row.from && (row.to == null || highlight < row.to);
        const label = row.to == null ? F.rp(row.from) + ' ke atas' : row.from === 0 ? 'di bawah ' + F.rp(row.to) : F.rp(row.from) + ' sampai di bawah ' + F.rp(row.to);
        return html`<tr key=${row.from} style=${on ? { background: 'var(--accent-soft)' } : null}><td>${label}</td><td className="r num">${F.rp(row.tick)}</td></tr>`;
      })}
    </tbody>
  </table></div>`;
}
function BandTable() {
  return html`<div className="table-wrap"><table className="data">
    <thead><tr><th>Harga acuan</th><th className="r">ARA</th><th className="r">ARB</th></tr></thead>
    <tbody>
      <tr><td>di bawah ${F.rp(200)}</td><td className="r num">+35%</td><td className="r num">−15%</td></tr>
      <tr><td>${F.rp(200)} sampai ${F.rp(5000)}</td><td className="r num">+35%</td><td className="r num">−15%</td></tr>
      <tr><td>di atas ${F.rp(5000)}</td><td className="r num">+25%</td><td className="r num">−15%</td></tr>
    </tbody>
  </table></div>`;
}
function SessionTimeline() {
  const rows = [
    { label: 'Senin sampai Kamis', segs: [[525, 540, 'pre'], [540, 720, 'Sesi I'], [810, 950, 'Sesi II'], [950, 960, 'pre']] },
    { label: 'Jumat', segs: [[525, 540, 'pre'], [540, 690, 'Sesi I'], [840, 950, 'Sesi II'], [950, 960, 'pre']] },
  ];
  const a = 510;
  const b = 975;
  const pos = (m) => ((m - a) / (b - a)) * 100;
  return html`<div className="timeline" role="img" aria-label="Sesi I Senin sampai Kamis pukul 09.00 sampai 12.00, Jumat 09.00 sampai 11.30. Sesi II Senin sampai Kamis pukul 13.30 sampai 15.50, Jumat 14.00 sampai 15.50. Pra-pembukaan mulai 08.45 dan pra-penutupan sampai 16.00.">
    ${rows.map(
      (r) => html`<div className="tl-row" key=${r.label}>
        <span className="muted">${r.label}</span>
        <div className="tl-track">
          ${r.segs.map((s, i) => html`<div key=${i} className=${'tl-seg' + (s[2] === 'pre' ? ' pre' : '')} style=${{ left: pos(s[0]) + '%', width: pos(s[1]) - pos(s[0]) + '%' }}>${s[2] === 'pre' ? '' : s[2]}</div>`)}
        </div>
      </div>`
    )}
    <div className="tl-axis"><span></span><div>${[540, 720, 810, 950].map((m) => html`<span key=${m} style=${{ left: pos(m) + '%' }}>${F.minuteOnly(m)}</span>`)}</div></div>
    <p className="xs muted">Warna muda adalah pra-pembukaan (08.45) dan pra-penutupan (sampai 16.00). Jam dalam WIB.</p>
  </div>`;
}

/* ---------- glossary ---------- */
const GLOSSARY = [
  ['alpha-jensen', 'Alpha Jensen', 'Selisih imbal hasil yang diharapkan dengan imbal hasil yang diminta CAPM. Positif berarti di atas garis pasar sekuritas.', 9, 'alpha'],
  ['ara', 'ARA (auto rejection atas)', 'Batas atas harga order dalam satu hari, dihitung dari harga acuan. Order di atasnya ditolak bursa.', 6, 'ara-arb'],
  ['arb', 'ARB (auto rejection bawah)', 'Batas bawah harga order dalam satu hari, dihitung dari harga acuan. Order di bawahnya ditolak bursa.', 6, 'ara-arb'],
  ['beta', 'Beta', 'Kepekaan imbal hasil saham atau portofolio terhadap imbal hasil pasar. Dihitung sebagai kovarians dengan IHSG dibagi varians IHSG.', 9, 'beta'],
  ['bi-rate', 'BI-Rate', 'Suku bunga kebijakan Bank Indonesia. Portolab memakainya sebagai tingkat bebas risiko, dibagi 12 per bulan.', 9, 'rf'],
  ['biaya-broker', 'Biaya broker', 'Komisi perusahaan efek untuk setiap transaksi. Di mock ini 0,15% untuk beli dan jual.', 6, 'biaya'],
  ['bobot', 'Bobot', 'Bagian satu aset dari total nilai portofolio, termasuk kas.', 10, 'bobot-sektor'],
  ['capm', 'CAPM', 'Capital Asset Pricing Model. Imbal hasil yang pantas sama dengan tingkat bebas risiko ditambah beta kali premi risiko pasar.', 9, 'sml'],
  ['diversifikasi', 'Diversifikasi', 'Menyebar dana ke aset yang tidak selalu bergerak searah, sehingga risiko total turun.', 2, 'diversifikasi'],
  ['fraksi-harga', 'Fraksi harga', 'Satuan perubahan harga terkecil, yang bergantung pada tingkat harga saham.', 6, 'fraksi'],
  ['harga-acuan', 'Harga acuan', 'Harga penutupan hari bursa sebelumnya. Dasar perhitungan ARA dan ARB.', 6, 'harga-acuan'],
  ['harga-rata-rata', 'Harga rata-rata', 'Biaya per lembar yang sudah dibayar, termasuk biaya broker pembelian.', 6, 'harga-rata'],
  ['harga-tertunda', 'Harga tertunda', 'Harga bursa yang sampai ke Portolab sekitar 10 menit setelah terjadi. Order terisi di harga ini.', 6, 'simulasi'],
  ['ihsg', 'IHSG', 'Indeks Harga Saham Gabungan. Portolab memakainya sebagai portofolio pasar untuk beta dan CAPM.', 4, 'ihsg'],
  ['imbal-hasil', 'Imbal hasil', 'Perubahan nilai dibagi nilai awal. Di Portolab dihitung per bulan dari harga penutupan akhir bulan, tanpa dividen.', 10, 'sejak-awal'],
  ['imbal-hasil-harapan', 'Imbal hasil yang diharapkan', 'Rata-rata imbal hasil bulanan selama 60 bulan terakhir.', 10, 'imbal-harapan'],
  ['kas', 'Kas', 'Uang tunai di portofolio. Di Portolab kas tidak berbunga, jadi imbal hasil dan betanya 0.', 9, 'kas'],
  ['kedaluwarsa', 'Kedaluwarsa', 'Status order yang belum terisi saat hari bursanya berakhir. Kas atau saham yang disisihkan kembali.', 6, 'order-tipe'],
  ['kontribusi-risiko', 'Kontribusi risiko', 'Bagian varians portofolio yang berasal dari satu saham. Bisa jauh lebih besar dari bobotnya.', 10, 'kontribusi'],
  ['korelasi', 'Korelasi', 'Ukuran seberapa searah dua imbal hasil bergerak, dari −1 sampai 1. Kovarians dibagi hasil kali kedua simpangan baku.', 2, 'korelasi'],
  ['kovarians', 'Kovarians', 'Rata-rata hasil kali penyimpangan dua imbal hasil dari rata-ratanya. Positif berarti cenderung searah.', 10, 'risiko'],
  ['laba-rugi', 'Laba atau rugi belum terealisasi', 'Selisih nilai saham sekarang dengan biaya belinya, sebelum dijual.', 6, 'laba-rugi'],
  ['lot', 'Lot', 'Satuan perdagangan saham di BEI. 1 lot = 100 lembar.', 6, 'lot'],
  ['lq45', 'LQ45', 'Indeks 45 saham yang paling likuid dan berkapitalisasi besar di BEI. Mahasiswa berlatih dengan saham LQ45.', 4, 'ihsg'],
  ['nilai-portofolio', 'Nilai portofolio', 'Kas ditambah nilai semua saham di harga terakhir.', 10, 'nilai'],
  ['order-limit', 'Order limit', 'Order yang hanya terisi di harga limit atau lebih baik. Berlaku satu hari bursa.', 6, 'order-tipe'],
  ['order-pasar', 'Order pasar', 'Order yang terisi di harga tertunda terakhir selama sesi berjalan.', 6, 'order-tipe'],
  ['pph-final', 'PPh final penjualan saham', 'Pajak 0,1% dari nilai penjualan saham, dipotong langsung saat transaksi.', 6, 'biaya'],
  ['premi-risiko-pasar', 'Premi risiko pasar', 'Selisih imbal hasil pasar yang diharapkan dengan tingkat bebas risiko. Kemiringan garis pasar sekuritas.', 9, 'sml'],
  ['rasio-sharpe', 'Rasio Sharpe', 'Imbal hasil di atas tingkat bebas risiko dibagi simpangan baku. Imbalan per satuan risiko total.', 10, 'sharpe'],
  ['rasio-treynor', 'Rasio Treynor', 'Imbal hasil di atas tingkat bebas risiko dibagi beta. Imbalan per satuan risiko pasar.', 10, 'treynor'],
  ['risiko-sistematis', 'Risiko sistematis', 'Risiko pasar yang tidak hilang dengan diversifikasi. Diukur dengan beta.', 9, 'beta'],
  ['risiko-tidak-sistematis', 'Risiko tidak sistematis', 'Risiko khas satu perusahaan yang bisa dikurangi dengan diversifikasi.', 2, 'diversifikasi'],
  ['sesi', 'Sesi perdagangan', 'Waktu perdagangan berkelanjutan di BEI. Sesi I pagi dan Sesi II siang, dengan jam yang lebih pendek pada Jumat.', 6, 'sesi'],
  ['simpangan-baku', 'Simpangan baku', 'Akar varians. Ukuran risiko total dalam satuan yang sama dengan imbal hasil.', 10, 'risiko'],
  ['sml', 'Garis pasar sekuritas (SML)', 'Garis CAPM yang menghubungkan beta dengan imbal hasil yang diminta.', 9, 'sml'],
  ['varians', 'Varians', 'Rata-rata kuadrat penyimpangan imbal hasil dari rata-ratanya, dengan pembagi n − 1 untuk sampel.', 10, 'risiko'],
  ['volatilitas', 'Volatilitas', 'Sebutan lain untuk simpangan baku imbal hasil. Di Portolab per bulan.', 10, 'risiko'],
].map(([id, term, def, session, concept]) => ({ id, term, def, session, concept }));
const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));

/* ---------- lessons ---------- */
const LESSONS = [
  { n: 1, title: 'Konsep dasar manajemen portofolio', summary: 'Tujuan, batasan, dan proses mengelola portofolio.', practice: 'beranda', full: false,
    ideas: ['Manajemen portofolio dimulai dari tujuan investor dan batasannya, seperti jangka waktu, kebutuhan dana, dan toleransi risiko.', 'Prosesnya berulang: merencanakan, memilih aset, memantau, lalu menyesuaikan.', 'Di Portolab Anda menjalankan proses ini selama satu semester dengan uang virtual.'], terms: ['bobot', 'diversifikasi'] },
  { n: 2, title: 'Teori portofolio', summary: 'Mengapa gabungan saham bisa lebih aman daripada isinya.', practice: 'analisis', full: true, terms: ['diversifikasi', 'korelasi', 'simpangan-baku'] },
  { n: 3, title: 'Nilai waktu uang', summary: 'Rupiah hari ini lebih berharga daripada rupiah tahun depan.', practice: null, full: false,
    ideas: ['Uang hari ini bisa diinvestasikan, jadi nilainya lebih besar daripada jumlah yang sama di masa depan.', 'Nilai masa depan = nilai sekarang × (1 + r)ⁿ, dan nilai sekarang membalik rumus itu.', 'Tingkat bunga yang dipakai untuk mendiskonto mencerminkan risiko arus kas.'], terms: ['bi-rate', 'imbal-hasil'] },
  { n: 4, title: 'Pasar modal', summary: 'Pelaku pasar modal Indonesia dan peran BEI, KSEI, dan OJK.', practice: 'pasar', full: false,
    ideas: ['BEI menyelenggarakan perdagangan, KSEI menyimpan efek, dan OJK mengawasi.', 'Investor bertransaksi lewat perusahaan efek yang menjadi anggota bursa.', 'IHSG dan LQ45 merangkum pergerakan harga saham di BEI.'], terms: ['ihsg', 'lq45'] },
  { n: 5, title: 'Instrumen pasar modal', summary: 'Saham, obligasi, reksa dana, dan derivatif, serta risikonya.', practice: 'pasar', practiceNote: 'Saham saja', full: false,
    ideas: ['Saham memberi hak atas laba dan pertumbuhan perusahaan, dengan risiko harga yang tinggi.', 'Obligasi membayar kupon tetap, dan harganya turun saat suku bunga naik.', 'Reksa dana dan derivatif dibahas di sesi 11 sampai 14. Di simulasi ini Anda berlatih dengan saham.'], terms: ['lq45', 'imbal-hasil'] },
  { n: 6, title: 'Mekanisme perdagangan', summary: 'Lot, fraksi harga, ARA dan ARB, sesi, dan biaya transaksi.', practice: 'pasar', full: true, terms: ['lot', 'fraksi-harga', 'ara'] },
  { n: 8, exam: true, title: 'Ujian tengah semester', summary: 'Mencakup sesi 1 sampai 6.' },
  { n: 9, title: 'CAPM dan garis pasar sekuritas', summary: 'Imbal hasil yang pantas untuk risiko pasar yang Anda tanggung.', practice: 'analisis', full: true, terms: ['beta', 'premi-risiko-pasar', 'alpha-jensen'] },
  { n: 10, title: 'Imbal hasil dan risiko portofolio', summary: 'Rata-rata tertimbang, kovarians, dan ukuran kinerja.', practice: 'analisis', full: true, terms: ['kovarians', 'rasio-sharpe', 'rasio-treynor'] },
  { n: 11, title: 'Forward dan futures', summary: 'Kontrak untuk membeli atau menjual di masa depan dengan harga hari ini.', practice: null, cannot: true, full: false,
    ideas: ['Forward adalah kontrak pribadi, sedangkan futures distandarkan dan diperdagangkan di bursa.', 'Keduanya dipakai untuk lindung nilai atau spekulasi atas harga di masa depan.', 'Futures diselesaikan setiap hari lewat marking to market.'], terms: [] },
  { n: 12, title: 'Reksa dana', summary: 'Dana bersama yang dikelola manajer investasi.', practice: null, cannot: true, full: false,
    ideas: ['Reksa dana menghimpun dana banyak investor dan menempatkannya dalam portofolio efek.', 'Nilai aktiva bersih per unit menunjukkan nilai satu unit penyertaan.', 'Jenisnya antara lain pasar uang, pendapatan tetap, saham, dan campuran.'], terms: ['diversifikasi'] },
  { n: 13, title: 'Opsi', summary: 'Hak, bukan kewajiban, untuk membeli atau menjual pada harga tertentu.', practice: null, cannot: true, full: false,
    ideas: ['Opsi beli (call) memberi hak membeli, dan opsi jual (put) memberi hak menjual pada harga pelaksanaan.', 'Pembeli opsi membayar premi, dan kerugiannya terbatas pada premi itu.', 'Nilai opsi bergantung pada harga saham, harga pelaksanaan, waktu, volatilitas, dan suku bunga.'], terms: ['volatilitas'] },
  { n: 14, title: 'Obligasi', summary: 'Surat utang dengan kupon dan jatuh tempo.', practice: null, cannot: true, full: false,
    ideas: ['Harga obligasi adalah nilai sekarang dari kupon dan pokoknya.', 'Saat suku bunga pasar naik, harga obligasi turun.', 'Durasi mengukur kepekaan harga obligasi terhadap perubahan suku bunga.'], terms: ['bi-rate'] },
  { n: 16, exam: true, title: 'Ujian akhir semester', summary: 'Mencakup sesi 9 sampai 14.' },
];
const LESSON_BY_N = Object.fromEntries(LESSONS.map((l) => [l.n, l]));
