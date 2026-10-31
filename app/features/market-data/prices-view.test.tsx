import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test } from "vitest";
import { getLocale, overwriteGetLocale } from "~/paraglide/runtime.js";
import { rupiah } from "~/units/rupiah";
import type { Quote } from "./price-source.server";
import { PricesView } from "./prices-view";

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
const failedAttempt = {
  attemptedAt: new Date("2026-10-30T09:30:00.000Z"),
  succeeded: false,
};

test("says in Bahasa Indonesia when the source failed, and dates a price from another day", () => {
  const html = renderToStaticMarkup(
    <PricesView quotes={quotes} latestAttempt={failedAttempt} />,
  );
  expect(html).toContain(
    "Portolab tidak dapat memperbarui harga pada 30 Okt 2026, 16.30 WIB, jadi harga di bawah adalah harga terakhir yang tersimpan. Portolab mencoba lagi dengan jeda yang makin panjang.",
  );
  expect(html).toContain(">16 Okt 2026, 16.14<");
  expect(html).toContain(">16.14<");
});

test("says in English when the source failed, and dates a price from another day", () => {
  overwriteGetLocale(() => "en");
  const html = renderToStaticMarkup(
    <PricesView quotes={quotes} latestAttempt={failedAttempt} />,
  );
  expect(html).toContain(
    "Portolab could not update the prices at Oct 30, 2026, 4:30 PM WIB, so the prices below are the last ones it stored. Portolab tries again after longer and longer pauses.",
  );
  expect(html).toContain(">Oct 16, 2026, 4:14 PM<");
  expect(html).toContain(">4:14 PM<");
});

test("shows no failure when the latest attempt succeeded", () => {
  const html = renderToStaticMarkup(
    <PricesView
      quotes={quotes}
      latestAttempt={{ ...failedAttempt, succeeded: true }}
    />,
  );
  expect(html).not.toContain("tidak dapat memperbarui");
});
