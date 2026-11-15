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

const helpTexts: Record<Locale, Record<"chart" | "returnTitle", string>> = {
  id: {
    chart:
      "Grafik dan tabel membandingkan imbal hasil portofolio Raka dengan imbal hasil IHSG sejak penutupan 30 Oktober 2026, sebelum Raka dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.",
    returnTitle: "Imbal hasil Raka dibandingkan IHSG",
  },
  en: {
    chart:
      "The chart and the table compare the return of the portfolio of Raka with the return of the IHSG since the close of October 30, 2026, before Raka could trade. Each of their returns uses the final closes of its day.",
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
  latestActivity: undefined,
};
const returnPath =
  "/classes/7/students?measure=sharpe&student=9#selected-student";
const texts: Record<
  Locale,
  Record<
    | "summary"
    | "analysis"
    | "journal"
    | "notice"
    | "sections"
    | "username"
    | "back"
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
    username: "Nama pengguna raka",
    back: "Kembali ke mahasiswa",
    value: "Nilai portofolio Raka",
    map: "Posisi Raka di peta",
    portfolio: "Portofolio Raka",
    holdings: "Saham Raka, ukuran = bobot",
    one: "Saham Raka · 1",
    several: "Saham Raka · 2",
    mapFailure:
      "Peta tampil setelah pembaruan harga membawa IHSG dan riwayat harga menyimpan penutupan awal periode Raka.",
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
    username: "Username raka",
    back: "Back to students",
    value: "Portfolio value of Raka",
    map: "Position of Raka on the map",
    portfolio: "Portfolio of Raka",
    holdings: "Holdings of Raka, size = weight",
    one: "Holding of Raka · 1",
    several: "Holdings of Raka · 2",
    mapFailure:
      "The map appears once a price update brings the IHSG and the price history stores the close at the start of the period of Raka.",
    measures: "Portfolio measures of Raka",
    analysisStocks: "Stocks of Raka",
    analysisHoldings: "Stocks of Raka, size = weight",
    pageTitle: "Summary of Raka in Kelas A | Portolab",
  },
};
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
          summary={{
            path: "/classes/7/students/9",
            label: texts[locale].summary,
          }}
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
  test(`keeps the named student, read-only notice, and all tabs on the selected panel in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
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
