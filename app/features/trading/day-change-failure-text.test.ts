import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { dayChangeFailureText } from "./day-change-failure-text";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Perubahan harian belum tersedia karena kalender perdagangan pembanding belum tercatat. Beri tahu dosen Anda agar kalender tersebut dapat ditambahkan.",
    "Perubahan harian belum tersedia karena harga penutupan BBCA pada 2 November 2026 belum tercatat. Coba lagi setelah pembaruan riwayat harga menyimpan harga penutupan itu.",
    "Perubahan harian belum tersedia karena harga penutupan BBCA dan TLKM pada 2 November 2026 belum tercatat. Coba lagi setelah pembaruan riwayat harga menyimpan semua harga penutupan itu.",
    "Nilai portofolio pada penutupan 2 November 2026 adalah -Rp 3.229.000, sedangkan perubahan persentase memerlukan nilai pembanding di atas nol. Beri tahu dosen Anda agar catatan portofolio dapat diperiksa.",
  ],
  en: [
    "The daily change is unavailable because the comparison trading calendar is not recorded. Tell your lecturer, so that the calendar can be added.",
    "The daily change is unavailable because the close of BBCA on November 2, 2026 is not recorded. Try again once an update of the price history stores that close.",
    "The daily change is unavailable because the closes of BBCA and TLKM on November 2, 2026 are not recorded. Try again once an update of the price history stores all those closes.",
    "The portfolio value at the close of November 2, 2026 is -IDR 3,229,000, but a percentage change needs a comparison value above zero. Tell your lecturer, so that the portfolio records can be checked.",
  ],
};

for (const locale of locales) {
  test(`explains each daily comparison failure in ${locale}`, () => {
    switchLocaleForTest(locale);
    expect(dayChangeFailureText({ kind: "unpriced" })).toBeUndefined();
    expect([
      dayChangeFailureText({ kind: "missingCalendar" }),
      dayChangeFailureText({
        kind: "missingCloses",
        date: "2026-11-02",
        codes: ["BBCA"],
      }),
      dayChangeFailureText({
        kind: "missingCloses",
        date: "2026-11-02",
        codes: ["BBCA", "TLKM"],
      }),
      dayChangeFailureText({
        kind: "nonPositiveReference",
        date: "2026-11-02",
        value: rupiah(-3_229_000),
      }),
    ]).toEqual(texts[locale]);
  });
}
