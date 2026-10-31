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

const languageNames = { id: "Bahasa Indonesia", en: "English" } as const;

// The closes of 30 October 2026, and a BBRI price that the source stopped sending two weeks earlier. Portolab has stored no price for TLKM and ASII.
const quotes: Quote[] = [
  {
    kind: "index",
    code: "IHSG",
    level: 5057.05,
    previousLevel: 5098.06,
    quotedAt: new Date("2026-10-30T09:00:05.000Z"),
  },
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
  {
    kind: "stock",
    code: "BMRI",
    price: rupiah(3720),
    previousClose: rupiah(3720),
    quotedAt: new Date("2026-10-30T09:14:58.000Z"),
  },
];

// A failure at 16:30 WIB on Friday 30 October 2026, after the price hours, so the job tries again on Monday at 08:45 WIB.
function failedAttempt(failedCodes: string[]): UpdateAttempt {
  return {
    attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
    succeeded: false,
    consecutiveFailures: 1,
    failedCodes,
  };
}
const succeededAttempt: UpdateAttempt = {
  attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
  succeeded: true,
  consecutiveFailures: 0,
  failedCodes: [],
};

// An answer at 14:00 WIB during the session that lacked some prices, so the job tries again in the next minute.
function partialAttempt(failedCodes: string[]): UpdateAttempt {
  return {
    attemptedAt: new Date("2026-10-30T07:00:00.000Z"),
    succeeded: true,
    consecutiveFailures: 0,
    failedCodes,
  };
}

const nextMinute = {
  id: "Portolab mencoba lagi pada 30 Okt 2026, 14.01 WIB.",
  en: "Portolab tries again at Oct 30, 2026, 2:01 PM WIB.",
};
const nextMonday = {
  id: "Portolab mencoba lagi pada 2 Nov 2026, 08.45 WIB.",
  en: "Portolab tries again at Nov 2, 2026, 8:45 AM WIB.",
};
const staleSentences = {
  id: "di bawah adalah harga terakhir yang tersimpan",
  en: "below is the last one it stored",
};
const missingSentences = { id: "belum memiliki harga", en: "has no price" };

// Every combination of stored prices and the latest attempt, with each failed price stored or missing, and the whole notice that each one shows.
const states = [
  {
    name: "stored prices after a failed attempt",
    quotes,
    latestAttempt: failedAttempt(["IHSG", "BBCA", "BBRI", "BMRI"]),
    shows: {
      id: `Portolab tidak dapat memperbarui harga pada 30 Okt 2026, 16.30 WIB, jadi harga di bawah adalah harga terakhir yang tersimpan. ${nextMonday.id}`,
      en: `Portolab could not update the prices at Oct 30, 2026, 4:30 PM WIB, so the prices below are the last ones it stored. ${nextMonday.en}`,
    },
    hides: missingSentences,
  },
  {
    name: "stored prices after a failed attempt that also lacked a price never stored",
    quotes,
    latestAttempt: failedAttempt(["IHSG", "BBCA", "BBRI", "BMRI", "TLKM"]),
    shows: {
      id: `Portolab tidak dapat memperbarui harga pada 30 Okt 2026, 16.30 WIB, jadi harga di bawah adalah harga terakhir yang tersimpan. Portolab belum memiliki harga TLKM, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 16.30 WIB gagal. ${nextMonday.id}`,
      en: `Portolab could not update the prices at Oct 30, 2026, 4:30 PM WIB, so the prices below are the last ones it stored. Portolab has no price for TLKM yet, because its latest attempt to fetch it at Oct 30, 2026, 4:30 PM WIB failed. ${nextMonday.en}`,
    },
    hides: { id: "tidak dapat memperbarui harga TLKM", en: "price of TLKM" },
  },
  {
    name: "stored prices after a successful attempt",
    quotes,
    latestAttempt: succeededAttempt,
    shows: {
      id: "Harga tertunda sekitar 10 menit",
      en: "Prices are delayed by about 10 minutes",
    },
    hides: { id: "Portolab mencoba lagi", en: "Portolab tries again" },
  },
  {
    name: "an attempt that lacked one stored price",
    quotes,
    latestAttempt: partialAttempt(["BBRI"]),
    shows: {
      id: `Portolab tidak dapat memperbarui harga BBRI pada 30 Okt 2026, 14.00 WIB, jadi harganya di bawah adalah harga terakhir yang tersimpan. ${nextMinute.id}`,
      en: `Portolab could not update the price of BBRI at Oct 30, 2026, 2:00 PM WIB, so the BBRI price below is the last one it stored. ${nextMinute.en}`,
    },
    hides: missingSentences,
  },
  {
    name: "an attempt that lacked two stored prices",
    quotes,
    latestAttempt: partialAttempt(["BBRI", "BMRI"]),
    shows: {
      id: `Portolab tidak dapat memperbarui harga BBRI dan BMRI pada 30 Okt 2026, 14.00 WIB, jadi harganya di bawah adalah harga terakhir yang tersimpan. ${nextMinute.id}`,
      en: `Portolab could not update the prices of BBRI and BMRI at Oct 30, 2026, 2:00 PM WIB, so their prices below are the last ones it stored. ${nextMinute.en}`,
    },
    hides: missingSentences,
  },
  {
    name: "an attempt that lacked three stored prices",
    quotes,
    latestAttempt: partialAttempt(["BBCA", "BBRI", "BMRI"]),
    shows: {
      id: `Portolab tidak dapat memperbarui harga BBCA, BBRI, dan BMRI pada 30 Okt 2026, 14.00 WIB, jadi harganya di bawah adalah harga terakhir yang tersimpan. ${nextMinute.id}`,
      en: `Portolab could not update the prices of BBCA, BBRI, and BMRI at Oct 30, 2026, 2:00 PM WIB, so their prices below are the last ones it stored. ${nextMinute.en}`,
    },
    hides: missingSentences,
  },
  {
    name: "an attempt that lacked one price never stored",
    quotes,
    latestAttempt: partialAttempt(["TLKM"]),
    shows: {
      id: `Portolab belum memiliki harga TLKM, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 14.00 WIB gagal. ${nextMinute.id}`,
      en: `Portolab has no price for TLKM yet, because its latest attempt to fetch it at Oct 30, 2026, 2:00 PM WIB failed. ${nextMinute.en}`,
    },
    hides: staleSentences,
  },
  {
    name: "an attempt that lacked two prices never stored",
    quotes,
    latestAttempt: partialAttempt(["TLKM", "ASII"]),
    shows: {
      id: `Portolab belum memiliki harga TLKM dan ASII, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 14.00 WIB gagal. ${nextMinute.id}`,
      en: `Portolab has no prices for TLKM and ASII yet, because its latest attempt to fetch them at Oct 30, 2026, 2:00 PM WIB failed. ${nextMinute.en}`,
    },
    hides: staleSentences,
  },
  {
    name: "an attempt that lacked a stored price and a price never stored",
    quotes,
    latestAttempt: partialAttempt(["BBRI", "TLKM"]),
    shows: {
      id: `Portolab tidak dapat memperbarui harga BBRI pada 30 Okt 2026, 14.00 WIB, jadi harganya di bawah adalah harga terakhir yang tersimpan. Portolab belum memiliki harga TLKM, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 14.00 WIB gagal. ${nextMinute.id}`,
      en: `Portolab could not update the price of BBRI at Oct 30, 2026, 2:00 PM WIB, so the BBRI price below is the last one it stored. Portolab has no price for TLKM yet, because its latest attempt to fetch it at Oct 30, 2026, 2:00 PM WIB failed. ${nextMinute.en}`,
    },
    hides: { id: "harga BBRI dan TLKM", en: "BBRI and TLKM" },
  },
  {
    name: "no stored prices after a failed attempt",
    quotes: [],
    latestAttempt: failedAttempt(["IHSG", "BBCA"]),
    shows: {
      id: `Portolab belum memiliki harga, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 16.30 WIB gagal. ${nextMonday.id}`,
      en: `Portolab has no prices yet, because its latest attempt to fetch them at Oct 30, 2026, 4:30 PM WIB failed. ${nextMonday.en}`,
    },
    hides: { id: "Harga tertunda", en: "Prices are delayed" },
  },
  {
    name: "no stored prices while the first attempt runs",
    quotes: [],
    latestAttempt: undefined,
    shows: {
      id: "Portolab sedang mengambil harga pertamanya. Muat ulang halaman ini sebentar lagi untuk melihatnya.",
      en: "Portolab is fetching its first prices now. Reload this page in a moment to see them.",
    },
    hides: { id: "gagal", en: "failed" },
  },
];

for (const state of states) {
  for (const language of ["id", "en"] as const) {
    test(`says the right thing for ${state.name} in ${languageNames[language]}`, () => {
      overwriteGetLocale(() => language);
      const html = renderToStaticMarkup(
        <PricesView
          quotes={state.quotes}
          latestAttempt={state.latestAttempt}
        />,
      );
      expect(html).toContain(state.shows[language]);
      expect(html).not.toContain(state.hides[language]);
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
