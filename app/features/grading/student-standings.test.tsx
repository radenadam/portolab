import { expect, test } from "vitest";
import { listStudents } from "~/features/classes/class-store.server";
import { readPortfolio } from "~/features/trading/portfolio-store.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import { rupiah } from "~/units/rupiah";
import { cumulativeReturn } from "~/units/cumulative-return";
import { monthlyReturn } from "~/units/monthly-return";
import { classRankingForTest } from "./class-ranking-for-test.server";
import type {
  ClassPortfolios,
  RankedStudent,
} from "./read-class-portfolios.server";
import { StudentPanel } from "./student-panel";
import { studentNote } from "./student-note";

const texts: Record<
  Locale,
  {
    panel: readonly string[];
    notes: readonly string[];
    only: string;
    unranked: string;
    zeroValue: string;
    extreme: string;
    highExtreme: string;
    median: (returns: string, risk: string) => string;
    positions: readonly string[];
    parts: readonly string[];
  }
> = {
  id: {
    unranked: " · belum ada peringkat",
    zeroValue: "Rp\u00a00",
    parts: [
      "imbal hasilnya tertinggi",
      "imbal hasilnya terendah",
      "risikonya tertinggi",
      "risikonya terendah",
      "alpha Jensen tertinggi",
      "alpha Jensen terendah",
    ],
    highExtreme:
      "Di kelas ini, imbal hasilnya tertinggi, risikonya terendah, dan alpha Jensen tertinggi. Alpha Jensen -0,38% berada di bawah garis pasar sekuritas, dengan beta 0,34.",
    only: "Satu-satunya portofolio yang memiliki ukuran di kelas.",
    extreme:
      "Di kelas ini, imbal hasilnya terendah, risikonya tertinggi, dan alpha Jensen terendah. Alpha Jensen -0,43% berada di bawah garis pasar sekuritas, dengan beta 0,62.",
    median: (returns, risk) =>
      `Imbal hasilnya ${returns} median kelas, dan risikonya ${risk} median kelas. Alpha Jensen dibulatkan menjadi 0,00%, sehingga portofolio berada pada garis pasar sekuritas, dengan beta 0,62.`,
    positions: ["di bawah", "sama dengan", "di atas"],
    panel: [
      "Tutup panel mahasiswa",
      "Imbal hasil",
      "Beta",
      "Risiko per bulan",
      "Alpha Jensen",
      "Nilai total",
      "Order",
      "Kas",
      " · peringkat 3 dari 3",
      "Alasan terakhir",
      "Belum ada alasan tertulis untuk order yang tereksekusi.",
      "Buka portofolio",
      "Analisis",
      "Jurnal alasan",
      "Atur ulang kata sandi",
      "Rp\u00a054,8\u00a0jt",
      "50,00%",
      "30,00%",
      "20,00%",
      "Peta memerlukan imbal hasil IHSG sejak mahasiswa dapat bertransaksi. Buka portofolio untuk melihat harga dan riwayat yang tersedia.",
    ],
    notes: [
      "Alpha Jensen +1,00% berada di atas garis pasar sekuritas, dengan beta 0,62.",
      "Alpha Jensen -1,00% berada di bawah garis pasar sekuritas, dengan beta 0,62.",
      "Alpha Jensen dibulatkan menjadi 0,00%, sehingga portofolio berada pada garis pasar sekuritas, dengan beta 0,62.",
    ],
  },
  en: {
    unranked: " · unranked",
    zeroValue: "IDR\u00a00",
    parts: [
      "the return is the highest",
      "the return is the lowest",
      "the risk is the highest",
      "the risk is the lowest",
      "Jensen’s alpha is the highest",
      "Jensen’s alpha is the lowest",
    ],
    highExtreme:
      "In this class, the return is the highest, the risk is the lowest, and Jensen’s alpha is the highest. Jensen’s alpha of -0.38% lies below the security market line, with beta 0.34.",
    only: "The only portfolio with measures in the class.",
    extreme:
      "In this class, the return is the lowest, the risk is the highest, and Jensen’s alpha is the lowest. Jensen’s alpha of -0.43% lies below the security market line, with beta 0.62.",
    median: (returns, risk) =>
      `The return is ${returns} the class median, and the risk is ${risk} the class median. Jensen’s alpha rounds to 0.00%, so the portfolio is on the security market line, with beta 0.62.`,
    positions: ["below", "equal to", "above"],
    panel: [
      "Close student panel",
      "Return",
      "Beta",
      "Monthly risk",
      "Jensen's alpha",
      "Total value",
      "Orders",
      "Cash",
      " · rank 3 of 3",
      "Latest reason",
      "No written reason for a filled order yet.",
      "Open portfolio",
      "Analysis",
      "Reason journal",
      "Reset password",
      "IDR\u00a054.8M",
      "50.00%",
      "30.00%",
      "20.00%",
      "The map needs the IHSG return since the student could trade. Open the portfolio to see the available prices and history.",
    ],
    notes: [
      "Jensen’s alpha of +1.00% lies above the security market line, with beta 0.62.",
      "Jensen’s alpha of -1.00% lies below the security market line, with beta 0.62.",
      "Jensen’s alpha rounds to 0.00%, so the portfolio is on the security market line, with beta 0.62.",
    ],
  },
};

for (const locale of locales) {
  test(`keeps a student panel usable after the operator deletes the orders and holdings of a portfolio that spent its cash in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { taughtClass, portfolios } = await classRankingForTest();
    const member = portfolios.unmeasured.find(
      (student) => student.username === "budi",
    );
    if (member === undefined)
      throw new Error("The fixture has Budi without holdings.");
    // Python Decimal gives zero total and a return of -100% when no cash or holding remains, so no allocation has a denominator.
    const valuation = valuePortfolio(
      { cash: rupiah(0), holdings: [] },
      taughtClass.startingCash,
      new Map(),
    );
    if (valuation.total === undefined)
      throw new Error("An empty portfolio has a known value.");
    const student = {
      ...member,
      total: { value: valuation.total.value, return: valuation.total.return },
    };
    const html = renderInRouterForTest(
      <StudentPanel
        classId={taughtClass.id}
        student={student}
        all={[student]}
        options={{
          measure: "alpha",
          filter: "all",
          query: "",
          studentId: student.studentId,
        }}
        panel={{ valuation, orderCount: 0, reason: undefined }}
      />,
    );
    expect(html).toContain(markupTextForTest(texts[locale].zeroValue));
    expect(html).toContain(student.name);
    expect(html).not.toContain("NaN");
  });
  test(`shows the student, the allocation, the latest reason, and the links, and explains each rounded alpha direction in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, taughtClass, portfolios } = await classRankingForTest();
    const student = portfolios.ranked.find((item) => item.username === "sari");
    const member = listStudents(database, taughtClass.id).find(
      (item) => item.username === "sari",
    );
    if (student === undefined || member === undefined)
      throw new Error("The fixture has Sari in the class.");
    const portfolio = readPortfolio(database, {
      membershipId: member.membershipId,
      startingCash: taughtClass.startingCash,
    });
    const valuation = readPortfolioValuation(database, {
      portfolio,
      startingCash: taughtClass.startingCash,
    }).valuation;
    const html = renderInRouterForTest(
      <StudentPanel
        classId={taughtClass.id}
        student={student}
        all={[...portfolios.ranked, ...portfolios.unmeasured]}
        options={{
          measure: "alpha",
          filter: "all",
          query: "sari",
          studentId: student.studentId,
        }}
        panel={{ valuation, orderCount: 0, reason: undefined }}
      />,
    );
    for (const text of texts[locale].panel)
      expect(html).toContain(markupTextForTest(text));
    expect(html).toContain("#student-reasons");
    expect(html).toContain("returnTo=");
    // The fixture holds Rp27,390,000 of BBCA, Rp16,434,000 of TLKM, and Rp10,956,000 cash. Python Decimal independently gives 50%, 30%, and 20% of Rp54,780,000.
    expect(
      studentNote(student, [...portfolios.ranked, ...portfolios.unmeasured]),
    ).toBe(texts[locale].extreme);
    const top = portfolios.ranked[0];
    if (top === undefined) throw new Error("The fixture has a top portfolio.");
    expect(
      studentNote(top, [...portfolios.ranked, ...portfolios.unmeasured]),
    ).toBe(texts[locale].highExtreme);
    for (const part of texts[locale].parts)
      expect(`${texts[locale].extreme} ${texts[locale].highExtreme}`).toContain(
        part,
      );
    for (const [index, distance] of [0.01, -0.01, 0.000001].entries()) {
      const scenario = {
        ...student,
        measures: { ...student.measures, distance: monthlyReturn(distance) },
      };
      expect(studentNote(scenario, [scenario])).toBe(
        `${texts[locale].only} ${texts[locale].notes[index] ?? ""}`,
      );
    }
    expectMedianNotes({ student, portfolios, text: texts[locale] });
    const unmeasured = portfolios.unmeasured[0];
    if (unmeasured === undefined)
      throw new Error("The fixture has an unmeasured student.");
    expect(studentNote(unmeasured, [])).toBe(unmeasured.reason);
    expect(
      renderInRouterForTest(
        <StudentPanel
          classId={taughtClass.id}
          student={unmeasured}
          all={[unmeasured]}
          options={{
            measure: "alpha",
            filter: "all",
            query: "",
            studentId: unmeasured.studentId,
          }}
          panel={{ valuation, orderCount: 0, reason: undefined }}
        />,
      ),
    ).toContain(texts[locale].unranked);
  });
}

function expectMedianNotes({
  student,
  portfolios,
  text,
}: {
  student: RankedStudent;
  portfolios: ClassPortfolios;
  text: (typeof texts)[Locale];
}): void {
  if (student.total === undefined)
    throw new Error("The measured fixture has a value.");
  const totalValue = student.total.value;
  // Python statistics.median gives 1.75%, 2%, or 2.25% for the return and 2.75%, 3%, or 3.25% for risk, so the selected portfolio lies below, on, or above each median without being an extreme.
  const classmates = [...portfolios.ranked, ...portfolios.unmeasured].filter(
    (item) => item.studentId !== student.studentId,
  );
  for (const [returnIndex, returns] of [0.015, 0.02, 0.025].entries()) {
    for (const [riskIndex, risk] of [0.025, 0.03, 0.035].entries()) {
      const selected = {
        ...student,
        total: {
          value: totalValue,
          return: cumulativeReturn(returns),
        },
        measures: {
          ...student.measures,
          distance: monthlyReturn(0),
          standardDeviation: monthlyReturn(risk),
        },
      };
      const group = classmates.map((member, index) => ({
        ...student,
        studentId: member.studentId,
        total: {
          value: totalValue,
          return: cumulativeReturn(index / 100),
        },
        measures: {
          ...student.measures,
          distance: monthlyReturn((index - 2) / 100),
          standardDeviation: monthlyReturn((index + 1) / 100),
        },
      }));
      expect(studentNote(selected, [...group, selected])).toBe(
        text.median(
          text.positions[returnIndex] ?? "",
          text.positions[riskIndex] ?? "",
        ),
      );
    }
  }
}
