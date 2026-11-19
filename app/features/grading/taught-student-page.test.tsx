import { AnalysisView } from "~/features/measures/analysis-view";
import { readAnalysis } from "~/features/measures/read-analysis.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { fail } from "~/result";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import { expect, test } from "vitest";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import { HomePortfolio } from "~/features/trading/home-portfolio";
import { homePortfolioForTest } from "~/features/trading/home-portfolio-for-test";
import { analysisPortfolioTitle } from "~/features/measures/analysis-measures";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { TaughtStudentPage, taughtStudentMeta } from "./taught-student-page";

const helpTexts: Record<
  Locale,
  Record<"chart" | "table" | "returnTitle", string>
> = {
  id: {
    chart:
      "Grafik dan tabel membandingkan portofolio Raka dengan IHSG sejak penutupan 30 Oktober 2026, sebelum Raka dapat bertransaksi. Hari sebelumnya memakai harga penutupan final. Titik dengan waktu memakai nilai portofolio sekarang dan level tertunda terakhir IHSG.",
    table: "Tabel imbal hasil dari waktu ke waktu",
    returnTitle: "Imbal hasil Raka dibandingkan IHSG",
  },
  en: {
    chart:
      "The chart and the table compare the portfolio of Raka with the IHSG since the close of October 30, 2026, before Raka could trade. Past days use final closes. A timestamped endpoint uses the current portfolio value and the latest delayed level of the IHSG.",
    table: "Table of returns over time",
    returnTitle: "Return of Raka against the IHSG",
  },
};
const emptyTexts: Record<Locale, string> = {
  id: "Raka tidak memegang saham.",
  en: "Raka holds no shares.",
};
const student = {
  classId: 7 as ClassId,
  className: "Kelas A",
  studentId: 9 as UserId,
  name: "Raka",
  shortName: "Raka",
  username: "raka",
  nim: null,
  latestActivity: undefined,
};
const returnPath = "/classes/7/students?measure=sharpe&student=9#student-9";
const texts: Record<
  Locale,
  Record<
    | "summary"
    | "analysis"
    | "journal"
    | "notice"
    | "sections"
    | "username"
    | "activity"
    | "nim"
    | "nimActivity"
    | "back"
    | "reset"
    | "value"
    | "map"
    | "portfolio"
    | "holdings"
    | "one"
    | "several"
    | "mapFailure"
    | "measures"
    | "pageTitle"
    | "analysisStocks"
    | "analysisHoldings",
    string
  >
> = {
  id: {
    summary: "Ringkasan",
    analysis: "Analisis",
    journal: "Jurnal dan order",
    notice: "Tampilan dosen. Hanya baca.",
    sections: "Bagian portofolio mahasiswa",
    username: "Nama pengguna raka · Belum pernah memasang order",
    activity: "Nama pengguna raka · Order terakhir 29 Okt 2026, 10.10 WIB",
    nim: "NIM 1202220108 · Belum pernah memasang order",
    nimActivity: "NIM 1202220108 · Order terakhir 29 Okt 2026, 10.10 WIB",
    back: "Kembali ke mahasiswa",
    reset: "Atur ulang kata sandi",
    value: "Nilai portofolio Raka",
    map: "Posisi Raka di peta",
    portfolio: "Portofolio Raka",
    holdings: "Saham Raka, ukuran = bobot",
    one: "Saham Raka · 1",
    several: "Saham Raka · 2",
    mapFailure:
      "Peta tampil setelah pembaruan harga membawa level tertunda IHSG dari periode Raka dan riwayat harga menyimpan penutupan awal periodenya.",
    measures: "Ukuran portofolio Raka",
    analysisStocks: "Saham Raka",
    analysisHoldings: "Saham Raka, ukuran = bobot",
    pageTitle: "Ringkasan Raka di Kelas A | Portolab",
  },
  en: {
    summary: "Summary",
    analysis: "Analysis",
    journal: "Journal and orders",
    notice: "Lecturer view. Read only.",
    sections: "Student portfolio sections",
    username: "Username raka · No orders yet",
    activity: "Username raka · Latest order Oct 29, 2026, 10:10 AM WIB",
    nim: "NIM 1202220108 · No orders yet",
    nimActivity: "NIM 1202220108 · Latest order Oct 29, 2026, 10:10 AM WIB",
    back: "Back to students",
    reset: "Reset password",
    value: "Portfolio value of Raka",
    map: "Position of Raka on the map",
    portfolio: "Portfolio of Raka",
    holdings: "Holdings of Raka, size = weight",
    one: "Holding of Raka · 1",
    several: "Holdings of Raka · 2",
    mapFailure:
      "The map appears once a price update brings a delayed IHSG level from the period of Raka and the price history stores its starting close.",
    measures: "Portfolio measures of Raka",
    analysisStocks: "Stocks of Raka",
    analysisHoldings: "Stocks of Raka, size = weight",
    pageTitle: "Summary of Raka in Kelas A | Portolab",
  },
};
/** Checks the way back above the header, the reset of the password at the end of the header, which returns to the page from which it opened with that page's own way back, and the tabs beside the read-only notice. */
function expectStudentPageFrame(
  html: string,
  text: (typeof texts)[Locale],
): void {
  const back = `<div><a href="${markupTextForTest(returnPath)}" data-discover="true">‹ ${text.back}</a><header>`;
  expect(html.slice(0, back.length)).toBe(back);
  expect(html).toMatch(
    new RegExp(`</nav><p><svg[^]*?</svg>${text.notice}</p>`, "u"),
  );
  const current = /<a aria-current="page" href="([^"]+)"/u.exec(html)?.[1];
  const reset = new RegExp(
    `<a href="([^"]+)" data-discover="true">${text.reset}</a></header>`,
    "u",
  ).exec(html)?.[1];
  const resetAddress = new URL(
    (reset ?? "").replaceAll("&amp;", "&"),
    "http://localhost",
  );
  expect(resetAddress.pathname).toBe("/classes/7/students/9/password");
  expect(resetAddress.searchParams.get("returnTo")).toBe(
    current?.replaceAll("&amp;", "&"),
  );
}

for (const locale of locales) {
  test(`names the student's analysis points and holdings with and without portfolio weights in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const database = databaseWithClosesForTest();
    for (const codes of [["BBCA", "TLKM"], ["BBCA"]] as const) {
      const home = homePortfolioForTest(valuationForTest(codes));
      const html = renderMarkupForTest(
        <AnalysisView
          showData={false}
          classId={student.classId}
          report={home.report}
          {...readAnalysis(database, home.report)}
          axis="beta"
          now={home.now}
          source={fixturePriceSource}
          firstSessionDate={null}
          reader={{ kind: "lecturer", studentName: student.shortName }}
        />,
        conceptLessonDataForTest(),
      );
      expect(html).toContain(
        markupTextForTest(
          codes.length === 2
            ? texts[locale].analysisHoldings
            : texts[locale].analysisStocks,
        ),
      );
      if (codes.length === 2)
        expect(html).toContain(markupTextForTest(texts[locale].portfolio));
      expect(html).not.toContain("<h1");
      expect(html).not.toContain(`<h2>${texts[locale].analysis}</h2>`);
    }
  });
  test(`keeps the way back above the named student, the reset of the password in the header, and all tabs beside the read-only notice on each page of the student in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
    const latestOrder = new Date("2026-10-29T03:10:00Z");
    for (const [nim, latestActivity, expected, hidden] of [
      [null, undefined, text.username, text.nim],
      [null, latestOrder, text.activity, text.nimActivity],
      ["1202220108", undefined, text.nim, text.username],
      ["1202220108", latestOrder, text.nimActivity, text.activity],
    ] as const) {
      const header = renderMarkupForTest(
        <TaughtStudentPage
          page="portfolio"
          student={{ ...student, nim, latestActivity }}
          returnPath={returnPath}
        >
          <span />
        </TaughtStudentPage>,
      ).replaceAll(/<\/?time\b[^>]*>/gu, "");
      expect(header).toContain(markupTextForTest(expected));
      expect(header).not.toContain(markupTextForTest(hidden));
    }
    expect(taughtStudentMeta("portfolio")({ loaderData: { student } })).toEqual(
      [{ title: text.pageTitle }],
    );
    for (const page of ["portfolio", "measures", "journal"] as const) {
      const html = renderMarkupForTest(
        <TaughtStudentPage
          page={page}
          student={student}
          returnPath={returnPath}
        >
          <span />
        </TaughtStudentPage>,
      );
      for (const key of [
        "summary",
        "analysis",
        "journal",
        "notice",
        "sections",
        "username",
        "back",
      ] as const)
        expect(html).toContain(markupTextForTest(text[key]));
      expect(html).toContain("/classes/7/students/9?returnTo=");
      expect(html).toContain("/classes/7/students/9/analysis?returnTo=");
      expect(html).toContain("/classes/7/students/9/journal?returnTo=");
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      expectStudentPageFrame(html, texts[locale]);
    }
    expect(analysisPortfolioTitle(student.name)).toBe(text.measures);
    for (const codes of [[], ["BBCA"], ["BBCA", "TLKM"]]) {
      const valuation = valuationForTest(["BBCA", "TLKM"]);
      const home = homePortfolioForTest(
        valuePortfolio(
          {
            cash: valuation.cash,
            holdings: valuation.holdings.filter(({ code }) =>
              codes.includes(code),
            ),
          },
          valuation.startingCash,
          new Map(
            valuation.holdings.flatMap((holding) =>
              holding.kind === "priced"
                ? [[holding.code, holding.quote] as const]
                : [],
            ),
          ),
        ),
      );
      const html = renderMarkupForTest(
        <HomePortfolio
          home={home}
          classId={student.classId}
          reader={{ kind: "lecturer", studentName: student.name }}
        />,
        conceptLessonDataForTest(),
      );
      for (const key of [
        "value",
        "map",
        "portfolio",
        "holdings",
        "mapFailure",
        ...(codes.length === 0
          ? []
          : [codes.length === 1 ? ("one" as const) : ("several" as const)]),
      ] as const)
        expect(html).toContain(markupTextForTest(text[key]));
      expect(html).not.toContain('href="/classes/7/analysis"');
      expect(html).toContain(markupTextForTest(helpTexts[locale].chart));
      expect(html).toContain(`<summary>${helpTexts[locale].table}</summary>`);
      expect(html).not.toContain("<h1");
      home.report.history = fail({ kind: "missingCalendar" });
      expect(
        renderMarkupForTest(
          <HomePortfolio
            home={home}
            classId={student.classId}
            reader={{ kind: "lecturer", studentName: student.name }}
          />,
          conceptLessonDataForTest(),
        ),
      ).toContain(helpTexts[locale].returnTitle);
      if (codes.length === 0) expect(html).toContain(emptyTexts[locale]);
    }
  });
}
