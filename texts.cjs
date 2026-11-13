/* Runs every sentence that the screens compute from the data through each branch the data can produce, and fails on a dash, a semicolon, a hyphen-minus before a number, or "−0". */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
require('./src/core.js');
require('./src/engine.js');
const PL = globalThis.PL;
globalThis.F = PL.fmt;
const stub = 'const html = () => null; const useState = () => [null, () => {}]; const useEffect = () => {}; const useMemo = (f) => f(); const useApp = () => null; const Seg = null; const pathOf = () => "";\n';
vm.runInThisContext(stub + fs.readFileSync(path.join(__dirname, 'src', 'peta.js'), 'utf8').replace(/^const /gm, 'var ').replace(/^function /gm, 'function '));

const market = PL.generateMarket();
const classes = PL.buildClasses(market);
const nadia = PL.buildNadia(market);
const texts = [];
const say = (label, t) => texts.push([label, t]);
function rowsOf(list, clock, live) {
  return list.map((st) => {
    const portfolio = st.live ? live : st.portfolio;
    const snap = PL.snapshot(portfolio, market, clock);
    let last = null;
    for (const o of portfolio.orders) if (!last || o.placed.day > last.day || (o.placed.day === last.day && o.placed.minute > last.minute)) last = o.placed;
    return { st, portfolio, snap, last };
  });
}
function classTexts(label, app, rows, tweak) {
  const s = classStats(app, rows);
  if (tweak) tweak(s);
  say(label + ' headline', leadHeadline(s.med - s.ihsgRet, 'Kelas'));
  say(label + ' summary', classSummary(app, s));
  for (const f of classFlags(app, s)) say(label + ' flag', f.name + ': ' + f.text);
  const d = discussionFor(app, s);
  say(label + ' discussion ' + d.badge + ' (lesson ' + d.lesson + ')', d.questions.join(' / '));
  return s;
}

const today = { day: market.today0, minute: 624 };
const app = { market, clock: today };
const rowsA = rowsOf(classes['mp-a'], today, nadia);
const s = classTexts('A', app, rowsA);
for (const i of s.items) {
  const n = studentNote(s, i);
  say('note ' + i.name, n.bold + ' ' + n.rest);
}
classTexts('B', { market, clock: today }, rowsOf(classes['mp-b'], today, null));
classTexts('A below the IHSG', app, rowsA, (x) => { x.med = x.ihsgRet - 0.0123; x.above = 0; x.calmer = 0; });
classTexts('A equal to the IHSG', app, rowsA, (x) => { x.med = x.ihsgRet + 0.00001; x.above = x.N; x.calmer = x.withStocks.length; });
const one = classTexts('one student', app, rowsA.slice(1, 2));
say('one student note', (() => { const n = studentNote(one, one.items[0]); return n.bold + ' ' + n.rest; })());
const empty = classes['mp-a'].map((st) => Object.assign({}, st, { live: false, portfolio: { startCash: PL.START_CASH, startDay: rowsA[1].portfolio.startDay, orders: [] } }));
const se = classTexts('no stocks in the class', app, rowsOf(empty, today, null));
say('no stocks note', (() => { const n = studentNote(se, se.items[0]); return n.bold + ' ' + n.rest; })());
/* Every later trading day of the calendar, so every session the demo can reach gets its questions. */
const seen = new Set();
for (let day = market.today0; day < market.T - 1; day++) {
  const n = PL.sessionOf(market, day);
  if (seen.has(n)) continue;
  seen.add(n);
  const clock = { day, minute: 624 };
  classTexts('day ' + market.cal[day], { market, clock }, rowsOf(classes['mp-a'], clock, nadia));
}
/* The insight row of Beranda for every portfolio of the class, one holding, and orders that have not filled. */
for (const r of rowsA) if (r.snap.P) say('insight ' + r.st.name, homeInsight(r.snap, r.st.live ? null : r.st.name.split(' ')[0]).badge + ' · ' + homeInsight(r.snap, r.st.live ? null : r.st.name.split(' ')[0]).text);
const single = { startCash: PL.START_CASH, startDay: nadia.startDay, orders: nadia.orders.filter((o) => o.code === 'BBCA' && o.status === 'filled') };
say('insight one holding', homeInsight(PL.snapshot(single, market, today), null).text);
const waiting = { startCash: PL.START_CASH, startDay: nadia.startDay, orders: nadia.orders.filter((o) => o.status === 'open') };
say('insight only an open order', homeInsight(PL.snapshot(waiting, market, today), null).text);
for (const d of [0.0361, -0.0361, 0.000001]) say('student headline ' + d, leadHeadline(d));

const bad = [];
for (const [label, t] of texts) {
  if (/[—–;]/.test(t)) bad.push('dash or semicolon in ' + label + ': ' + t);
  if (/(^|[\s(])-\d/.test(t)) bad.push('hyphen-minus before a number in ' + label + ': ' + t);
  if (/−0(?:[,.]0+)?(?![,.\d])/.test(t)) bad.push('minus zero in ' + label + ': ' + t);
  if (/undefined|NaN|null/.test(t)) bad.push('missing value in ' + label + ': ' + t);
}
if (process.argv[2] === 'print') for (const [label, t] of texts) console.log('[' + label + '] ' + t);
console.log(texts.length + ' sentences checked. ' + (bad.length ? bad.length + ' problems:\n' + bad.join('\n') : 'No problems.'));
