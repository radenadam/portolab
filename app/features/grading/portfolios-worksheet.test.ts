import { expect, test } from "vitest";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { headingCell, numberCell, textCell } from "~/workbook/workbook-cells";
import type { WorkbookCell } from "~/workbook/workbook-cells";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { portfoliosWorksheet } from "./portfolios-worksheet";
import { readClassPortfolios } from "./read-class-portfolios.server";

// class-of-students-for-test.server.ts describes the students, and read-class-portfolios.server.test.ts gives their measures and values with the source of each. A spreadsheet reads each number as it is, so the cells hold the values without rounding, and its format shows them in the language of the reader.
const now = new Date("2026-10-30T09:20:00Z");
const yahooFinance: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};

function percent(value: number): WorkbookCell {
  return numberCell(closeToForTest(value, 15), "percent");
}

function beta(value: number): WorkbookCell {
  return numberCell(closeToForTest(value, 14), "twoDecimals");
}

function rupiahCell(value: number): WorkbookCell {
  return numberCell(value, "wholeNumber");
}

const bbcaMeasures = [
  percent(-0.003815949696325831),
  percent(-0.0005076246462094883),
  percent(0.02594696080684926),
  beta(0.342191752088974),
  percent(0.003308325050116343),
  rupiahCell(100_325_900),
  percent(0.003259),
];
const empty = [undefined, undefined, undefined, undefined, undefined];

const texts: Record<
  Locale,
  {
    sheetName: string;
    title: string;
    notice: string;
    headings: readonly string[];
    dewi: string;
    budi: string;
    rina: string;
  }
> = {
  id: {
    sheetName: "Portofolio",
    title: "Portofolio mahasiswa di Manajemen Portofolio A",
    notice:
      "Simulasi dengan uang virtual, diunduh pada 30 Okt 2026, 16.20 WIB. Portolab menilai setiap saham yang dipegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI. Setiap ukuran berlaku per bulan, dan portofolio yang memiliki ukuran muncul lebih dulu, dari jarak dari garis pasar sekuritas yang tertinggi sampai yang terendah.",
    headings: [
      "Nama",
      "Nama pengguna",
      "Jarak dari garis pasar sekuritas",
      "Imbal hasil yang diharapkan",
      "Simpangan baku",
      "Beta terhadap IHSG",
      "Imbal hasil yang disyaratkan CAPM",
      "Nilai total dalam rupiah",
      "Imbal hasil sejak awal",
      "Alasan portofolio belum memiliki ukuran",
    ],
    dewi: "Saham Dewi Lestari dan IHSG baru sama-sama memiliki 21 imbal hasil bulanan",
    budi: "Budi Hartono belum memegang saham",
    rina: "Portolab menilai portofolio Rina Kusuma dan menghitung ukurannya",
  },
  en: {
    sheetName: "Portfolios",
    title: "Portfolios of the students in Manajemen Portofolio A",
    notice:
      "A simulation with virtual cash, downloaded on Oct 30, 2026, 4:20 PM WIB. Portolab valued each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX. Every measure is per month, and the portfolios with measures come first, from the highest distance from the security market line to the lowest.",
    headings: [
      "Name",
      "Username",
      "Distance from the security market line",
      "Expected return",
      "Standard deviation",
      "Beta against the IHSG",
      "Return that CAPM requires",
      "Total value in rupiah",
      "Return since the start",
      "Why the portfolio has no measures",
    ],
    dewi: "The stocks of Dewi Lestari and the IHSG share 21 monthly returns",
    budi: "Budi Hartono holds no shares yet",
    rina: "Portolab values the portfolio of Rina Kusuma and computes its measures",
  },
};

for (const locale of locales) {
  const expected = texts[locale];

  test(`writes the title, the notice of a simulation at delayed prices, the headings, and a row for each student in the order of the page, in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, taughtClass } = await classOfStudentsForTest();
    const portfolios = readClassPortfolios(database, taughtClass, {
      request: new Request("http://localhost/classes/1/portfolios/export"),
      now,
      delayMinutes: 10,
    });
    const sheet = portfoliosWorksheet({
      className: taughtClass.name,
      portfolios,
      now,
      source: yahooFinance,
    });
    const [dewi, budi, rina] = portfolios.unmeasured;
    expect(dewi?.reason).toContain(expected.dewi);
    expect(budi?.reason).toContain(expected.budi);
    expect(rina?.reason).toContain(expected.rina);
    expect(sheet).toEqual({
      name: expected.sheetName,
      columnWidths: [30, 24, 16, 16, 16, 16, 16, 16, 16, 80],
      rows: [
        [headingCell(expected.title)],
        [textCell(expected.notice)],
        [],
        expected.headings.map(headingCell),
        [textCell("Eko Prasetyo"), textCell("eko"), ...bbcaMeasures, undefined],
        [
          textCell("Fajar Nugroho"),
          textCell("fajar"),
          ...bbcaMeasures,
          undefined,
        ],
        [
          textCell("Sari Wulandari"),
          textCell("sari"),
          percent(-0.004259743653981885),
          percent(-0.0021586726703076266),
          percent(0.04065715082669377),
          beta(0.6206929278148288),
          percent(0.002101070983674259),
          rupiahCell(54_780_000),
          percent(-0.4522),
          undefined,
        ],
        [
          textCell("Dewi Lestari"),
          textCell("dewi"),
          ...empty,
          rupiahCell(21_475_000),
          percent(-0.78525),
          textCell(dewi?.reason ?? ""),
        ],
        [
          textCell("Budi Hartono"),
          textCell("budi"),
          ...empty,
          rupiahCell(100_000_000),
          percent(0),
          textCell(budi?.reason ?? ""),
        ],
        [
          textCell("Rina Kusuma"),
          textCell("rina"),
          ...empty,
          undefined,
          undefined,
          textCell(rina?.reason ?? ""),
        ],
      ],
    });
  });
}
