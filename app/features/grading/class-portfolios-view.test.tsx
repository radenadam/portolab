import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { classRankingForTest } from "./class-ranking-for-test.server";
import { ClassPortfoliosView } from "./class-portfolios-view";
import { orderStudents } from "./order-students";
import { matchesStudentFilter } from "./student-filters";
import { rankingMeasures } from "./ranking-measure";

const texts: Record<
  Locale,
  {
    labels: readonly string[];
    noStocks: string;
    count: string;
    one: string;
    empty: string;
    none: string;
    notices: readonly string[];
  }
> = {
  id: {
    noStocks: "Tanpa saham",
    labels: [
      "Mahasiswa",
      "Ukuran peringkat",
      "Cari nama atau nama pengguna",
      "Cari",
      "Unduh workbook",
      "Saring mahasiswa",
      "Semua",
      "Di bawah IHSG",
      "Belum aktif minggu ini",
      "Beta di atas 1,00",
      "Peringkat mahasiswa",
      "Peringkat",
      "Nama",
      "Imbal hasil",
      "Beta",
      "Risiko per bulan",
      "Order terakhir",
      "belum pernah",
      "belum ada",
      "Alasan ukuran ini belum tersedia",
      "Alpha Jensen",
      "Sharpe",
      "Treynor",
    ],
    count: "6 dari 6 mahasiswa tampil",
    one: "1 dari 1 mahasiswa tampil",
    empty:
      "Belum ada mahasiswa yang bergabung di kelas ini, sehingga belum ada portofolio untuk ditampilkan.",
    none: "Tidak ada mahasiswa yang cocok. Ubah pencarian atau pilih saringan Semua.",
    notices: [
      "Peringkat menurut Alpha Jensen per bulan. Nilai yang sama mengikuti urutan bergabung.",
      "Garis tegak menandai IHSG selama periode masing-masing mahasiswa dan beta 1,00. Waktu setiap harga dan kegagalan pembaruannya ada di portofolio mahasiswa.",
    ],
  },
  en: {
    noStocks: "No stocks",
    labels: [
      "Students",
      "Ranking measure",
      "Search name or username",
      "Search",
      "Download workbook",
      "Filter students",
      "All",
      "Below IHSG",
      "Inactive this week",
      "Beta above 1.00",
      "Student ranking",
      "Rank",
      "Name",
      "Return",
      "Beta",
      "Monthly risk",
      "Latest order",
      "none yet",
      "unavailable",
      "Why this measure is unavailable",
      "Jensen's alpha",
      "Sharpe",
      "Treynor",
    ],
    count: "6 of 6 students shown",
    one: "1 of 1 student shown",
    empty:
      "No student has joined this class yet, so there is no portfolio to show.",
    none: "No students match. Change the search or choose the All filter.",
    notices: [
      "Ranked by monthly Jensen's alpha. Ties keep the order of joining.",
      "Vertical ticks mark IHSG over each student’s own period and beta 1.00. Each price’s time and update failures appear in the student’s portfolio.",
    ],
  },
};

for (const locale of locales) {
  test(`shows the whole class, the address of each control, counts, empty searches, and an empty class in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { taughtClass, portfolios } = await classRankingForTest();
    const all = orderStudents(portfolios, "alpha");
    const render = (shown = all, query = "") =>
      renderInRouterForTest(
        <ClassPortfoliosView
          classId={taughtClass.id}
          all={all}
          quoteFailure={portfolios.quoteFailure}
          shown={shown}
          selected={undefined}
          panel={undefined}
          options={{
            measure: "alpha",
            filter: "all",
            query,
            studentId: undefined,
          }}
        />,
      );
    const html = render();
    for (const label of [
      ...texts[locale].labels,
      texts[locale].count,
      ...texts[locale].notices,
    ])
      expect(html).toContain(markupTextForTest(label));
    for (const student of all) expect(html).toContain(student.name);
    expect(html).toContain("/workbook?measure=alpha");
    expect(html).toContain("filter=inactive");
    expect(html).toContain('name="q"');
    expect(render([], "missing")).toContain(texts[locale].none);
    const empty = renderInRouterForTest(
      <ClassPortfoliosView
        classId={taughtClass.id}
        all={[]}
        quoteFailure={undefined}
        shown={[]}
        selected={undefined}
        panel={undefined}
        options={{
          measure: "alpha",
          filter: "all",
          query: "",
          studentId: undefined,
        }}
      />,
    );
    expect(empty).toContain(texts[locale].empty);
    const noStocks = renderInRouterForTest(
      <ClassPortfoliosView
        classId={taughtClass.id}
        all={all}
        quoteFailure={portfolios.quoteFailure}
        shown={all.filter((student) => !student.hasHoldings)}
        selected={undefined}
        panel={undefined}
        options={{
          measure: "alpha",
          filter: "no-stocks",
          query: "",
          studentId: undefined,
        }}
      />,
    );
    expect(noStocks).toContain(texts[locale].noStocks);
    const first = portfolios.ranked[0];
    if (first === undefined)
      throw new Error("The fixture has ranked students.");
    const one = renderInRouterForTest(
      <ClassPortfoliosView
        classId={taughtClass.id}
        all={[first]}
        quoteFailure={undefined}
        shown={[first]}
        selected={undefined}
        panel={undefined}
        options={{
          measure: "alpha",
          filter: "all",
          query: "",
          studentId: undefined,
        }}
      />,
    );
    expect(one).toContain(texts[locale].one);
    for (const measure of rankingMeasures) {
      const ordered = orderStudents(portfolios, measure);
      expect(ordered).toHaveLength(6);
      expect(ordered.slice(0, 3).map((student) => student.username)).toEqual(
        measure === "alpha"
          ? ["eko", "fajar", "sari"]
          : ["sari", "eko", "fajar"],
      );
    }
    expect(
      all.filter((student) => matchesStudentFilter(student, "inactive")),
    ).toHaveLength(6);
    expect(
      all.filter((student) => matchesStudentFilter(student, "high-beta")),
    ).toHaveLength(0);
    expect(
      all.filter((student) => matchesStudentFilter(student, "no-stocks")),
    ).toHaveLength(1);
  });
}
