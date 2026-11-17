import type { Database } from "../../database/database.server.ts";
import { fail, succeed } from "../../result.ts";
import { rupiah } from "../../units/rupiah.ts";
import { indexPoints } from "../../units/index-points.ts";
import { lastContinuousTradingMoment } from "../market-data/idx-calendar.ts";
import { buildDailyHistory } from "../market-data/build-daily-history.ts";
import { saveDailyHistory } from "../market-data/history-store.server.ts";
import { trackedInstruments } from "../market-data/tracked-instruments.ts";
import type {
  Instrument,
  PriceSource,
  Quote,
} from "../market-data/price-source.server.ts";
import { monthEndClosesForTest } from "../measures/month-end-closes-for-test.ts";

import {
  sampleDatesForTest,
  sampleCloseRecordingsForTest,
} from "./sample-close-recordings-for-test.ts";

export const sampleMomentForTest = new Date("2026-11-16T03:00:00Z");

function recordedCloses(code: string): [string, number][] | undefined {
  const record = sampleCloseRecordingsForTest[code];
  if (record === undefined) return undefined;
  const dates = sampleDatesForTest.slice(
    sampleDatesForTest.indexOf(record.from),
  );
  return record.closes.map((close, index) => {
    const date = dates[index];
    if (date === undefined)
      throw new Error("The sample fixture has more closes than dates.");
    return [date, close];
  });
}

function historyOf(instrument: Instrument, from: string) {
  const closes = recordedCloses(instrument.code);
  const shared = sharedMonthEnds(instrument.code);
  const firstRecordedDate = closes?.[0]?.[0] ?? from;
  return closes === undefined
    ? undefined
    : buildDailyHistory(
        instrument,
        [
          ...(shared?.closes
            .filter((close) => close.date < firstRecordedDate)
            .map((close): [string, number] => [close.date, close.close]) ?? []),
          ...closes,
        ].filter(([date]) => date >= from),
      );
}

function sharedMonthEnds(code: string) {
  switch (code) {
    case "IHSG":
    case "BBCA":
    case "TLKM":
    case "ASII":
    case "AMMN":
      return monthEndClosesForTest(code);
    default:
      return undefined;
  }
}

export function saveSampleHistoryForTest(database: Database): void {
  for (const instrument of trackedInstruments) {
    const history = historyOf(instrument, "2021-08-01");
    if (history !== undefined) saveDailyHistory(database, history);
  }
}

export const samplePriceSourceForTest: PriceSource = {
  name: "Recorded sample prices",
  delayMinutes: 10,
  fetchDailyHistory(instrument, from) {
    const history = historyOf(instrument, from);
    return Promise.resolve(
      history === undefined
        ? fail(`The sample fixture has no history of ${instrument.code}.`)
        : succeed(history),
    );
  },
  fetchQuotes(instruments) {
    const quotes: Quote[] = [];
    for (const instrument of instruments) {
      const closes = recordedCloses(instrument.code);
      const last = closes?.at(-1);
      const previous = closes?.at(-2);
      if (last === undefined || previous === undefined) continue;
      const moment = lastContinuousTradingMoment(last[0]);
      if (!moment.ok) throw new Error(moment.failure);
      const quotedAt = moment.value;
      switch (instrument.kind) {
        case "stock":
          quotes.push({
            kind: "stock",
            code: instrument.code,
            price: rupiah(last[1]),
            previousClose: rupiah(previous[1]),
            // Yahoo's daily chart of 13 November 2026 supplies the recorded BBCA bounds.
            dayRange:
              instrument.code === "BBCA"
                ? { low: rupiah(5425), high: rupiah(5650) }
                : undefined,
            quotedAt,
          });
          break;
        case "index":
          quotes.push({
            kind: "index",
            code: instrument.code,
            level: indexPoints(last[1]),
            previousLevel: indexPoints(previous[1]),
            quotedAt,
          });
          break;
      }
    }
    return Promise.resolve(succeed({ quotes, problems: [] }));
  },
};
