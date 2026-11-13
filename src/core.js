/* Portolab mock: data, IDX rules, measures, and the portfolio engine. Pure functions, no DOM. */
(function (G) {
  'use strict';
  const PL = (G.PL = G.PL || {});

  /* ---------- seeded randomness ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function hashText(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  PL.mulberry32 = mulberry32;
  PL.gauss = gauss;
  PL.hashText = hashText;

  /* ---------- trading calendar of IDX ---------- */
  const HOLIDAYS = new Set(
    (
      '2021-10-20 2021-12-24 ' +
      '2022-02-01 2022-02-28 2022-03-03 2022-04-15 2022-05-02 2022-05-03 2022-05-04 2022-05-05 2022-05-06 2022-05-16 2022-05-26 2022-06-01 2022-08-17 2022-12-26 ' +
      '2023-01-23 2023-03-22 2023-03-23 2023-04-07 2023-04-19 2023-04-20 2023-04-21 2023-04-24 2023-04-25 2023-05-01 2023-05-18 2023-06-01 2023-06-02 2023-06-29 2023-06-30 2023-07-19 2023-08-17 2023-09-28 2023-12-25 2023-12-26 ' +
      '2024-01-01 2024-02-08 2024-02-09 2024-02-14 2024-03-11 2024-03-12 2024-03-29 2024-04-08 2024-04-09 2024-04-10 2024-04-11 2024-04-12 2024-04-15 2024-05-01 2024-05-09 2024-05-10 2024-05-23 2024-05-24 2024-06-17 2024-06-18 2024-09-16 2024-12-25 2024-12-26 ' +
      '2025-01-01 2025-01-27 2025-01-28 2025-01-29 2025-03-28 2025-03-31 2025-04-01 2025-04-02 2025-04-03 2025-04-04 2025-04-07 2025-04-18 2025-05-01 2025-05-12 2025-05-13 2025-05-29 2025-05-30 2025-06-06 2025-06-09 2025-06-27 2025-09-05 2025-12-25 2025-12-26 ' +
      '2026-01-01 2026-01-16 2026-02-17 2026-03-19 2026-03-20 2026-03-23 2026-03-24 2026-04-03 2026-05-01 2026-05-14 2026-05-27 2026-06-01 2026-06-16 2026-08-17 2026-08-25 2026-12-24 2026-12-25'
    ).split(/\s+/)
  );
  function isoDate(d) {
    return d.toISOString().slice(0, 10);
  }
  function buildCalendar(from, to) {
    const out = [];
    const d = new Date(from + 'T00:00:00Z');
    const end = new Date(to + 'T00:00:00Z');
    while (d <= end) {
      const w = d.getUTCDay();
      const s = isoDate(d);
      if (w !== 0 && w !== 6 && !HOLIDAYS.has(s)) out.push(s);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }
  function weekday(dateText) {
    return new Date(dateText + 'T00:00:00Z').getUTCDay();
  }
  /* Sessions of continuous trading in minutes after midnight WIB. Session II ends at 15:49:59, which the mock rounds to 15:50. */
  function sessionsOf(dateText) {
    return weekday(dateText) === 5
      ? [
          [540, 690],
          [840, 950],
        ]
      : [
          [540, 720],
          [810, 950],
        ];
  }
  PL.sessionsOf = sessionsOf;
  const STEPS = 64;
  const DELAY_MINUTES = 10;
  const FINAL_MINUTE = 975; /* 16:15 WIB, after the closing auction, when the close is final */
  PL.DELAY_MINUTES = DELAY_MINUTES;

  function tradedMinutes(dateText, minute) {
    let elapsed = 0;
    let total = 0;
    for (const [a, b] of sessionsOf(dateText)) {
      total += b - a;
      elapsed += Math.max(0, Math.min(minute, b) - a);
    }
    return { elapsed, total };
  }
  function stepAt(dateText, minute) {
    const { elapsed, total } = tradedMinutes(dateText, minute);
    return Math.max(0, Math.min(STEPS, Math.round((elapsed / total) * STEPS)));
  }
  function minuteOfStep(dateText, step) {
    const { total } = tradedMinutes(dateText, 0);
    let left = (step / STEPS) * total;
    for (const [a, b] of sessionsOf(dateText)) {
      if (left <= b - a) return Math.round(a + left);
      left -= b - a;
    }
    return 950;
  }
  PL.minuteOfStep = minuteOfStep;

  /* ---------- IDX price rules (the mock's assumptions, stated in the "?" cards) ---------- */
  function tickSize(price) {
    if (price < 200) return 1;
    if (price < 500) return 2;
    if (price < 2000) return 5;
    if (price < 5000) return 10;
    return 25;
  }
  function roundToTick(price) {
    const t = tickSize(price);
    return Math.max(1, Math.round(price / t) * t);
  }
  function floorToTick(price) {
    const t = tickSize(price);
    return Math.floor(price / t + 1e-9) * t;
  }
  function ceilToTick(price) {
    const t = tickSize(price);
    return Math.ceil(price / t - 1e-9) * t;
  }
  function isOnTick(price) {
    return price % tickSize(price) === 0;
  }
  function stepPrice(price, direction) {
    if (direction > 0) {
      const next = price + tickSize(price);
      return isOnTick(next) ? next : ceilToTick(next);
    }
    const below = price - 1;
    return floorToTick(below);
  }
  function autoRejection(reference) {
    const up = reference > 5000 ? 0.25 : 0.35;
    const down = 0.15;
    return {
      up,
      down,
      ara: floorToTick(reference * (1 + up)),
      arb: Math.max(1, ceilToTick(reference * (1 - down))),
    };
  }
  const TICK_TABLE = [
    { from: 0, to: 200, tick: 1 },
    { from: 200, to: 500, tick: 2 },
    { from: 500, to: 2000, tick: 5 },
    { from: 2000, to: 5000, tick: 10 },
    { from: 5000, to: null, tick: 25 },
  ];
  const FEES = { buy: 0.0015, sell: 0.0015, tax: 0.001 };
  const SHARES_PER_LOT = 100;
  const MAX_LOTS = 50000;
  const START_CASH = 100000000;
  const BI_RATE = 0.0475;
  Object.assign(PL, {
    tickSize,
    roundToTick,
    floorToTick,
    ceilToTick,
    isOnTick,
    stepPrice,
    autoRejection,
    TICK_TABLE,
    FEES,
    SHARES_PER_LOT,
    MAX_LOTS,
    START_CASH,
    BI_RATE,
    RF: BI_RATE / 12,
  });

  function orderAmounts(side, price, lots) {
    const value = price * lots * SHARES_PER_LOT;
    const fee = Math.round(value * (side === 'buy' ? FEES.buy : FEES.sell));
    const tax = side === 'sell' ? Math.round(value * FEES.tax) : 0;
    const total = side === 'buy' ? value + fee : value - fee - tax;
    return { value, fee, tax, total };
  }
  PL.orderAmounts = orderAmounts;
  function maxBuyLots(cash, price) {
    let lots = Math.floor(cash / (price * SHARES_PER_LOT * (1 + FEES.buy)));
    while (lots > 0 && orderAmounts('buy', price, lots).total > cash) lots -= 1;
    while (orderAmounts('buy', price, lots + 1).total <= cash) lots += 1;
    return Math.min(lots, MAX_LOTS);
  }
  PL.maxBuyLots = maxBuyLots;

  /* ---------- the stocks ---------- */
  /* code, name, sector, close at the start of Sep 2021, close on 11 Nov 2026, beta loading, idiosyncratic daily sd, sector loading */
  const STOCK_DEFS = [
    ['BBCA', 'Bank Central Asia Tbk', 'Keuangan', 7325, 9275, 0.74, 0.0102, 0.55],
    ['BBRI', 'Bank Rakyat Indonesia (Persero) Tbk', 'Keuangan', 3880, 4180, 0.92, 0.0128, 0.7],
    ['BMRI', 'Bank Mandiri (Persero) Tbk', 'Keuangan', 3175, 5350, 0.95, 0.0122, 0.7],
    ['BBNI', 'Bank Negara Indonesia (Persero) Tbk', 'Keuangan', 2640, 4460, 0.97, 0.014, 0.7],
    ['TLKM', 'Telkom Indonesia (Persero) Tbk', 'Infrastruktur', 3650, 3170, 0.7, 0.0132, 0],
    ['ASII', 'Astra International Tbk', 'Perindustrian', 5550, 5625, 1.0, 0.013, 0.5],
    ['UNTR', 'United Tractors Tbk', 'Perindustrian', 22400, 24850, 1.08, 0.0158, 0.5],
    ['ICBP', 'Indofood CBP Sukses Makmur Tbk', 'Barang Konsumen Primer', 8350, 10475, 0.52, 0.0118, 0.5],
    ['AMRT', 'Sumber Alfaria Trijaya Tbk', 'Barang Konsumen Primer', 1150, 2230, 0.62, 0.0158, 0.5],
    ['KLBF', 'Kalbe Farma Tbk', 'Kesehatan', 1590, 1285, 0.58, 0.0148, 0],
    ['ADRO', 'AlamTri Resources Indonesia Tbk', 'Energi', 1650, 2020, 1.32, 0.0205, 0.8],
    ['PTBA', 'Bukit Asam Tbk', 'Energi', 2650, 2640, 1.22, 0.0178, 0.8],
    ['ANTM', 'Aneka Tambang Tbk', 'Barang Baku', 2350, 3040, 1.55, 0.0228, 0.8],
    ['MDKA', 'Merdeka Copper Gold Tbk', 'Barang Baku', 3950, 1985, 1.68, 0.0245, 0.8],
    ['INCO', 'Vale Indonesia Tbk', 'Barang Baku', 4900, 3890, 1.45, 0.0218, 0.8],
  ];
  const SECTORS = ['Keuangan', 'Energi', 'Barang Baku', 'Perindustrian', 'Barang Konsumen Primer', 'Kesehatan', 'Infrastruktur'];
  PL.SECTORS = SECTORS;

  function generateMarket() {
    const cal = buildCalendar('2021-09-01', '2026-12-31');
    const T = cal.length;
    const iEnd = cal.indexOf('2026-11-11');
    const today0 = iEnd + 1;
    const SIG_M = 0.0085;
    const SIG_F = 0.0055;
    const rm = mulberry32(73021);
    const m = new Float64Array(T);
    for (let t = 1; t < T; t++) m[t] = gauss(rm) * SIG_M;
    const sectorShock = {};
    for (const s of SECTORS) {
      const r = mulberry32(hashText('sector:' + s));
      const f = new Float64Array(T);
      for (let t = 1; t < T; t++) f[t] = gauss(r) * SIG_F;
      sectorShock[s] = f;
    }

    function buildSeries(x, start, end, isIndex, sigmaDay, seed) {
      let sum = 0;
      for (let t = 1; t <= iEnd; t++) sum += x[t];
      const d = (Math.log(end / start) - sum) / iEnd;
      for (let t = 1; t < T; t++) x[t] += d;
      const raw = new Float64Array(T);
      raw[0] = start;
      for (let t = 1; t < T; t++) raw[t] = raw[t - 1] * Math.exp(x[t]);
      const round = isIndex ? (p) => Math.round(p * 100) / 100 : roundToTick;
      const close = new Array(T);
      const open = new Array(T);
      const high = new Array(T);
      const low = new Array(T);
      const intraday = {};
      const r = mulberry32(seed);
      for (let t = 0; t < T; t++) {
        close[t] = round(raw[t]);
        if (t === iEnd) close[t] = isIndex ? end : end;
        const prevRaw = t === 0 ? raw[0] : raw[t - 1];
        if (t >= today0) {
          const w = new Float64Array(STEPS + 1);
          for (let k = 1; k <= STEPS; k++) w[k] = w[k - 1] + gauss(r) * (sigmaDay / Math.sqrt(STEPS)) * 0.9;
          const path = new Array(STEPS + 1);
          path[0] = close[t - 1];
          for (let k = 1; k <= STEPS; k++) {
            const b = w[k] - (k / STEPS) * w[STEPS] + (k / STEPS) * x[t];
            path[k] = round(prevRaw * Math.exp(b));
          }
          path[STEPS] = close[t];
          intraday[t] = path;
          open[t] = path[1];
          let hi = -Infinity;
          let lo = Infinity;
          for (let k = 1; k <= STEPS; k++) {
            hi = Math.max(hi, path[k]);
            lo = Math.min(lo, path[k]);
          }
          high[t] = hi;
          low[t] = lo;
        } else {
          const o = round(prevRaw * Math.exp(gauss(r) * sigmaDay * 0.3));
          open[t] = o;
          high[t] = Math.max(o, close[t], round(Math.max(o, raw[t]) * Math.exp(Math.abs(gauss(r)) * sigmaDay * 0.45)));
          low[t] = Math.min(o, close[t], round(Math.min(o, raw[t]) * Math.exp(-Math.abs(gauss(r)) * sigmaDay * 0.45)));
        }
      }
      return { close, open, high, low, intraday };
    }

    const ihsgX = Float64Array.from(m);
    const ihsg = Object.assign(
      { code: 'IHSG', name: 'Indeks Harga Saham Gabungan' },
      buildSeries(ihsgX, 6150, 8214.37, true, SIG_M, 991)
    );
    const stocks = STOCK_DEFS.map(([code, name, sector, start, end, beta, idio, load]) => {
      const r = mulberry32(hashText('stock:' + code));
      const x = new Float64Array(T);
      for (let t = 1; t < T; t++) x[t] = beta * m[t] + load * sectorShock[sector][t] + gauss(r) * idio;
      const sigmaDay = Math.sqrt(beta * beta * SIG_M * SIG_M + load * load * SIG_F * SIG_F + idio * idio);
      return Object.assign({ code, name, sector }, buildSeries(x, start, end, false, sigmaDay, hashText('intraday:' + code)));
    });
    const byCode = {};
    for (const s of stocks) byCode[s.code] = s;
    return { cal, T, today0, stocks, byCode, ihsg };
  }
  PL.generateMarket = generateMarket;

  /* ---------- the clock of the mock ---------- */
  function phaseOf(market, clock) {
    const [[a1, b1], [a2, b2]] = sessionsOf(market.cal[clock.day]);
    const m = clock.minute;
    if (m < a1) return 'pra';
    if (m < b1) return 'sesi1';
    if (m < a2) return 'istirahat';
    if (m < b2) return 'sesi2';
    return 'tutup';
  }
  function lastFinalIndex(market, clock) {
    return clock.minute >= FINAL_MINUTE ? clock.day : clock.day - 1;
  }
  function isTrading(phase) {
    return phase === 'sesi1' || phase === 'sesi2';
  }
  PL.phaseOf = phaseOf;
  PL.lastFinalIndex = lastFinalIndex;
  PL.isTrading = isTrading;

  /* The delayed quote of a series at the clock. */
  function quote(series, market, clock) {
    const day = clock.day;
    const dateText = market.cal[day];
    const prevClose = series.close[day - 1];
    const quoteMinute = clock.minute - DELAY_MINUTES;
    const firstMinute = sessionsOf(dateText)[0][0];
    if (clock.minute >= FINAL_MINUTE) {
      return {
        price: series.close[day],
        prevClose,
        day,
        minute: 950,
        final: true,
        open: series.open[day],
        high: series.high[day],
        low: series.low[day],
        step: STEPS,
      };
    }
    if (quoteMinute < firstMinute) {
      return { price: prevClose, prevClose: series.close[day - 2], day: day - 1, minute: 950, final: true, open: series.open[day - 1], high: series.high[day - 1], low: series.low[day - 1], step: STEPS, before: true };
    }
    const step = Math.max(1, stepAt(dateText, quoteMinute));
    const path = series.intraday[day];
    let high = -Infinity;
    let low = Infinity;
    for (let k = 1; k <= step; k++) {
      high = Math.max(high, path[k]);
      low = Math.min(low, path[k]);
    }
    return { price: path[step], prevClose, day, minute: Math.min(quoteMinute, 950), final: false, open: path[1], high, low, step };
  }
  PL.quote = quote;

  /* ---------- statistics ---------- */
  function mean(a) {
    let s = 0;
    for (const x of a) s += x;
    return s / a.length;
  }
  function covS(a, b) {
    const ma = mean(a);
    const mb = mean(b);
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
    return s / (a.length - 1);
  }
  function varS(a) {
    return covS(a, a);
  }
  PL.mean = mean;
  PL.covS = covS;
  PL.varS = varS;

  /* Month-end closes of complete months. A month counts once a later month has a final close. */
  function monthEnds(market, lastFinal) {
    const out = [];
    for (let i = 0; i < lastFinal; i++) {
      if (market.cal[i].slice(0, 7) !== market.cal[i + 1].slice(0, 7)) out.push(i);
    }
    return out;
  }

  const measureCache = new Map();
  function measures(market, lastFinal) {
    if (measureCache.has(lastFinal)) return measureCache.get(lastFinal);
    const ends = monthEnds(market, lastFinal).slice(-61);
    const ret = (series) => {
      const out = [];
      for (let i = 1; i < ends.length; i++) out.push(series.close[ends[i]] / series.close[ends[i - 1]] - 1);
      return out;
    };
    const Rm = ret(market.ihsg);
    const Em = mean(Rm);
    const varM = varS(Rm);
    const rf = PL.RF;
    const R = {};
    const stock = {};
    for (const s of market.stocks) R[s.code] = ret(s);
    for (const s of market.stocks) {
      const r = R[s.code];
      const E = mean(r);
      const v = varS(r);
      const cm = covS(r, Rm);
      const beta = cm / varM;
      const required = rf + beta * (Em - rf);
      stock[s.code] = { E, var: v, sd: Math.sqrt(v), covM: cm, beta, required, alpha: E - required, corrM: cm / Math.sqrt(v * varM) };
    }
    const cov = {};
    for (const a of market.stocks) {
      cov[a.code] = {};
      for (const b of market.stocks) cov[a.code][b.code] = covS(R[a.code], R[b.code]);
    }
    const result = { ends, months: ends.slice(1), R, Rm, Em, varM, sdM: Math.sqrt(varM), rf, stock, cov, n: Rm.length, lastFinal };
    measureCache.set(lastFinal, result);
    return result;
  }
  PL.measures = measures;

  /* Measures of a portfolio from weights over its total value. Cash earns no return in Portolab, so it has a return, a variance, and a beta of zero. */
  function portfolioMeasures(weights, M) {
    const codes = Object.keys(weights).filter((c) => weights[c] > 1e-12);
    if (!codes.length) return null;
    let E = 0;
    let beta = 0;
    let variance = 0;
    let avgRisk = 0;
    const covWithP = {};
    for (const i of codes) {
      E += weights[i] * M.stock[i].E;
      beta += weights[i] * M.stock[i].beta;
      avgRisk += weights[i] * M.stock[i].sd;
      let c = 0;
      for (const j of codes) c += weights[j] * M.cov[i][j];
      covWithP[i] = c;
      variance += weights[i] * c;
    }
    const sd = Math.sqrt(variance);
    const rf = M.rf;
    const required = rf + beta * (M.Em - rf);
    const series = M.Rm.map((_, t) => {
      let s = 0;
      for (const i of codes) s += weights[i] * M.R[i][t];
      return s;
    });
    const contrib = {};
    for (const i of codes) contrib[i] = (weights[i] * covWithP[i]) / variance;
    const stockWeight = codes.reduce((s, c) => s + weights[c], 0);
    return {
      codes,
      weights,
      E,
      beta,
      variance,
      sd,
      sharpe: (E - rf) / sd,
      treynor: beta > 0 ? (E - rf) / beta : null,
      required,
      alpha: E - required,
      series,
      contrib,
      covWithP,
      avgRisk,
      stockWeight,
      cashWeight: 1 - stockWeight,
    };
  }
  PL.portfolioMeasures = portfolioMeasures;
  function correlationWithPortfolio(code, P, M) {
    if (!P) return null;
    let c = 0;
    for (const j of P.codes) c += P.weights[j] * M.cov[code][j];
    return c / (M.stock[code].sd * P.sd);
  }
  PL.correlationWithPortfolio = correlationWithPortfolio;

  /* ---------- the portfolio engine ---------- */
  function sortFills(orders) {
    return orders
      .filter((o) => o.status === 'filled')
      .slice()
      .sort((a, b) => a.fill.day - b.fill.day || a.fill.minute - b.fill.minute || a.seq - b.seq);
  }
  /* Replays the fills up to and including a day, or all of them. Average cost includes the broker fee of each purchase. */
  function ledger(portfolio, uptoDay) {
    let cash = portfolio.startCash;
    const holdings = {};
    const realized = {};
    for (const o of sortFills(portfolio.orders)) {
      if (uptoDay != null && o.fill.day > uptoDay) continue;
      const a = orderAmounts(o.side, o.fill.price, o.lots);
      const shares = o.lots * SHARES_PER_LOT;
      const h = holdings[o.code] || (holdings[o.code] = { shares: 0, cost: 0 });
      if (o.side === 'buy') {
        cash -= a.total;
        h.shares += shares;
        h.cost += a.total;
      } else {
        cash += a.total;
        const costOut = (h.cost / h.shares) * shares;
        realized[o.id] = { pl: a.total - costOut, costOut, avgCost: h.cost / h.shares };
        h.cost -= costOut;
        h.shares -= shares;
        if (h.shares === 0) delete holdings[o.code];
      }
    }
    return { cash, holdings, realized };
  }
  PL.ledger = ledger;

  function reserved(portfolio, market, clock) {
    let cash = 0;
    const shares = {};
    for (const o of portfolio.orders) {
      if (o.status !== 'open') continue;
      if (o.side === 'buy') {
        const price = o.type === 'limit' ? o.limit : quote(market.byCode[o.code], market, clock).price;
        cash += orderAmounts('buy', price, o.lots).total;
      } else {
        shares[o.code] = (shares[o.code] || 0) + o.lots * SHARES_PER_LOT;
      }
    }
    return { cash, shares };
  }
  PL.reserved = reserved;

  /* Everything a screen needs about one portfolio at one moment, so every screen shows the same numbers. */
  function snapshot(portfolio, market, clock) {
    const L = ledger(portfolio);
    const res = reserved(portfolio, market, clock);
    const lastFinal = lastFinalIndex(market, clock);
    const M = measures(market, lastFinal);
    const positions = [];
    let stockValue = 0;
    for (const code of Object.keys(L.holdings)) {
      const h = L.holdings[code];
      const s = market.byCode[code];
      const q = quote(s, market, clock);
      const value = h.shares * q.price;
      stockValue += value;
      positions.push({
        code,
        stock: s,
        shares: h.shares,
        lots: h.shares / SHARES_PER_LOT,
        cost: h.cost,
        avgCost: h.cost / h.shares,
        price: q.price,
        quote: q,
        value,
        pl: value - h.cost,
        plPct: value / h.cost - 1,
        dayChange: q.price / q.prevClose - 1,
      });
    }
    const total = L.cash + stockValue;
    for (const p of positions) p.weight = p.value / total;
    positions.sort((a, b) => b.value - a.value);
    const weights = {};
    for (const p of positions) weights[p.code] = p.weight;
    const P = portfolioMeasures(weights, M);
    const sectors = {};
    for (const p of positions) sectors[p.stock.sector] = (sectors[p.stock.sector] || 0) + p.value;
    const sectorList = Object.keys(sectors)
      .map((name) => ({ name, value: sectors[name], weight: sectors[name] / total }))
      .sort((a, b) => b.value - a.value);
    /* The value at the last final close, with the holdings of that moment, so today's change includes the fees of today. */
    const refDay = clock.minute >= FINAL_MINUTE ? clock.day - 1 : lastFinal;
    const before = valueAtClose(portfolio, market, refDay);
    const startDay = portfolio.startDay;
    return {
      cash: L.cash,
      available: L.cash - res.cash,
      reservedCash: res.cash,
      reservedShares: res.shares,
      holdings: L.holdings,
      realized: L.realized,
      positions,
      stockValue,
      total,
      cashWeight: L.cash / total,
      dayChange: total - before,
      dayChangePct: total / before - 1,
      totalReturn: total / portfolio.startCash - 1,
      totalGain: total - portfolio.startCash,
      M,
      P,
      sectors: sectorList,
      startDay,
      empty: positions.length === 0 && portfolio.orders.length === 0,
    };
  }
  PL.snapshot = snapshot;

  function valueAtClose(portfolio, market, day) {
    if (day < portfolio.startDay) return portfolio.startCash;
    const L = ledger(portfolio, day);
    let v = L.cash;
    for (const code of Object.keys(L.holdings)) v += L.holdings[code].shares * market.byCode[code].close[day];
    return v;
  }
  PL.valueAtClose = valueAtClose;

  /* The return of the portfolio and of the IHSG at each final close since the start, plus the live point. */
  function history(portfolio, market, clock) {
    const lastFinal = lastFinalIndex(market, clock);
    const start = portfolio.startDay;
    const base = market.ihsg.close[start];
    const out = [];
    for (let d = start; d <= lastFinal; d++) {
      const v = valueAtClose(portfolio, market, d);
      out.push({ day: d, value: v, ret: v / portfolio.startCash - 1, ihsg: market.ihsg.close[d] / base - 1, ihsgLevel: market.ihsg.close[d], final: true });
    }
    if (lastFinal < clock.day) {
      const q = quote(market.ihsg, market, clock);
      if (!q.before) {
        const snap = snapshot(portfolio, market, clock);
        out.push({ day: clock.day, minute: q.minute, value: snap.total, ret: snap.totalReturn, ihsg: q.price / base - 1, ihsgLevel: q.price, final: false });
      }
    }
    return out;
  }
  PL.history = history;

  /* ---------- order validation, the rules of IDX with the real numbers ---------- */
  function referencePrice(stock, market, clock) {
    return clock.minute >= FINAL_MINUTE ? stock.close[clock.day] : stock.close[clock.day - 1];
  }
  PL.referencePrice = referencePrice;
  function tradeDayOf(market, clock) {
    const phase = phaseOf(market, clock);
    if (phase === 'tutup') return clock.day + 1;
    return clock.day;
  }
  PL.tradeDayOf = tradeDayOf;
})(typeof window !== 'undefined' ? window : globalThis);
