import { fail, succeed } from "~/result";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type {
  DailyClose,
  DailyHistory,
  Instrument,
  PriceSource,
  Quote,
} from "./price-source.server";
import { yahooFinance } from "./yahoo-price-source.server";

// The closing quotes of 30 October 2026, as Yahoo Finance returned them on 31 October and 1 November 2026, with two exceptions. BMRI keeps its quote of 29 October, as Yahoo does for a stock that did not trade, so the tests see a row from an earlier day. GOTO has a previous close of 18 instead of 23, so the tests see a change with two digits before the decimal point.
const fixtureQuotes: Quote[] = [
  {
    kind: "index",
    code: "IHSG",
    level: indexPoints(5057.05),
    previousLevel: indexPoints(5098.06),
    quotedAt: new Date("2026-10-30T09:00:05.000Z"),
  },
  stockQuote("AADI", [11475, 11125], "2026-10-30T09:14:58.000Z"),
  stockQuote("ADMR", [1250, 1240], "2026-10-30T09:13:30.000Z"),
  stockQuote("ADRO", [2400, 2370], "2026-10-30T09:14:43.000Z"),
  stockQuote("AKRA", [1375, 1400], "2026-10-30T09:11:35.000Z"),
  stockQuote("AMMN", [3650, 3740], "2026-10-30T09:14:16.000Z"),
  stockQuote("AMRT", [915, 955], "2026-10-30T09:14:50.000Z"),
  stockQuote("ANTM", [2620, 2670], "2026-10-30T09:14:56.000Z"),
  stockQuote("ASII", [4800, 4690], "2026-10-30T09:14:58.000Z"),
  stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55.000Z"),
  stockQuote("BBNI", [3320, 3240], "2026-10-30T09:14:14.000Z"),
  stockQuote("BBRI", [2800, 2810], "2026-10-30T09:14:56.000Z"),
  stockQuote("BBTN", [900, 910], "2026-10-30T09:14:57.000Z"),
  stockQuote("BMRI", [3720, 3720], "2026-10-29T09:14:58.000Z"),
  stockQuote("BRPT", [1070, 1150], "2026-10-30T09:13:38.000Z"),
  stockQuote("BUMI", [119, 121], "2026-10-30T09:14:28.000Z"),
  stockQuote("CPIN", [2550, 2590], "2026-10-30T09:14:57.000Z"),
  stockQuote("DEWA", [214, 226], "2026-10-30T09:14:45.000Z"),
  stockQuote("ELSA", [625, 620], "2026-10-30T09:13:43.000Z"),
  stockQuote("EMTK", [296, 304], "2026-10-30T09:12:41.000Z"),
  stockQuote("ESSA", [500, 505], "2026-10-30T09:13:28.000Z"),
  stockQuote("EXCL", [1720, 1625], "2026-10-30T09:14:17.000Z"),
  stockQuote("GOTO", [24, 18], "2026-10-30T09:14:45.000Z"),
  stockQuote("HRTA", [1430, 1510], "2026-10-30T09:14:04.000Z"),
  stockQuote("ICBP", [5475, 5575], "2026-10-30T09:12:49.000Z"),
  stockQuote("INCO", [3420, 3400], "2026-10-30T09:14:59.000Z"),
  stockQuote("INDF", [6400, 6275], "2026-10-30T09:11:44.000Z"),
  stockQuote("INDY", [1780, 1860], "2026-10-30T09:14:26.000Z"),
  stockQuote("INKP", [6575, 6525], "2026-10-30T09:06:33.000Z"),
  stockQuote("ISAT", [1365, 1465], "2026-10-30T09:14:58.000Z"),
  stockQuote("ITMG", [24900, 24600], "2026-10-30T09:10:44.000Z"),
  stockQuote("JPFA", [1740, 1735], "2026-10-30T09:14:41.000Z"),
  stockQuote("KLBF", [730, 715], "2026-10-30T09:13:52.000Z"),
  stockQuote("MAPI", [1235, 1260], "2026-10-30T09:08:59.000Z"),
  stockQuote("MBMA", [298, 306], "2026-10-30T09:14:18.000Z"),
  stockQuote("MDKA", [1855, 1920], "2026-10-30T09:14:42.000Z"),
  stockQuote("MEDC", [1390, 1340], "2026-10-30T09:14:58.000Z"),
  stockQuote("NCKL", [725, 725], "2026-10-30T09:14:00.000Z"),
  stockQuote("PGAS", [1320, 1215], "2026-10-30T09:14:52.000Z"),
  stockQuote("PGEO", [905, 960], "2026-10-30T09:13:54.000Z"),
  stockQuote("PTBA", [3240, 3060], "2026-10-30T09:14:32.000Z"),
  stockQuote("SMGR", [1335, 1365], "2026-10-30T09:13:07.000Z"),
  stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:51.000Z"),
  stockQuote("UNTR", [24200, 24550], "2026-10-30T09:03:16.000Z"),
  stockQuote("UNVR", [1390, 1400], "2026-10-30T09:14:51.000Z"),
  stockQuote("WIFI", [910, 935], "2026-10-30T09:14:29.000Z"),
];

// The closes of each instrument in the last week of October 2026, as Yahoo Finance returned them on 1 November 2026. The closes of BMRI are as Yahoo returned them, including 30 October.
const fixtureDates = [
  "2026-10-26",
  "2026-10-27",
  "2026-10-28",
  "2026-10-29",
  "2026-10-30",
];
const fixtureCloses: Record<string, readonly number[]> = {
  IHSG: [5373.09, 5266.13, 5282.31, 5098.06, 5057.05],
  AADI: [11525, 11700, 11650, 11125, 11475],
  ADMR: [1275, 1255, 1270, 1240, 1250],
  ADRO: [2450, 2460, 2440, 2370, 2400],
  AKRA: [1400, 1435, 1405, 1400, 1375],
  AMMN: [3960, 3760, 3900, 3740, 3650],
  AMRT: [1045, 1040, 1020, 955, 915],
  ANTM: [2760, 2770, 2800, 2670, 2620],
  ASII: [4560, 4630, 5000, 4690, 4800],
  BBCA: [4940, 4900, 5275, 4940, 4980],
  BBNI: [3470, 3310, 3350, 3240, 3320],
  BBRI: [2910, 2900, 2920, 2810, 2800],
  BBTN: [935, 925, 935, 910, 900],
  BMRI: [3910, 3870, 3840, 3720, 3720],
  BRPT: [1420, 1325, 1235, 1150, 1070],
  BUMI: [137, 128, 127, 121, 119],
  CPIN: [2710, 2780, 2670, 2590, 2550],
  DEWA: [260, 242, 240, 226, 214],
  ELSA: [640, 685, 655, 620, 625],
  EMTK: [336, 318, 324, 304, 296],
  ESSA: [515, 535, 525, 505, 500],
  EXCL: [1795, 1730, 1690, 1625, 1720],
  GOTO: [25, 24, 24, 23, 24],
  HRTA: [1660, 1605, 1595, 1510, 1430],
  ICBP: [5975, 5750, 5775, 5575, 5475],
  INCO: [3720, 3500, 3620, 3400, 3420],
  INDF: [6675, 6650, 6375, 6275, 6400],
  INDY: [2110, 2020, 1995, 1860, 1780],
  INKP: [6950, 6800, 6750, 6525, 6575],
  ISAT: [1700, 1685, 1570, 1465, 1365],
  ITMG: [25200, 24650, 24975, 24600, 24900],
  JPFA: [1785, 1785, 1810, 1735, 1740],
  KLBF: [725, 710, 735, 715, 730],
  MAPI: [1325, 1320, 1320, 1260, 1235],
  MBMA: [354, 330, 326, 306, 298],
  MDKA: [2060, 2000, 2050, 1920, 1855],
  MEDC: [1450, 1410, 1405, 1340, 1390],
  NCKL: [775, 735, 750, 725, 725],
  PGAS: [1315, 1240, 1280, 1215, 1320],
  PGEO: [1010, 980, 990, 960, 905],
  PTBA: [3220, 3170, 3250, 3060, 3240],
  SMGR: [1465, 1485, 1440, 1365, 1335],
  TLKM: [2250, 2140, 2070, 1980, 1980],
  UNTR: [25000, 26500, 25600, 24550, 24200],
  UNVR: [1425, 1395, 1405, 1400, 1390],
  WIFI: [1040, 970, 1005, 935, 910],
};

// The quotes and closes are answers of Yahoo Finance, so the source describes itself as Yahoo Finance.
export const fixturePriceSource: PriceSource = {
  ...yahooFinance,
  fetchQuotes(instruments) {
    const quotes = fixtureQuotes.filter((quote) =>
      instruments.some((instrument) => instrument.code === quote.code),
    );
    return Promise.resolve(succeed({ quotes, problems: [] }));
  },
  fetchDailyHistory(instrument, from) {
    const closes = fixtureCloses[instrument.code];
    if (closes === undefined) {
      return Promise.resolve(
        fail(`The fixture has no history of ${instrument.code}.`),
      );
    }
    return Promise.resolve(
      succeed(historyOf(instrument, datedCloses(closes, from))),
    );
  },
};

function stockQuote(
  code: string,
  [price, previousClose]: [number, number],
  quotedAt: string,
): Quote {
  return {
    kind: "stock",
    code,
    price: rupiah(price),
    previousClose: rupiah(previousClose),
    quotedAt: new Date(quotedAt),
  };
}

function datedCloses(
  closes: readonly number[],
  from: string,
): DailyClose<number>[] {
  const dated: DailyClose<number>[] = [];
  for (const [index, date] of fixtureDates.entries()) {
    const close = closes[index];
    if (close === undefined) {
      throw new Error(`The fixture has no close on ${date}.`);
    }
    if (date >= from) {
      dated.push({ date, close });
    }
  }
  return dated;
}

function historyOf(
  instrument: Instrument,
  closes: readonly DailyClose<number>[],
): DailyHistory {
  switch (instrument.kind) {
    case "stock":
      return {
        kind: "stock",
        code: instrument.code,
        closes: closes.map(({ date, close }) => ({
          date,
          close: splitAdjustedRupiah(close),
        })),
      };
    case "index":
      return {
        kind: "index",
        code: instrument.code,
        closes: closes.map(({ date, close }) => ({
          date,
          close: indexPoints(close),
        })),
      };
  }
}
