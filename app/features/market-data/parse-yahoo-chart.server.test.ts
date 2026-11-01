import { expect, test } from "vitest";
import { parseYahooChart } from "./parse-yahoo-chart.server";
import type { Instrument } from "./price-source.server";

// The rows are the closes of 29 and 30 October 2026 as Yahoo Finance returned them on 1 November 2026, dated at 09:00 WIB of each trading day. Each rejection test changes one field.
const bbca: Instrument = { kind: "stock", code: "BBCA" };
const ihsg: Instrument = { kind: "index", code: "IHSG" };
const source = "The Yahoo Finance history of BBCA";

function chart(rows: readonly unknown[], currency: unknown = "IDR"): unknown {
  return { meta: { currency, symbol: "BBCA.JK" }, quotes: rows };
}

function row(date: string, close: unknown): unknown {
  return {
    date: new Date(date),
    open: 4900,
    high: 5025,
    low: 4900,
    close,
    volume: 286_386_300,
  };
}

test("reads the closes of a stock on their dates in WIB, oldest first", () => {
  expect(
    parseYahooChart(
      chart([
        row("2026-10-29T02:00:00.000Z", 4940),
        row("2026-10-30T02:00:00.000Z", 4980),
      ]),
      source,
      bbca,
    ),
  ).toEqual({
    ok: true,
    value: {
      kind: "stock",
      code: "BBCA",
      closes: [
        { date: "2026-10-29", close: 4940 },
        { date: "2026-10-30", close: 4980 },
      ],
    },
  });
});

test("rounds the 32-bit floats of a chart to the two decimals of a quote", () => {
  expect(
    parseYahooChart(
      chart([
        row("2026-10-29T02:00:00.000Z", 5098.05712890625),
        row("2026-10-30T02:00:00.000Z", 5057.0498046875),
      ]),
      "The Yahoo Finance history of IHSG",
      ihsg,
    ),
  ).toEqual({
    ok: true,
    value: {
      kind: "index",
      code: "IHSG",
      closes: [
        { date: "2026-10-29", close: 5098.06 },
        { date: "2026-10-30", close: 5057.05 },
      ],
    },
  });
});

test("keeps the fraction of a close that a later split divided", () => {
  // Yahoo Finance returned this close of CUAN for 23 October 2024 on 1 November 2026, because a later split divided the price of that day.
  const history = parseYahooChart(
    chart([row("2024-10-23T02:00:00.000Z", 817.5)]),
    "The Yahoo Finance history of CUAN",
    { kind: "stock", code: "CUAN" },
  );
  expect(history.ok && history.value.closes).toEqual([
    { date: "2024-10-23", close: 817.5 },
  ]);
});

test("skips a row without a close, and keeps the later of two rows of one day", () => {
  const history = parseYahooChart(
    chart([
      row("2026-10-29T02:00:00.000Z", 4940),
      row("2026-10-30T02:00:00.000Z", null),
      row("2026-10-30T02:00:00.000Z", 4970),
      row("2026-10-30T09:14:55.000Z", 4980),
    ]),
    source,
    bbca,
  );
  expect(history.ok && history.value.closes).toEqual([
    { date: "2026-10-29", close: 4940 },
    { date: "2026-10-30", close: 4980 },
  ]);
});

test("dates a close by its day in WIB, not in UTC", () => {
  // 17:30 UTC on 29 October is 00:30 WIB on 30 October.
  const history = parseYahooChart(
    chart([row("2026-10-29T17:30:00.000Z", 4980)]),
    source,
    bbca,
  );
  expect(history.ok && history.value.closes).toEqual([
    { date: "2026-10-30", close: 4980 },
  ]);
});

test("rejects a chart in another currency", () => {
  expect(
    parseYahooChart(
      chart([row("2026-10-30T02:00:00.000Z", 4980)], "USD"),
      source,
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure:
      'The Yahoo Finance history of BBCA must be in IDR, but its currency is "USD".',
  });
});

test("rejects a chart that is not an object or has no list of quotes", () => {
  expect(parseYahooChart("Too many requests", source, bbca)).toEqual({
    ok: false,
    failure:
      'The Yahoo Finance history of BBCA must be an object, but it is "Too many requests".',
  });
  expect(parseYahooChart({ meta: { currency: "IDR" } }, source, bbca)).toEqual({
    ok: false,
    failure:
      "The Yahoo Finance history of BBCA must have a list of quotes, but it is missing.",
  });
});

test("rejects a row without a valid time and names the row", () => {
  const dates: readonly [unknown, string][] = [
    ["2026-10-30", '"2026-10-30"'],
    [new Date("not a date"), "an invalid date"],
    [undefined, "missing"],
  ];
  for (const [date, described] of dates) {
    expect(
      parseYahooChart(
        chart([row("2026-10-29T02:00:00.000Z", 4940), { date, close: 4980 }]),
        source,
        bbca,
      ),
    ).toEqual({
      ok: false,
      failure: `The Yahoo Finance history of BBCA must have a time in the date of each row, but the date of row 2 is ${described}.`,
    });
  }
});

test("rejects a close that is not a positive finite number and names the row", () => {
  const closes: readonly [unknown, string][] = [
    [0, "0"],
    [-4980, "-4980"],
    [0.004, "0.004"],
    [Number.POSITIVE_INFINITY, "Infinity"],
    ["4980", '"4980"'],
    ["", "empty"],
    [undefined, "missing"],
  ];
  for (const [close, described] of closes) {
    expect(
      parseYahooChart(
        chart([row("2026-10-30T02:00:00.000Z", close)]),
        source,
        bbca,
      ),
    ).toEqual({
      ok: false,
      failure: `The Yahoo Finance history of BBCA must have a positive close or null in each row, but the close of row 1 is ${described}.`,
    });
  }
});
