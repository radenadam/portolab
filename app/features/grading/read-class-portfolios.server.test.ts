import { expect, test } from "vitest";
import { findTaughtClass } from "~/features/classes/class-store.server";
import { createLecturerWithClassForTest } from "~/features/classes/classes-for-test.server";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { databaseWithClosesForTest } from "~/features/measures/measures-for-test.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { readClassPortfolios } from "./read-class-portfolios.server";

// class-of-students-for-test.server.ts describes the students and their portfolios in a class with the default starting cash of Rp100,000,000. The measures follow from those of BBCA, TLKM, and the IHSG that read-measures.server.test.ts gives, with the risk-free rate of 5.75% a year, and were computed with the decimal module of Python at 50 significant digits.
const now = new Date("2026-10-30T09:20:00Z");

const reasons: Record<
  Locale,
  { dewi: string; budi: string; rina: string; quoteFailure: string }
> = {
  id: {
    dewi: "Saham Dewi Lestari dan IHSG baru sama-sama memiliki 21 imbal hasil bulanan dalam 60 bulan lengkap terakhir, dan AADI memiliki imbal hasil paling sedikit, sedangkan Portolab menghitung ukuran portofolio hanya dari paling sedikit 24 imbal hasil bulanan. Jika IHSG dan setiap saham Dewi Lestari tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran portofolio Dewi Lestari setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Januari 2027.",
    budi: "Budi Hartono belum memegang saham, sehingga portofolionya hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio itu setelah order beli Budi Hartono tereksekusi.",
    rina: "Portolab menilai portofolio Rina Kusuma dan menghitung ukurannya setelah pembaruan harga berikutnya membawa harga tertunda AMMN, karena nilai dan bobot setiap saham berasal dari harga tertundanya.",
    quoteFailure:
      "Portolab belum memiliki harga AMMN, karena percobaan terakhir untuk mengambilnya pada 30 Okt 2026, 16.15 WIB gagal. Portolab sedang mencoba lagi sekarang.",
  },
  en: {
    dewi: "The stocks of Dewi Lestari and the IHSG share 21 monthly returns in the latest 60 complete months, and AADI has the fewest returns, but Portolab computes the measures of a portfolio only from at least 24 monthly returns. If the IHSG and each stock of Dewi Lestari keep a close at the end of every month, Portolab computes the measures of the portfolio of Dewi Lestari after the update of the price history that stores the close of the first trading day of January 2027.",
    budi: "Budi Hartono holds no shares yet, so the portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of the portfolio once a purchase of Budi Hartono fills.",
    rina: "Portolab values the portfolio of Rina Kusuma and computes its measures once the next update of prices brings a delayed price of AMMN, because the value and the weight of each stock come from its delayed price.",
    quoteFailure:
      "Portolab has no price for AMMN yet, because its latest attempt to fetch it at Oct 30, 2026, 4:15 PM WIB failed. Portolab is trying again now.",
  },
};

const bbcaStudent = {
  total: { value: 100_325_900, return: closeToForTest(0.003259, 15) },
  measures: {
    distance: closeToForTest(-0.003815949696325831, 16),
    expectedReturn: closeToForTest(-0.0005076246462094883, 16),
    standardDeviation: closeToForTest(0.02594696080684926, 15),
    beta: closeToForTest(0.342191752088974, 14),
    requiredReturn: closeToForTest(0.003308325050116343, 16),
  },
};

for (const locale of locales) {
  const reason = reasons[locale];

  test(`ranks the portfolios with measures by their distance from the security market line, keeps the order of joining for equal distances, and lists the others with the reason, in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, taughtClass } = await classOfStudentsForTest();
    const portfolios = readClassPortfolios(database, taughtClass, {
      request: new Request("http://localhost/classes/1/portfolios"),
      now,
      delayMinutes: 10,
    });
    expect(portfolios.ranked).toEqual([
      {
        studentId: expect.any(Number) as number,
        name: "Eko Prasetyo",
        username: "eko",
        ...bbcaStudent,
      },
      {
        studentId: expect.any(Number) as number,
        name: "Fajar Nugroho",
        username: "fajar",
        ...bbcaStudent,
      },
      {
        studentId: expect.any(Number) as number,
        name: "Sari Wulandari",
        username: "sari",
        total: { value: 54_780_000, return: closeToForTest(-0.4522, 15) },
        measures: {
          distance: closeToForTest(-0.004259743653981885, 16),
          expectedReturn: closeToForTest(-0.0021586726703076266, 16),
          standardDeviation: closeToForTest(0.04065715082669377, 15),
          beta: closeToForTest(0.6206929278148288, 14),
          requiredReturn: closeToForTest(0.002101070983674259, 16),
        },
      },
    ]);
    expect(portfolios.unmeasured).toEqual([
      {
        studentId: expect.any(Number) as number,
        name: "Dewi Lestari",
        username: "dewi",
        total: { value: 21_475_000, return: closeToForTest(-0.78525, 15) },
        reason: reason.dewi,
      },
      {
        studentId: expect.any(Number) as number,
        name: "Budi Hartono",
        username: "budi",
        total: { value: 100_000_000, return: 0 },
        reason: reason.budi,
      },
      {
        studentId: expect.any(Number) as number,
        name: "Rina Kusuma",
        username: "rina",
        total: undefined,
        reason: reason.rina,
      },
    ]);
    // Only Rina holds a stock that the latest update could not fetch, so the text names AMMN alone among the codes that it lacked.
    expect(portfolios.quoteFailure).toBe(reason.quoteFailure);
  });
}

test("reads no portfolio of a class without students", async () => {
  const database = databaseWithClosesForTest();
  const { lecturerId, classId } =
    await createLecturerWithClassForTest(database);
  const taught = findTaughtClass(database, classId, lecturerId);
  if (taught === undefined) {
    throw new Error("The test could not find the class that it created.");
  }
  expect(
    readClassPortfolios(database, taught, {
      request: new Request("http://localhost/classes/1/portfolios"),
      now,
      delayMinutes: 10,
    }),
  ).toEqual({ ranked: [], unmeasured: [], quoteFailure: undefined });
});
