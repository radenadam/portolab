import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test } from "vitest";
import { getLocale, overwriteGetLocale } from "~/paraglide/runtime.js";
import { rupiah } from "~/units/rupiah";
import type { Quote } from "./price-source.server";
import { PricesView } from "./prices-view";
import type { UpdateAttempt } from "./quote-store.server";

const defaultGetLocale = getLocale;

afterEach(() => {
  overwriteGetLocale(defaultGetLocale);
});

// The closes of 30 October 2026, and a BBRI price that the source stopped sending two weeks earlier.
const quotes: Quote[] = [
  {
    kind: "stock",
    code: "BBCA",
    price: rupiah(4980),
    previousClose: rupiah(4940),
    quotedAt: new Date("2026-10-30T09:14:55.000Z"),
  },
  {
    kind: "stock",
    code: "BBRI",
    price: rupiah(2800),
    previousClose: rupiah(2810),
    quotedAt: new Date("2026-10-16T09:14:56.000Z"),
  },
];
const failedAttempt: UpdateAttempt = {
  attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
  succeeded: false,
  consecutiveFailures: 1,
};
const succeededAttempt: UpdateAttempt = {
  attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
  succeeded: true,
  consecutiveFailures: 0,
};

// Every combination of stored prices and the latest attempt, with the sentences that must appear and the ones that must not.
const states = [
  {
    name: "stored prices after a failed attempt",
    quotes,
    latestAttempt: failedAttempt,
    shows: {
      id: [
        "Portolab tidak dapat memperbarui harga pada 30 Okt 2026, 16.30 WIB, jadi harga di bawah adalah harga terakhir yang tersimpan. Portolab mencoba lagi dengan jeda yang makin panjang.",
        "Harga tertunda sekitar 10 menit",
      ],
      en: [
        "Portolab could not update the prices at Oct 30, 2026, 4:30 PM WIB, so the prices below are the last ones it stored. Portolab tries again after longer and longer pauses.",
        "Prices are delayed by about 10 minutes",
      ],
    },
    hides: { id: ["belum memiliki harga"], en: ["has no prices yet"] },
  },
  {
    name: "stored prices after a successful attempt",
    quotes,
    latestAttempt: succeededAttempt,
    shows: {
      id: ["Harga tertunda sekitar 10 menit"],
      en: ["Prices are delayed by about 10 minutes"],
    },
    hides: {
      id: ["tidak dapat memperbarui", "belum memiliki harga"],
      en: ["could not update", "has no prices yet"],
    },
  },
  {
    name: "no stored prices after a failed attempt",
    quotes: [],
    latestAttempt: failedAttempt,
    shows: {
      id: [
        "Portolab belum memiliki harga, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 16.30 WIB gagal. Portolab mencoba lagi dengan jeda yang makin panjang.",
      ],
      en: [
        "Portolab has no prices yet, because its latest attempt to fetch them at Oct 30, 2026, 4:30 PM WIB failed. Portolab tries again after longer and longer pauses.",
      ],
    },
    hides: {
      id: ["harga di bawah", "Harga tertunda"],
      en: ["prices below", "Prices are delayed"],
    },
  },
  {
    name: "no stored prices before any attempt",
    quotes: [],
    latestAttempt: undefined,
    shows: {
      id: [
        "Portolab belum memiliki harga. Portolab mengambilnya saat server dimulai, lalu selama jam bursa.",
      ],
      en: [
        "Portolab has no prices yet. It fetches them when the server starts, and then during trading hours.",
      ],
    },
    hides: {
      id: ["gagal", "Harga tertunda"],
      en: ["failed", "Prices are delayed"],
    },
  },
];

for (const state of states) {
  for (const language of ["id", "en"] as const) {
    test(`says the right thing for ${state.name} in ${language === "id" ? "Bahasa Indonesia" : "English"}`, () => {
      overwriteGetLocale(() => language);
      const html = renderToStaticMarkup(
        <PricesView
          quotes={state.quotes}
          latestAttempt={state.latestAttempt}
        />,
      );
      for (const sentence of state.shows[language]) {
        expect(html).toContain(sentence);
      }
      for (const sentence of state.hides[language]) {
        expect(html).not.toContain(sentence);
      }
    });
  }
}

test("dates a price from another day than the newest one, in both languages", () => {
  const indonesian = renderToStaticMarkup(
    <PricesView quotes={quotes} latestAttempt={succeededAttempt} />,
  );
  expect(indonesian).toContain(">16 Okt 2026, 16.14<");
  expect(indonesian).toContain(">16.14<");
  overwriteGetLocale(() => "en");
  const english = renderToStaticMarkup(
    <PricesView quotes={quotes} latestAttempt={succeededAttempt} />,
  );
  expect(english).toContain(">Oct 16, 2026, 4:14 PM<");
  expect(english).toContain(">4:14 PM<");
});
