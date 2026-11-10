import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { alignedReturns } from "./aligned-returns";
import { defaultEstimationSettings } from "./estimation-settings";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import { ReturnTables } from "./return-tables";

// The month-end closes of BBCA and the IHSG in month-end-closes-for-test.ts. TLKM without its close of 30 June 2026 has no returns in June and July 2026, so BBCA and TLKM share neither month.
const rise = '<span aria-hidden="true">▲ </span>';
const fall = '<span aria-hidden="true">▼ </span>';

function render(withGap: boolean): string {
  const tlkm = monthEndClosesForTest("TLKM");
  const returns = successValueForTest(
    alignedReturns(
      monthEndClosesForTest("IHSG"),
      [
        monthEndClosesForTest("BBCA"),
        ...(withGap
          ? [
              {
                ...tlkm,
                closes: tlkm.closes.filter(
                  (close) => close.date !== "2026-06-30",
                ),
              },
            ]
          : []),
      ],
      defaultEstimationSettings,
    ),
    "BBCA and TLKM share enough monthly returns",
  );
  const bbca = returns.instruments[0]?.returns ?? [];
  return renderToStaticMarkup(
    <ReturnTables
      instruments={[
        { code: "IHSG", returns: returns.market },
        { code: "BBCA", returns: bbca },
      ]}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

function row(cells: readonly [string, string, string]): string {
  const [date, close, change] = cells;
  return `<tr><th scope="row">${date}</th><td>${close}</td><td>${change}</td></tr>`;
}

const texts: Record<
  Locale,
  {
    title: string;
    notice: string;
    summaries: readonly [string, string];
    header: readonly [string, string, string];
    ihsgRows: readonly (readonly [string, string, string])[];
    bbcaRows: readonly (readonly [string, string, string])[];
    gapRows: readonly (readonly [string, string, string])[];
  }
> = {
  id: {
    title: "Imbal hasil bulanan",
    notice:
      "Setiap tabel memuat harga penutupan pada hari bursa terakhir bulan-bulan tersebut dan imbal hasil setiap bulan yang dipakai ukuran, sehingga Anda dapat menghitung ulang setiap ukuran di spreadsheet dengan fungsi yang disebut rumus-rumusnya. Harga penutupan tanpa imbal hasil adalah awal imbal hasil pada baris di bawahnya.",
    summaries: ["Imbal hasil bulanan IHSG", "Imbal hasil bulanan BBCA"],
    header: ["Akhir bulan", "Penutupan", "Imbal hasil"],
    ihsgRows: [
      ["30 Sep 2021", "6.286,94", ""],
      ["29 Okt 2021", "6.591,35", `${rise}+4,84%`],
    ],
    bbcaRows: [
      ["30 Sep 2021", "7.000", ""],
      ["29 Okt 2021", "7.475", `${rise}+6,79%`],
      ["30 Sep 2026", "6.075", `${fall}-6,18%`],
    ],
    gapRows: [
      ["29 Mei 2026", "5.700", `${fall}-2,56%`],
      ["31 Jul 2026", "6.325", ""],
      ["31 Agu 2026", "6.475", `${rise}+2,37%`],
    ],
  },
  en: {
    title: "Monthly returns",
    notice:
      "Each table lists the closes on the last trading day of the months and the return of each month that the measures use, so you can reproduce every measure in a spreadsheet with the functions that the formulas name. A close without a return is the start of the return in the row below it.",
    summaries: ["Monthly returns of the IHSG", "Monthly returns of BBCA"],
    header: ["Month end", "Close", "Return"],
    ihsgRows: [
      ["Sep 30, 2021", "6,286.94", ""],
      ["Oct 29, 2021", "6,591.35", `${rise}+4.84%`],
    ],
    bbcaRows: [
      ["Sep 30, 2021", "7,000", ""],
      ["Oct 29, 2021", "7,475", `${rise}+6.79%`],
      ["Sep 30, 2026", "6,075", `${fall}-6.18%`],
    ],
    gapRows: [
      ["May 29, 2026", "5,700", `${fall}-2.56%`],
      ["Jul 31, 2026", "6,325", ""],
      ["Aug 31, 2026", "6,475", `${rise}+2.37%`],
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`lists the month-end closes and the monthly returns of each instrument in a table that opens below its label, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = render(false);
    const [ihsgSummary, bbcaSummary] = text.summaries;
    const header = text.header
      .map((label) => `<th scope="col">${label}</th>`)
      .join("");
    for (const part of [
      `<h2>${text.title}</h2><p>${text.notice}</p>`,
      `<details><summary>${ihsgSummary}</summary><table><thead><tr>${header}</tr></thead><tbody>${text.ihsgRows.map(row).join("")}`,
      `<details><summary>${bbcaSummary}</summary>`,
      text.bbcaRows.slice(0, 2).map(row).join(""),
      `${text.bbcaRows.slice(2).map(row).join("")}</tbody></table></details>`,
    ]) {
      expect(html).toContain(part);
    }
    // 60 returns and the close that starts the first of them, for each instrument.
    expect(html.match(/<tr><th scope="row">/g)).toHaveLength(2 * 61);
  });

  test(`starts a return again after a month that the measures leave out, with its close and no return, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(render(true)).toContain(text.gapRows.map(row).join(""));
  });
}
