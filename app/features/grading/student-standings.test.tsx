import { orderStudents } from "./order-students";
import { studentReasonsSectionId } from "~/features/trading/student-reasons-section-id";
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
    lowExtreme: string;
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
    lowExtreme:
      "Di kelas ini, imbal hasilnya terendah, risikonya tertinggi, dan alpha Jensen terendah. Alpha Jensen -0,43% berada di bawah garis pasar sekuritas, dengan beta 0,62.",
    extreme:
      "Di kelas ini, risikonya tertinggi dan alpha Jensen terendah. Alpha Jensen -0,43% berada di bawah garis pasar sekuritas, dengan beta 0,62.",
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
    lowExtreme:
      "In this class, the return is the lowest, the risk is the highest, and Jensen’s alpha is the lowest. Jensen’s alpha of -0.43% lies below the security market line, with beta 0.62.",
    extreme:
      "In this class, the risk is the highest and Jensen’s alpha is the lowest. Jensen’s alpha of -0.43% lies below the security market line, with beta 0.62.",
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
  test(`compares returns with classmates who have stocks without measures, cash alone, or no valuation in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { portfolios } = await classRankingForTest();
    const sari = portfolios.ranked.find((member) => member.username === "sari");
    const eko = portfolios.ranked.find((member) => member.username === "eko");
    const fajar = portfolios.ranked.find(
      (member) => member.username === "fajar",
    );
    const missing = portfolios.unmeasured.find(
      (member) => member.username === "rina",
    );
    if (
      sari === undefined ||
      eko === undefined ||
      fajar === undefined ||
      missing === undefined
    )
      throw new Error(
        "The fixture has three measured students and Rina without a price.",
      );
    expect(missing.total).toBeUndefined();
    // Python statistics.median gives 1.5% with either Dewi's -78.525% or Budi's 0%, and 1% with both. The measured risk median is 3%.
    const measured = (
      [
        [sari, 101_000_000, 0.01, 0.03, 0],
        [eko, 102_000_000, 0.02, 0.02, -0.01],
        [fajar, 103_000_000, 0.03, 0.04, 0.01],
      ] as const
    ).map(([member, value, returns, risk, alpha]) => ({
      ...member,
      total: { value: rupiah(value), return: cumulativeReturn(returns) },
      measures: {
        ...member.measures,
        standardDeviation: monthlyReturn(risk),
        distance: monthlyReturn(alpha),
      },
    }));
    const selected = measured[0];
    if (selected === undefined)
      throw new Error("The selected student is in the comparison.");
    for (const [usernames, position] of [
      [["dewi"], 0],
      [["budi"], 0],
      [["dewi", "budi"], 1],
    ] as const) {
      const classmates = portfolios.unmeasured.filter((member) =>
        usernames.some((username) => username === member.username),
      );
      expect(classmates).toHaveLength(usernames.length);
      for (const member of classmates)
        expect(member.hasHoldings).toBe(member.username === "dewi");
      expect(studentNote(selected, [...measured, ...classmates, missing])).toBe(
        texts[locale].median(
          texts[locale].positions[position] ?? "",
          texts[locale].positions[1] ?? "",
        ),
      );
    }
  });
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
      kind: "membership" as const,
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
        all={orderStudents(portfolios, "alpha")}
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
    expect(html).toContain(`#${studentReasonsSectionId}`);
    expect(html).toContain("returnTo=");
    // The fixture holds Rp27,390,000 of BBCA, Rp16,434,000 of TLKM, and Rp10,956,000 cash. Python Decimal independently gives 50%, 30%, and 20% of Rp54,780,000.
    expect(studentNote(student, orderStudents(portfolios, "alpha"))).toBe(
      texts[locale].extreme,
    );
    const top = portfolios.ranked.find((member) => member.username === "eko");
    if (top === undefined) throw new Error("The fixture has a top portfolio.");
    expect(studentNote(top, orderStudents(portfolios, "alpha"))).toBe(
      texts[locale].highExtreme,
    );
    const low = {
      ...student,
      total: { value: rupiah(10_000_000), return: cumulativeReturn(-0.9) },
    };
    const lowGroup = orderStudents(portfolios, "alpha").map((member) =>
      member.studentId === low.studentId ? low : member,
    );
    expect(studentNote(low, lowGroup)).toBe(texts[locale].lowExtreme);
    for (const part of texts[locale].parts)
      expect(
        `${texts[locale].lowExtreme} ${texts[locale].highExtreme}`,
      ).toContain(part);
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
  const classmates = orderStudents(portfolios, "alpha").filter(
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
