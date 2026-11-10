import { expect, test } from "vitest";
import type { UserId } from "~/features/accounts/accounts.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { classOfStudentsForTest } from "./class-of-students-for-test.server";
import { studentMeasuresPath, studentPortfolioPath } from "./grading-paths";
import { readClassPortfolios } from "./read-class-portfolios.server";
import { RankedStudents, UnmeasuredStudents } from "./student-standings";

// class-of-students-for-test.server.ts describes the students, and read-class-portfolios.server.test.ts gives their measures and values, which the lists round as the pages of the measures do. Intl puts a no-break space after the currency, which the texts write as \u00a0.
const now = new Date("2026-10-30T09:20:00Z");
const fall = '<span aria-hidden="true">▼ </span>';
const rise = '<span aria-hidden="true">▲ </span>';

interface Labels {
  distance: string;
  expectedReturn: string;
  standardDeviation: string;
  beta: string;
  requiredReturn: string;
  totalValue: string;
  return: string;
  portfolio: (name: string) => string;
  measures: (name: string) => string;
}

const texts: Record<
  Locale,
  {
    labels: Labels;
    eko: readonly string[];
    sari: readonly string[];
    dewi: readonly string[];
    budi: readonly string[];
  }
> = {
  id: {
    labels: {
      distance: "Jarak dari garis pasar sekuritas",
      expectedReturn: "Imbal hasil yang diharapkan",
      standardDeviation: "Simpangan baku",
      beta: "Beta terhadap IHSG",
      requiredReturn: "Imbal hasil yang disyaratkan CAPM",
      totalValue: "Nilai total",
      return: "Imbal hasil sejak awal",
      portfolio: (name) => `Portofolio ${name}`,
      measures: (name) => `Imbal hasil dan risiko portofolio ${name}`,
    },
    eko: [
      `${fall}-0,38%`,
      "-0,05%",
      "2,59%",
      "0,34",
      "0,33%",
      "Rp\u00a0100.325.900",
      `${rise}+0,33%`,
    ],
    sari: [
      `${fall}-0,43%`,
      "-0,22%",
      "4,07%",
      "0,62",
      "0,21%",
      "Rp\u00a054.780.000",
      `${fall}-45,22%`,
    ],
    dewi: ["Rp\u00a021.475.000", `${fall}-78,53%`],
    budi: ["Rp\u00a0100.000.000", "0,00%"],
  },
  en: {
    labels: {
      distance: "Distance from the security market line",
      expectedReturn: "Expected return",
      standardDeviation: "Standard deviation",
      beta: "Beta against the IHSG",
      requiredReturn: "Return that CAPM requires",
      totalValue: "Total value",
      return: "Return since the start",
      portfolio: (name) => `Portfolio of ${name}`,
      measures: (name) => `Return and risk of the portfolio of ${name}`,
    },
    eko: [
      `${fall}-0.38%`,
      "-0.05%",
      "2.59%",
      "0.34",
      "0.33%",
      "IDR\u00a0100,325,900",
      `${rise}+0.33%`,
    ],
    sari: [
      `${fall}-0.43%`,
      "-0.22%",
      "4.07%",
      "0.62",
      "0.21%",
      "IDR\u00a054,780,000",
      `${fall}-45.22%`,
    ],
    dewi: ["IDR\u00a021,475,000", `${fall}-78.53%`],
    budi: ["IDR\u00a0100,000,000", "0.00%"],
  },
};

function definitions(
  terms: readonly string[],
  values: readonly string[],
): string {
  return `<dl>${terms.map((term, index) => `<dt>${term}</dt><dd>${values[index] ?? ""}</dd>`).join("")}</dl>`;
}

for (const locale of locales) {
  const { labels, ...values } = texts[locale];

  test(`lists each student with the measures and the value of the portfolio, or with the reason why it has no measures, and the links to its pages, in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, taughtClass } = await classOfStudentsForTest();
    const { ranked, unmeasured } = readClassPortfolios(database, taughtClass, {
      request: new Request("http://localhost/classes/1/portfolios"),
      now,
      delayMinutes: 10,
    });
    const item = (
      student: { studentId: UserId; name: string },
      body: string,
    ): string =>
      `<li><p>${student.name}</p>${body}<a href="${studentPortfolioPath(taughtClass.id, student.studentId)}" data-discover="true">${labels.portfolio(student.name)}</a><a href="${studentMeasuresPath(taughtClass.id, student.studentId)}" data-discover="true">${labels.measures(student.name)}</a></li>`;
    const measureTerms = [
      labels.distance,
      labels.expectedReturn,
      labels.standardDeviation,
      labels.beta,
      labels.requiredReturn,
      labels.totalValue,
      labels.return,
    ];
    const [eko, fajar, sari] = ranked;
    const [dewi, budi, rina] = unmeasured;
    if (
      eko === undefined ||
      fajar === undefined ||
      sari === undefined ||
      dewi === undefined ||
      budi === undefined ||
      rina === undefined
    ) {
      throw new Error("The class of the test has six students.");
    }
    expect(
      renderInRouterForTest(
        <RankedStudents classId={taughtClass.id} students={ranked} />,
      ).replaceAll(/ class="[^"]*"/g, ""),
    ).toBe(
      `<ol>${[
        item(eko, definitions(measureTerms, values.eko)),
        item(fajar, definitions(measureTerms, values.eko)),
        item(sari, definitions(measureTerms, values.sari)),
      ].join("")}</ol>`,
    );
    expect(
      renderInRouterForTest(
        <UnmeasuredStudents classId={taughtClass.id} students={unmeasured} />,
      ).replaceAll(/ class="[^"]*"/g, ""),
    ).toBe(
      `<ul>${[
        item(
          dewi,
          `${definitions([labels.totalValue, labels.return], values.dewi)}<p>${dewi.reason}</p>`,
        ),
        item(
          budi,
          `${definitions([labels.totalValue, labels.return], values.budi)}<p>${budi.reason}</p>`,
        ),
        item(rina, `<p>${rina.reason}</p>`),
      ].join("")}</ul>`,
    );
  });
}
