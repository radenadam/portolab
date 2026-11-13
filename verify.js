require('./src/core.js'); require('./src/engine.js');
const PL = globalThis.PL;
const mk = PL.generateMarket();
const clock = { day: mk.today0, minute: 624 };
const nadia = PL.buildNadia(mk);
const s = PL.snapshot(nadia, mk, clock);
const M = s.M, P = s.P;
// independent: series-based
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const v = a => { const m = mean(a); return a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1); };
const cov = (a, b) => { const ma = mean(a), mb = mean(b); let t = 0; for (let i = 0; i < a.length; i++) t += (a[i] - ma) * (b[i] - mb); return t / (a.length - 1); };
const series = M.Rm.map((_, t) => s.positions.reduce((x, p) => x + p.weight * M.R[p.code][t], 0));
const checks = {
  'E = mean(series)': [P.E, mean(series)],
  'var = VAR.S(series)': [P.variance, v(series)],
  'beta = SLOPE(series, IHSG)': [P.beta, cov(series, M.Rm) / v(M.Rm)],
  'alpha = E - (rf + beta(Em - rf))': [P.alpha, mean(series) - (PL.BI_RATE / 12 + (cov(series, M.Rm) / v(M.Rm)) * (mean(M.Rm) - PL.BI_RATE / 12))],
  'alpha = sum w*alpha_i - wcash*rf': [P.alpha, s.positions.reduce((x, p) => x + p.weight * M.stock[p.code].alpha, 0) - s.cashWeight * M.rf],
  'sharpe': [P.sharpe, (mean(series) - M.rf) / Math.sqrt(v(series))],
  'treynor': [P.treynor, (mean(series) - M.rf) / (cov(series, M.Rm) / v(M.Rm))],
  'sum contrib = 1': [Object.values(P.contrib).reduce((a, b) => a + b, 0), 1],
  'total = cash + sum value': [s.total, s.cash + s.positions.reduce((x, p) => x + p.value, 0)],
  'gain = sum unrealized + realized': [s.totalGain, s.positions.reduce((x, p) => x + p.pl, 0) + Object.values(s.realized).reduce((x, r) => x + r.pl, 0)],
  'rf = 4.75%/12': [M.rf, 0.0475 / 12],
  'months = 60': [M.n, 60],
};
let ok = true;
for (const [k, [a, b]] of Object.entries(checks)) { const good = Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)); ok = ok && good; console.log((good ? 'OK  ' : 'BAD ') + k, a, b); }
// fees and IDX rules
const f = PL.orderAmounts('buy', 9350, 12); console.log('buy 12 lot @9350', f, 'expected fee', Math.round(9350*1200*0.0015));
const g = PL.orderAmounts('sell', 3070, 15); console.log('sell 15 lot @3070', g);
for (const ref of [64, 199, 200, 1285, 4995, 5000, 5025, 9275, 24850]) console.log('ref', ref, 'tick', PL.tickSize(ref), JSON.stringify(PL.autoRejection(ref)));
console.log(ok ? 'ALL MEASURE CHECKS PASS' : 'SOME CHECKS FAILED');
