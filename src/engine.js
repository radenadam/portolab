/* Portolab mock: formatting, the seeded portfolios, orders over time, and the checks of an order. */
(function (G) {
  'use strict';
  const PL = G.PL;
  const LOCALE = 'id-ID';

  /* ---------- formatting, always through Intl ---------- */
  const nf = {};
  function numberFormat(key, options) {
    if (!nf[key]) nf[key] = new Intl.NumberFormat(LOCALE, options);
    return nf[key];
  }
  /* Intl writes a hyphen-minus before a negative number, and Portolab shows the minus sign U+2212. */
  const minus = (text) => text.replace(/-/g, '−');
  /* A value that rounds to zero is shown as zero, never as "−0". */
  const z = (v, digits) => (Math.abs(v) < 0.5 / Math.pow(10, digits) ? 0 : v);
  const fmt = {
    rp: (n) => minus(numberFormat('rp', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(n) || 0)),
    rpSigned: (n) => minus(numberFormat('rps', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(Math.round(n) || 0)),
    rpCompact: (n) => minus(numberFormat('rpc', { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }).format(n)),
    rpCompactSigned: (n) => minus(numberFormat('rpcs', { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(n)),
    int: (n) => minus(numberFormat('int', { maximumFractionDigits: 0 }).format(z(n, 0))),
    num: (n, d = 2) => minus(numberFormat('num' + d, { minimumFractionDigits: d, maximumFractionDigits: d }).format(z(n, d))),
    numSigned: (n, d = 2) => minus(numberFormat('nums' + d, { minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: 'exceptZero' }).format(z(n, d))),
    pct: (x, d = 2) => minus(numberFormat('pct' + d, { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d }).format(z(x, d + 2))),
    pctSigned: (x, d = 2) => minus(numberFormat('pcts' + d, { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: 'exceptZero' }).format(z(x, d + 2))),
    compact: (n) => minus(numberFormat('cmp', { notation: 'compact', maximumFractionDigits: 1 }).format(n)),
  };
  const df = {};
  function dateFormat(key, options) {
    if (!df[key]) df[key] = new Intl.DateTimeFormat(LOCALE, options);
    return df[key];
  }
  function dayDate(market, day) {
    return new Date(market.cal[day] + 'T00:00:00Z');
  }
  function momentDate(market, day, minute) {
    const d = dayDate(market, day);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, minute - 7 * 60));
  }
  fmt.date = (market, day) => dateFormat('d', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dayDate(market, day));
  fmt.dateShort = (market, day) => dateFormat('ds', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(dayDate(market, day));
  fmt.dateLong = (market, day) => dateFormat('dl', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dayDate(market, day));
  fmt.weekday = (market, day) => dateFormat('wd', { weekday: 'long', timeZone: 'UTC' }).format(dayDate(market, day));
  fmt.month = (market, day) => dateFormat('m', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dayDate(market, day));
  fmt.monthShort = (market, day) => dateFormat('ms', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(dayDate(market, day));
  fmt.time = (market, day, minute) => dateFormat('t', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short' }).format(momentDate(market, day, minute));
  fmt.timeBare = (market, day, minute) => dateFormat('tb', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(momentDate(market, day, minute));
  fmt.dateTime = (market, day, minute) =>
    dateFormat('dt', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short' }).format(momentDate(market, day, minute));
  fmt.dateTimeBare = (market, day, minute) =>
    dateFormat('dtb', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(momentDate(market, day, minute));
  fmt.minuteOnly = (minute) => dateFormat('mo', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 1, 0, minute)));
  fmt.lots = (lots) => fmt.int(lots) + ' lot';
  fmt.dateWeekday = (market, day) => dateFormat('dw', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dayDate(market, day));
  PL.fmt = fmt;

  /* ---------- the calendar of the course ---------- */
  /* Session 1 meets in the week of Monday 7 September 2026, and each later session meets one week after the one before, so session 6 is the week of 12 October. */
  const COURSE_WEEK_ONE = '2026-09-07';
  const WEEK_MS = 7 * 86400000;
  function sessionOf(market, day) {
    return Math.floor((Date.parse(market.cal[day] + 'T00:00:00Z') - Date.parse(COURSE_WEEK_ONE + 'T00:00:00Z')) / WEEK_MS) + 1;
  }
  function sessionLabel(n) {
    if (n === 8) return 'UTS';
    if (n === 16) return 'UAS';
    if (n > 16) return 'Setelah UAS';
    return 'Sesi ' + n;
  }
  PL.sessionOf = sessionOf;
  PL.sessionLabel = sessionLabel;

  /* ---------- order lifecycle ---------- */
  const STEPS = 64;
  function stepAtMinute(market, day, minute) {
    const s = PL.sessionsOf(market.cal[day]);
    let elapsed = 0;
    let total = 0;
    for (const [a, b] of s) {
      total += b - a;
      elapsed += Math.max(0, Math.min(minute, b) - a);
    }
    return Math.max(0, Math.min(STEPS, Math.round((elapsed / total) * STEPS)));
  }

  function nextSeq(portfolio) {
    let max = 0;
    for (const o of portfolio.orders) max = Math.max(max, o.seq);
    return max + 1;
  }

  /* Places a checked order. During a session a market order fills at the latest delayed price, and a limit order fills when that price meets its limit. Outside a session both wait for the next session. */
  function placeOrder(portfolio, draft, market, clock) {
    const seq = nextSeq(portfolio);
    const phase = PL.phaseOf(market, clock);
    const order = {
      id: 'o' + seq + '-' + clock.day + '-' + clock.minute,
      seq,
      code: draft.code,
      side: draft.side,
      type: draft.type,
      lots: draft.lots,
      limit: draft.type === 'limit' ? draft.limit : null,
      placed: { day: clock.day, minute: clock.minute },
      tradeDay: PL.tradeDayOf(market, clock),
      status: 'open',
      reason: (draft.reason || '').trim(),
    };
    if (PL.isTrading(phase)) {
      const q = PL.quote(market.byCode[order.code], market, clock);
      const fills = order.type === 'market' || (order.side === 'buy' ? order.limit >= q.price : order.limit <= q.price);
      if (fills) {
        order.status = 'filled';
        order.fill = { price: q.price, day: clock.day, minute: clock.minute };
      }
    }
    return { portfolio: Object.assign({}, portfolio, { orders: portfolio.orders.concat([order]) }), order };
  }
  PL.placeOrder = placeOrder;

  function cancelOrder(portfolio, id, clock) {
    return Object.assign({}, portfolio, {
      orders: portfolio.orders.map((o) => (o.id === id && o.status === 'open' ? Object.assign({}, o, { status: 'cancelled', closed: { day: clock.day, minute: clock.minute } }) : o)),
    });
  }
  PL.cancelOrder = cancelOrder;

  /* Moves time from one clock to a later one and settles every open order on the delayed prices in between. */
  function advance(portfolio, market, from, to) {
    let orders = portfolio.orders.map((o) => Object.assign({}, o));
    const events = [];
    const open = orders.filter((o) => o.status === 'open').sort((a, b) => a.seq - b.seq);
    for (const o of open) {
      const d = o.tradeDay;
      if (d > to.day) continue;
      const path = market.byCode[o.code].intraday[d];
      const dateText = market.cal[d];
      let startStep = 1;
      if (o.placed.day === d) startStep = Math.max(startStep, stepAtMinute(market, d, o.placed.minute - PL.DELAY_MINUTES) + 1);
      if (from.day === d) startStep = Math.max(startStep, stepAtMinute(market, d, from.minute - PL.DELAY_MINUTES) + 1);
      const endStep = d < to.day ? STEPS : stepAtMinute(market, d, to.minute - PL.DELAY_MINUTES);
      for (let k = startStep; k <= endStep && o.status === 'open'; k++) {
        const price = path[k];
        const minute = PL.minuteOfStep(dateText, k) + PL.DELAY_MINUTES;
        if (o.type === 'market' && o.side === 'buy') {
          const current = Object.assign({}, portfolio, { orders });
          const L = PL.ledger(current);
          let reservedOther = 0;
          for (const x of orders) if (x.status === 'open' && x.side === 'buy' && x.id !== o.id) reservedOther += PL.orderAmounts('buy', x.type === 'limit' ? x.limit : price, x.lots).total;
          const available = L.cash - reservedOther;
          const need = PL.orderAmounts('buy', price, o.lots).total;
          if (need > available) {
            o.status = 'rejected';
            o.closed = { day: d, minute };
            o.rejection = { kind: 'cash', price, need, available, placedPrice: o.placedPrice };
          } else {
            o.status = 'filled';
            o.fill = { price, day: d, minute };
          }
        } else if (o.type === 'market' || (o.side === 'buy' ? price <= o.limit : price >= o.limit)) {
          o.status = 'filled';
          o.fill = { price, day: d, minute };
        }
      }
      if (o.status === 'open' && (d < to.day || to.minute >= 975)) {
        o.status = 'expired';
        o.closed = { day: d, minute: 975 };
      }
      if (o.status !== 'open') events.push({ kind: o.status, id: o.id });
    }
    return { portfolio: Object.assign({}, portfolio, { orders }), events };
  }
  PL.advance = advance;

  /* ---------- the checks of an order, with the real numbers and a fix ---------- */
  function sectionOfTick(price) {
    for (const row of PL.TICK_TABLE) if (price >= row.from && (row.to == null || price < row.to)) return row;
    return PL.TICK_TABLE[0];
  }
  function tickRule(price) {
    const row = sectionOfTick(price);
    if (row.to == null) return 'Untuk harga ' + fmt.rp(row.from) + ' ke atas, harga bergerak per ' + fmt.rp(row.tick) + '.';
    if (row.from === 0) return 'Untuk harga di bawah ' + fmt.rp(row.to) + ', harga bergerak per ' + fmt.rp(row.tick) + '.';
    return 'Untuk harga ' + fmt.rp(row.from) + ' sampai di bawah ' + fmt.rp(row.to) + ', harga bergerak per ' + fmt.rp(row.tick) + '.';
  }
  PL.tickRule = tickRule;

  /* Parses a whole number that a person typed in Indonesian, where a dot groups digits. */
  function parseWhole(text) {
    const t = String(text).trim();
    if (t === '') return { ok: false, empty: true };
    if (/^\d{1,3}(\.\d{3})+$/.test(t) || /^\d+$/.test(t)) return { ok: true, value: Number(t.replace(/\./g, '')) };
    return { ok: false, text: t };
  }
  PL.parseWhole = parseWhole;

  function validate(draft, ctx) {
    const issues = [];
    const code = draft.code;
    const lotsParsed = parseWhole(draft.lotsText);
    let lots = null;
    if (!lotsParsed.ok) {
      issues.push(
        lotsParsed.empty
          ? { field: 'lots', text: 'Isi jumlah lot. Satu lot berisi 100 lembar saham.', fixes: [{ label: 'Ubah ke 1 lot', set: { lots: 1 } }] }
          : { field: 'lots', text: 'Jumlah lot ditulis sebagai bilangan bulat, misalnya 25 atau 1.000, tetapi isinya "' + lotsParsed.text + '".', fixes: [{ label: 'Ubah ke 1 lot', set: { lots: 1 } }] }
      );
    } else if (lotsParsed.value < 1) {
      issues.push({ field: 'lots', text: 'Order paling sedikit 1 lot, yaitu 100 lembar saham.', fixes: [{ label: 'Ubah ke 1 lot', set: { lots: 1 } }] });
    } else if (lotsParsed.value > PL.MAX_LOTS) {
      issues.push({
        field: 'lots',
        text: 'BEI menerima paling banyak ' + fmt.int(PL.MAX_LOTS) + ' lot dalam satu order, dan order ini ' + fmt.int(lotsParsed.value) + ' lot.',
        fixes: [{ label: 'Ubah ke ' + fmt.int(PL.MAX_LOTS) + ' lot', set: { lots: PL.MAX_LOTS } }],
      });
    } else {
      lots = lotsParsed.value;
    }

    let price = ctx.quote.price;
    if (draft.type === 'limit') {
      const p = parseWhole(draft.priceText);
      if (!p.ok) {
        issues.push(
          p.empty
            ? { field: 'price', text: 'Isi harga limit. Harga acuan hari ini ' + fmt.rp(ctx.ref) + '.', fixes: [{ label: 'Pakai ' + fmt.rp(ctx.quote.price), set: { price: ctx.quote.price } }] }
            : { field: 'price', text: 'Harga ditulis dalam rupiah bulat, misalnya 9.275, tetapi isinya "' + p.text + '".', fixes: [{ label: 'Pakai ' + fmt.rp(ctx.quote.price), set: { price: ctx.quote.price } }] }
        );
        price = null;
      } else {
        price = p.value;
        if (price > ctx.band.ara) {
          issues.push({
            field: 'price',
            text:
              'Harga ' + fmt.rp(price) + ' di atas batas ARA ' + fmt.rp(ctx.band.ara) + ', yaitu harga acuan ' + fmt.rp(ctx.ref) + ' ditambah ' + fmt.pct(ctx.band.up, 0) + '. BEI menolak order di luar batas ini.',
            fixes: [{ label: 'Ubah ke ' + fmt.rp(ctx.band.ara), set: { price: ctx.band.ara } }],
          });
        } else if (price < ctx.band.arb) {
          issues.push({
            field: 'price',
            text:
              'Harga ' + fmt.rp(price) + ' di bawah batas ARB ' + fmt.rp(ctx.band.arb) + ', yaitu harga acuan ' + fmt.rp(ctx.ref) + ' dikurangi ' + fmt.pct(ctx.band.down, 0) + '. BEI menolak order di luar batas ini.',
            fixes: [{ label: 'Ubah ke ' + fmt.rp(ctx.band.arb), set: { price: ctx.band.arb } }],
          });
        } else if (!PL.isOnTick(price)) {
          const lower = PL.floorToTick(price);
          const upper = PL.ceilToTick(price);
          const fixes = [];
          if (lower >= ctx.band.arb) fixes.push({ label: 'Ubah ke ' + fmt.rp(lower), set: { price: lower } });
          if (upper <= ctx.band.ara) fixes.push({ label: 'Ubah ke ' + fmt.rp(upper), set: { price: upper } });
          issues.push({ field: 'price', text: 'Harga ' + fmt.rp(price) + ' tidak sesuai fraksi harga. ' + tickRule(price), fixes });
        }
      }
    }

    if (lots != null && price != null) {
      if (draft.side === 'buy') {
        const a = PL.orderAmounts('buy', price, lots);
        if (a.total > ctx.available) {
          const max = PL.maxBuyLots(ctx.available, price);
          let text = 'Order ini butuh ' + fmt.rp(a.total) + ' termasuk biaya broker, tetapi kas yang tersedia ' + fmt.rp(ctx.available) + '.';
          if (ctx.reservedCash > 0) text += ' Sebanyak ' + fmt.rp(ctx.reservedCash) + ' sedang disisihkan untuk order beli yang menunggu.';
          text += max > 0 ? ' Kas Anda cukup untuk ' + fmt.int(max) + ' lot ' + code + ' di harga ' + fmt.rp(price) + '.' : ' Kas Anda belum cukup untuk 1 lot di harga ini.';
          issues.push({ field: 'lots', text, fixes: max > 0 ? [{ label: 'Ubah ke ' + fmt.int(max) + ' lot', set: { lots: max } }] : [] });
        }
      } else {
        const heldLots = Math.floor(ctx.heldShares / PL.SHARES_PER_LOT);
        const reservedLots = Math.floor(ctx.reservedShares / PL.SHARES_PER_LOT);
        const sellable = heldLots - reservedLots;
        if (heldLots === 0) {
          issues.push({ field: 'lots', text: 'Anda belum memiliki ' + code + ', jadi belum ada yang bisa dijual. Portolab tidak mengizinkan short selling.', fixes: [{ label: 'Ganti ke Beli', set: { side: 'buy' } }] });
        } else if (lots > sellable) {
          let text = 'Anda memiliki ' + fmt.int(heldLots) + ' lot ' + code + '.';
          if (reservedLots > 0) text += ' Sebanyak ' + fmt.int(reservedLots) + ' lot sudah ada di order jual lain yang menunggu, jadi yang bisa dijual ' + fmt.int(sellable) + ' lot.';
          else text += ' Anda tidak bisa menjual lebih dari yang Anda miliki.';
          issues.push({ field: 'lots', text, fixes: sellable > 0 ? [{ label: 'Ubah ke ' + fmt.int(sellable) + ' lot', set: { lots: sellable } }] : [] });
        }
      }
    }
    return { issues, lots, price };
  }
  PL.validate = validate;

  /* ---------- the seeded portfolios ---------- */
  function dayOf(market, dateText) {
    const i = market.cal.indexOf(dateText);
    if (i < 0) throw new Error('No trading day ' + dateText);
    return i;
  }
  PL.dayOf = dayOf;

  function filled(seq, code, side, lots, day, minute, price, reason, extra) {
    return Object.assign(
      { id: 's' + seq, seq, code, side, type: 'market', lots, limit: null, placed: { day, minute }, tradeDay: day, status: 'filled', fill: { price, day, minute }, reason },
      extra || {}
    );
  }

  function buildNadia(market) {
    const D = (t) => dayOf(market, t);
    const S = market.byCode;
    const startDay = D('2026-10-14');
    const orders = [];
    orders.push(filled(1, 'BBCA', 'buy', 30, D('2026-10-15'), 887, S.BBCA.close[D('2026-10-15')], 'Bank terbesar dengan beta rendah. Saya ingin inti portofolio yang stabil.'));
    orders.push(filled(2, 'TLKM', 'buy', 40, D('2026-10-15'), 892, S.TLKM.close[D('2026-10-15')], 'Bisnis data terus tumbuh. Betanya di bawah 1, jadi menyeimbangkan saham tambang yang akan saya beli.'));
    const antmPrice = S.ANTM.close[D('2026-10-16')];
    orders.push(
      Object.assign(filled(3, 'ANTM', 'buy', 60, D('2026-10-16'), 838, antmPrice, 'Harga emas sedang naik. Saya siap menanggung volatilitas tinggi demi imbal hasil yang lebih besar.'), {
        type: 'limit',
        limit: antmPrice + PL.tickSize(antmPrice),
        placed: { day: D('2026-10-16'), minute: 571 },
      })
    );
    orders.push(filled(4, 'ICBP', 'buy', 15, D('2026-10-20'), 612, S.ICBP.close[D('2026-10-20')], 'Saham konsumen primer biasanya bertahan saat pasar turun. Korelasinya dengan bank rendah.'));
    orders.push(filled(5, 'BMRI', 'buy', 25, D('2026-10-27'), 665, S.BMRI.close[D('2026-10-27')], 'Kredit tumbuh dua digit. Saya menambah sektor keuangan.'));
    const asiiDay = D('2026-11-03');
    orders.push({
      id: 's6',
      seq: 6,
      code: 'ASII',
      side: 'buy',
      type: 'limit',
      lots: 10,
      limit: PL.floorToTick(S.ASII.low[asiiDay] * 0.99),
      placed: { day: asiiDay, minute: 575 },
      tradeDay: asiiDay,
      status: 'expired',
      closed: { day: asiiDay, minute: 975 },
      reason: 'Menunggu harga turun sedikit sebelum masuk ke sektor otomotif.',
    });
    orders.push(filled(7, 'ANTM', 'sell', 20, D('2026-11-04'), 860, S.ANTM.close[D('2026-11-04')], 'Harga naik sekitar 7% dalam tiga minggu. Saya mengunci sebagian laba dan menurunkan risiko.'));

    /* A market purchase placed after the close of Friday with all the cash it could use, checked again at the first delayed price of Monday, when the price had risen past that cash. */
    const fri = D('2026-11-06');
    const mon = D('2026-11-09');
    const held = new Set(['BBCA', 'TLKM', 'ANTM', 'ICBP', 'BMRI']);
    const tmp = { startCash: PL.START_CASH, startDay, orders: orders.slice() };
    const cashFri = PL.ledger(tmp).cash;
    let pick = null;
    for (const s of market.stocks) {
      if (held.has(s.code)) continue;
      const placedPrice = s.close[fri];
      const lots = PL.maxBuyLots(cashFri, placedPrice);
      const need = PL.orderAmounts('buy', s.open[mon], lots).total;
      if (need > cashFri && (!pick || s.open[mon] / placedPrice > pick.ratio)) pick = { code: s.code, lots, placedPrice, need, ratio: s.open[mon] / placedPrice };
    }
    if (!pick) throw new Error('No stock rose enough on Monday for the rejected order of the seed');
    orders.push({
      id: 's8',
      seq: 8,
      code: pick.code,
      side: 'buy',
      type: 'market',
      lots: pick.lots,
      limit: null,
      placed: { day: fri, minute: 1180 },
      tradeDay: mon,
      status: 'rejected',
      closed: { day: mon, minute: 550 },
      placedPrice: pick.placedPrice,
      rejection: { kind: 'cash', price: S[pick.code].open[mon], need: pick.need, available: cashFri, placedPrice: pick.placedPrice },
      reason: ({ INCO: 'Menambah saham nikel supaya portofolio tidak terlalu bergantung pada bank.', MDKA: 'Menambah saham tembaga dan emas supaya portofolio tidak terlalu bergantung pada bank.' })[pick.code] || 'Menambah sektor ' + S[pick.code].sector.toLowerCase() + ' supaya portofolio tidak terlalu bergantung pada bank.',
    });
    const tue = D('2026-11-10');
    orders.push({
      id: 's9',
      seq: 9,
      code: 'BBCA',
      side: 'sell',
      type: 'limit',
      lots: 10,
      limit: PL.ceilToTick(S.BBCA.high[tue] * 1.02),
      placed: { day: tue, minute: 560 },
      tradeDay: tue,
      status: 'cancelled',
      closed: { day: tue, minute: 825 },
      reason: 'Ambil sebagian laba jika harga menyentuh target.',
    });
    /* A limit purchase placed this morning below every delayed price so far, at a price that the rest of the day reaches, so it waits now and fills later today. */
    const today = market.today0;
    const placedMinute = 581;
    const nowStep = 15;
    let open = null;
    for (const code of ['KLBF', 'AMRT', 'BBRI', 'BBNI', 'PTBA', 'ASII', 'UNTR', 'INCO', 'MDKA', 'ADRO']) {
      const path = S[code].intraday[today];
      let morning = Infinity;
      for (let k = 1; k <= nowStep + 1; k++) morning = Math.min(morning, path[k]);
      let rest = Infinity;
      for (let k = nowStep + 2; k <= 64; k++) rest = Math.min(rest, path[k]);
      const limit = PL.floorToTick(morning - 1);
      if (rest <= limit) {
        open = { code, limit };
        break;
      }
    }
    if (!open) throw new Error('No stock dips later today for the open order of the seed');
    const openReasons = {
      KLBF: 'Saham kesehatan dengan beta rendah. Saya pasang harga di bawah pasar dan menunggu.',
    };
    orders.push({
      id: 's10',
      seq: 10,
      code: open.code,
      side: 'buy',
      type: 'limit',
      lots: 40,
      limit: open.limit,
      placed: { day: today, minute: placedMinute },
      tradeDay: today,
      status: 'open',
      reason: openReasons[open.code] || 'Menambah sektor ' + S[open.code].sector.toLowerCase() + '. Saya pasang harga di bawah pasar dan menunggu.',
    });
    return { startCash: PL.START_CASH, startDay, orders };
  }
  PL.buildNadia = buildNadia;

  /* The lecturer's own portfolio for demonstrations in class. It starts like a student's, and its reasons name the concept each trade shows. */
  function buildLecturerDemo(market, variant) {
    const D = (t) => dayOf(market, t);
    const S = market.byCode;
    const startDay = D('2026-10-14');
    const at = (code, date) => S[code].close[D(date)];
    const b = variant === 'mp-b';
    const orders = [
      filled(1, 'BBCA', 'buy', 20, D('2026-10-15'), 600, at('BBCA', '2026-10-15'), 'Bank besar dengan beta di bawah 1 sebagai inti portofolio, untuk peragaan di kelas.'),
      filled(2, b ? 'PTBA' : 'ADRO', 'buy', 40, D('2026-10-16'), 610, at(b ? 'PTBA' : 'ADRO', '2026-10-16'), 'Peragaan beta di atas 1, karena saham energi bergerak lebih kuat daripada IHSG.'),
      filled(3, 'ICBP', 'buy', 15, D('2026-10-21'), 640, at('ICBP', '2026-10-21'), 'Peragaan diversifikasi, karena konsumen primer berkorelasi rendah dengan bank.'),
      filled(4, 'TLKM', 'buy', 30, D('2026-10-28'), 620, at('TLKM', '2026-10-28'), 'Peragaan saham defensif dengan dividen yang stabil.'),
      filled(5, b ? 'PTBA' : 'ADRO', 'sell', 15, D('2026-11-06'), 615, at(b ? 'PTBA' : 'ADRO', '2026-11-06'), 'Peragaan mengurangi bobot saham yang menyumbang risiko terbesar.'),
    ];
    return { startCash: PL.START_CASH, startDay, orders };
  }
  PL.buildLecturerDemo = buildLecturerDemo;

  function emptyPortfolio(market, clock) {
    return { startCash: PL.START_CASH, startDay: Math.max(1, (clock ? clock.day : market.today0) - 1), orders: [] };
  }
  PL.emptyPortfolio = emptyPortfolio;

  const REASONS = {
    Keuangan: ['Bank besar dengan laba stabil.', 'Kredit tumbuh dan kualitas aset membaik.', 'Beta di bawah 1 untuk menahan risiko portofolio.', ''],
    Energi: ['Harga batu bara sedang pulih.', 'Dividen tinggi dan arus kas kuat.', 'Menambah sektor yang tidak bergerak bersama bank.', ''],
    'Barang Baku': ['Permintaan nikel untuk baterai terus naik.', 'Siap menanggung volatilitas tinggi.', 'Harga logam sedang menguat.', ''],
    Perindustrian: ['Penjualan alat berat naik.', 'Bisnisnya beragam, dari otomotif sampai tambang.', ''],
    'Barang Konsumen Primer': ['Permintaan stabil saat ekonomi melambat.', 'Beta rendah untuk diversifikasi.', ''],
    Kesehatan: ['Sektor defensif dengan beta rendah.', 'Permintaan obat tumbuh stabil.', ''],
    Infrastruktur: ['Pendapatan data tumbuh.', 'Dividen stabil dan beta rendah.', ''],
  };

  function buildStudent(market, seed, startDay, inactive) {
    const r = PL.mulberry32(seed);
    if (inactive) return { startCash: PL.START_CASH, startDay, orders: [] };
    const codes = market.stocks.map((s) => s.code);
    for (let i = codes.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }
    const k = 2 + Math.floor(r() * 5);
    const pick = codes.slice(0, k);
    const cashShare = 0.03 + r() * 0.3;
    const raw = pick.map(() => 0.3 + r());
    const sum = raw.reduce((a, b) => a + b, 0);
    const orders = [];
    let seq = 1;
    let cash = PL.START_CASH;
    const lastDay = market.today0 - 1;
    const ranked = pick.map((c, i) => ({ c, w: (raw[i] / sum) * (1 - cashShare), day: startDay + 1 + Math.floor(r() * 9) })).sort((a, b) => a.day - b.day);
    for (const item of ranked) {
      const s = market.byCode[item.c];
      const price = s.close[item.day];
      let lots = Math.floor((item.w * PL.START_CASH) / (price * 100 * 1.0015));
      lots = Math.min(lots, PL.maxBuyLots(cash, price));
      if (lots < 1) continue;
      cash -= PL.orderAmounts('buy', price, lots).total;
      const pool = REASONS[s.sector];
      orders.push(filled(seq++, item.c, 'buy', lots, item.day, 560 + Math.floor(r() * 360), price, pool[Math.floor(r() * pool.length)]));
    }
    if (orders.length && r() < 0.4) {
      const o = orders[Math.floor(r() * orders.length)];
      const day = Math.min(lastDay, o.fill.day + 3 + Math.floor(r() * 8));
      const lots = Math.max(1, Math.floor(o.lots / 2));
      const price = market.byCode[o.code].close[day];
      orders.push(filled(seq++, o.code, 'sell', lots, day, 560 + Math.floor(r() * 360), price, r() < 0.5 ? 'Mengunci sebagian laba.' : 'Mengurangi bobot saham ini.'));
      cash += PL.orderAmounts('sell', price, lots).total;
    }
    if (r() < 0.65) {
      const day = lastDay - Math.floor(r() * 3);
      const c = codes[k + Math.floor(r() * 3)];
      const s = market.byCode[c];
      const price = s.close[day];
      const lots = Math.min(PL.maxBuyLots(cash, price), 2 + Math.floor(r() * 12));
      if (lots >= 1) {
        const pool = REASONS[s.sector];
        orders.push(filled(seq++, c, 'buy', lots, day, 560 + Math.floor(r() * 360), price, pool[Math.floor(r() * pool.length)]));
      }
    }
    orders.sort((a, b) => a.fill.day - b.fill.day || a.fill.minute - b.fill.minute);
    orders.forEach((o, i) => {
      o.seq = i + 1;
      o.id = 'x' + seed + '-' + (i + 1);
    });
    return { startCash: PL.START_CASH, startDay, orders };
  }

  const NAMES_A = [
    'Nadia Putri Maharani', 'Rizky Pratama', 'Anisa Rahmawati', 'Bagus Setiawan', 'Ayu Lestari', 'Dimas Arya Nugroho', 'Fajar Ramadhan', 'Putri Ayuningtyas',
    'Kevin Wijaya', 'Larasati Dewi', 'Muhammad Iqbal Hakim', 'Nabila Zahra', 'Andreas Simanjuntak', 'Clarissa Tanjung', 'Yoga Prasetyo', 'Intan Permatasari',
    'Raka Aditya', 'Salsabila Putri', 'Gilang Saputra', 'Dewi Kartika Sari', 'Hendra Gunawan', 'Melati Anggraini', 'Arief Hidayat', 'Tiara Anindya',
    'Bima Wardhana', 'Citra Maharani', 'Reza Firmansyah', 'Wulan Septiani', 'Daniel Hutapea', 'Rahma Aulia', 'Ilham Maulana', 'Vania Gunadi',
  ];
  const NAMES_B = [
    'Aditya Saputra', 'Bella Safitri', 'Cahyo Nugroho', 'Dinda Amalia', 'Eko Prasetyo', 'Farah Nabila', 'Galih Pambudi', 'Hana Pertiwi', 'Irfan Hakim',
    'Jessica Halim', 'Kurniawan Adi', 'Lina Marlina', 'Mario Siregar', 'Nur Aisyah', 'Oscar Tanuwijaya', 'Prita Anjani', 'Qori Ramadhani', 'Rendy Kusuma',
    'Sinta Wulandari', 'Teguh Santoso', 'Utari Ningsih', 'Vino Hartanto', 'Wahyu Hidayat', 'Yulia Rahman', 'Zaki Mubarak', 'Annisa Fitri', 'Bayu Aji', 'Cindy Lestari',
  ];

  function buildClass(market, opts) {
    const startDay = dayOf(market, '2026-10-14');
    const names = opts.names;
    return names.map((name, i) => {
      const id = opts.id + '-' + (i + 1);
      const nim = opts.nimPrefix + String(101 + i * 7).padStart(3, '0');
      if (opts.liveFirst && i === 0) return { id: 'nadia', name, nim, live: true };
      const inactive = i === names.length - 1;
      return { id, name, nim, portfolio: buildStudent(market, opts.seed + i * 977, startDay, inactive) };
    });
  }
  PL.buildClasses = function (market) {
    return {
      'mp-a': buildClass(market, { id: 'a', names: NAMES_A, seed: 4100, liveFirst: true, nimPrefix: '1202220' }),
      'mp-b': buildClass(market, { id: 'b', names: NAMES_B, seed: 8800, liveFirst: false, nimPrefix: '1202221' }),
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
