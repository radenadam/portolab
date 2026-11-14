import { fail, succeed } from "~/result";
import { indexPoints } from "~/units/index-points";
import { fixtureHistory } from "./fixture-history";
import { stockQuote } from "./stock-quote";
import type { PriceSource, Quote } from "./price-source.server";
import { yahooFinance } from "./yahoo-price-source.server";

// The closing quotes of the first recorded period on 30 October 2026, as Yahoo Finance returned them on 31 October and 1 November 2026, with three exceptions. BMRI keeps its quote of 29 October, as Yahoo does for a stock that did not trade, so the tests see a row from an earlier day. GOTO has a previous close of 18 instead of 23, so the tests see a change with two digits before the decimal point. UNVR and WIFI are left out, as Yahoo leaves out a stock now and then, so every update lacks them, and left-out-quotes-for-test.ts keeps their quotes. The browser tests store the quote of UNVR before the server starts, so they see a price that the latest update missed in UNVR and a stock without any price in WIFI.
// ERAA, GGRM, and PWON joined the fixture after those quotes could be recorded, so they replay the daily closes that fixture-history.ts records, at 16:00 WIB.
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
  stockQuote("ERAA", [482, 515], "2026-10-30T09:00:00.000Z"),
  stockQuote("ESSA", [500, 505], "2026-10-30T09:13:28.000Z"),
  stockQuote("EXCL", [1720, 1625], "2026-10-30T09:14:17.000Z"),
  stockQuote("GGRM", [16400, 16025], "2026-10-30T09:00:00.000Z"),
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
  stockQuote("PWON", [282, 286], "2026-10-30T09:00:00.000Z"),
  stockQuote("SMGR", [1335, 1365], "2026-10-30T09:13:07.000Z"),
  stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:51.000Z"),
  stockQuote("UNTR", [24200, 24550], "2026-10-30T09:03:16.000Z"),
];

// The recorded prices come from Yahoo Finance, so the source describes itself as Yahoo Finance.
export const fixturePriceSource: PriceSource = {
  ...yahooFinance,
  fetchQuotes(instruments) {
    const quotes: Quote[] = [];
    const problems: string[] = [];
    for (const instrument of instruments) {
      const quote = fixtureQuotes.find(
        (candidate) => candidate.code === instrument.code,
      );
      if (quote === undefined) {
        problems.push(`The fixture records no quote of ${instrument.code}.`);
      } else {
        quotes.push(quote);
      }
    }
    return Promise.resolve(succeed({ quotes, problems }));
  },
  fetchDailyHistory(instrument, from) {
    const history = fixtureHistory(instrument, from);
    return Promise.resolve(
      history === undefined
        ? fail(`The fixture has no history of ${instrument.code}.`)
        : succeed(history),
    );
  },
};
