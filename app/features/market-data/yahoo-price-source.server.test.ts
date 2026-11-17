import { afterEach, expect, test, vi } from "vitest";
import type { Result } from "~/result";
import type { Instrument } from "./price-source.server";
import {
  collectYahooQuotes,
  createYahooPriceSource,
} from "./yahoo-price-source.server";

afterEach(() => {
  vi.unstubAllGlobals();
});

// The valid quotes are the closes of 30 October 2026, as Yahoo Finance returned them. Each rejection test changes one field.
const bbcaQuotedAt = new Date("2026-10-30T09:14:55.000Z");
const ihsgQuotedAt = new Date("2026-10-30T09:00:05.000Z");
const bbca: Instrument = { kind: "stock", code: "BBCA" };
const ihsg: Instrument = { kind: "index", code: "IHSG" };

// The low and high are the recorded BBCA bounds of 30 October 2026 in Yahoo's daily chart.
const recordedBbca = {
  symbol: "BBCA.JK",
  currency: "IDR",
  regularMarketPrice: 4980,
  regularMarketPreviousClose: 4940,
  regularMarketDayLow: 4900,
  regularMarketDayHigh: 5025,
  regularMarketTime: bbcaQuotedAt,
};

test("reads a stock quote in whole rupiah", () => {
  const batch = collectYahooQuotes([bbca], [recordedBbca]);
  expect(batch).toEqual({
    quotes: [
      {
        kind: "stock",
        code: "BBCA",
        price: 4980,
        previousClose: 4940,
        dayRange: { low: 4900, high: 5025 },
        quotedAt: bbcaQuotedAt,
      },
    ],
    problems: [],
  });
});

test.each([
  [undefined, undefined],
  [null, null],
  [null, undefined],
  [undefined, null],
  [4900, null],
  [null, 5025],
  [4900, undefined],
  [undefined, 5025],
])(
  "keeps a usable quote without a complete day range when the bounds are %s and %s",
  (low, high) => {
    const batch = collectYahooQuotes(
      [bbca],
      [
        {
          ...recordedBbca,
          regularMarketDayLow: low,
          regularMarketDayHigh: high,
        },
      ],
    );
    expect(batch.problems).toEqual([]);
    expect(batch.quotes).toHaveLength(1);
    expect(batch.quotes[0]).toMatchObject({ price: 4980, dayRange: undefined });
  },
);

for (const field of ["regularMarketDayLow", "regularMarketDayHigh"] as const) {
  test.each([
    [0, "0"],
    [-1, "-1"],
    [4900.5, "4900.5"],
    [Number.NaN, "NaN"],
    [Infinity, "Infinity"],
    [Number.MAX_SAFE_INTEGER + 1, "9007199254740992"],
    ["4900", '"4900"'],
    [{}, "{}"],
  ])(`rejects an invalid ${field} of %s`, (value, description) => {
    const batch = collectYahooQuotes(
      [bbca],
      [{ ...recordedBbca, [field]: value }],
    );
    expect(batch.quotes).toEqual([]);
    expect(batch.problems).toEqual([
      `The Yahoo Finance quote for BBCA must have positive whole rupiah at ${field} or no value, but it is ${description}.`,
    ]);
  });
}

test.each([
  [4990, 5025],
  [4900, 4970],
  [5025, 4900],
])(
  "rejects a day range that excludes its price with bounds %s and %s",
  (low, high) => {
    const batch = collectYahooQuotes(
      [bbca],
      [
        {
          ...recordedBbca,
          regularMarketDayLow: low,
          regularMarketDayHigh: high,
        },
      ],
    );
    expect(batch.quotes).toEqual([]);
    expect(batch.problems).toEqual([
      `The Yahoo Finance quote for BBCA must have regularMarketDayLow at or below its price and regularMarketDayHigh at or above it, but its low is ${String(low)}, its price is 4980, and its high is ${String(high)}.`,
    ]);
  },
);

test("reads the first trade after a suspension when both bounds equal its price", () => {
  const batch = collectYahooQuotes(
    [bbca],
    [
      {
        ...recordedBbca,
        regularMarketDayLow: 4980,
        regularMarketDayHigh: 4980,
      },
    ],
  );
  expect(batch.problems).toEqual([]);
  expect(batch.quotes[0]).toMatchObject({
    dayRange: { low: 4980, high: 4980 },
  });
});

test("reads the IHSG level from the ^JKSE symbol", () => {
  const batch = collectYahooQuotes(
    [ihsg],
    [
      {
        symbol: "^JKSE",
        currency: "IDR",
        regularMarketPrice: 5057.05,
        regularMarketPreviousClose: 5098.06,
        regularMarketTime: ihsgQuotedAt,
      },
    ],
  );
  expect(batch.quotes).toEqual([
    {
      kind: "index",
      code: "IHSG",
      level: 5057.05,
      previousLevel: 5098.06,
      quotedAt: ihsgQuotedAt,
    },
  ]);
});

test("reports a missing quote without dropping the others", () => {
  const batch = collectYahooQuotes(
    [bbca, ihsg],
    [
      {
        symbol: "^JKSE",
        currency: "IDR",
        regularMarketPrice: 5057.05,
        regularMarketPreviousClose: 5098.06,
        regularMarketTime: ihsgQuotedAt,
      },
    ],
  );
  expect(batch.quotes).toHaveLength(1);
  expect(batch.problems).toEqual(["Yahoo Finance returned no quote for BBCA."]);
});

test("rejects a stock price with a fraction of a rupiah", () => {
  const batch = collectYahooQuotes(
    [bbca],
    [
      {
        symbol: "BBCA.JK",
        currency: "IDR",
        regularMarketPrice: 4980.5,
        regularMarketPreviousClose: 4940,
        regularMarketTime: bbcaQuotedAt,
      },
    ],
  );
  expect(batch.quotes).toEqual([]);
  expect(batch.problems).toEqual([
    "The Yahoo Finance quote for BBCA must have whole rupiah, but its price is 4980.5 and its previous close is 4940.",
  ]);
});

test("rejects a quote whose time is not a valid date", () => {
  const batch = collectYahooQuotes(
    [bbca],
    [
      {
        symbol: "BBCA.JK",
        currency: "IDR",
        regularMarketPrice: 4980,
        regularMarketPreviousClose: 4940,
        regularMarketTime: new Date("not a date"),
      },
    ],
  );
  expect(batch.problems).toEqual([
    "The Yahoo Finance quote for BBCA must have a time at regularMarketTime, but it is an invalid date.",
  ]);
});

test("rejects a quote in another currency", () => {
  const batch = collectYahooQuotes(
    [bbca],
    [
      {
        symbol: "BBCA.JK",
        currency: "USD",
        regularMarketPrice: 4980,
        regularMarketPreviousClose: 4940,
        regularMarketTime: bbcaQuotedAt,
      },
    ],
  );
  expect(batch.problems).toEqual([
    'The Yahoo Finance quote for BBCA must be in IDR, but its currency is "USD".',
  ]);
});

interface StubbedRequest {
  url: string;
  signal: AbortSignal | null | undefined;
}

// The client calls the global fetch, so this stand-in sees each request without the network, and fails it.
function stubFetch(): StubbedRequest[] {
  const requests: StubbedRequest[] = [];
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    requests.push({ url, signal: init?.signal });
    return Promise.reject(new Error("The price job stopped waiting."));
  });
  return requests;
}

const fetchesWithSignal: {
  name: string;
  fetch: (signal: AbortSignal) => Promise<Result<unknown, string>>;
  failure: RegExp;
}[] = [
  {
    name: "quotes",
    fetch: (signal) => createYahooPriceSource().fetchQuotes([bbca], signal),
    failure:
      /^Yahoo Finance did not answer with quotes that its client could read\. The client reported: \S/,
  },
  {
    name: "a history",
    fetch: (signal) =>
      createYahooPriceSource().fetchDailyHistory(bbca, "2026-10-26", signal),
    failure:
      /^Yahoo Finance did not answer with a history of BBCA that its client could read\. The client reported: \S/,
  },
];

for (const { name, fetch, failure } of fetchesWithSignal) {
  test(`passes the signal of the job to every request for ${name}, and fails when it aborts`, async () => {
    const requests = stubFetch();
    const controller = new AbortController();
    controller.abort();
    const result = await fetch(controller.signal);
    expect(result.ok ? "" : result.failure).toMatch(failure);
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.signal, request.url).toBe(controller.signal);
    }
  });
}

test("asks for the history from the start of the day in WIB", async () => {
  const requests = stubFetch();
  await createYahooPriceSource().fetchDailyHistory(
    bbca,
    "2026-10-26",
    new AbortController().signal,
  );
  // 00:00 WIB on 26 October 2026 is 17:00 UTC on 25 October, which is 1792947600 seconds after 1970.
  expect(
    requests.some((request) => request.url.includes("period1=1792947600")),
  ).toBe(true);
});
