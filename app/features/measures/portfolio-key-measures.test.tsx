import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import {
  cashValuationForTest,
  databaseWithClosesForTest,
  studentLineForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { PortfolioKeyMeasures } from "./portfolio-key-measures";
import { readPortfolioMeasures } from "./read-measures.server";

// The portfolio of measures-for-test.server.ts holds BBCA, TLKM, and cash, and portfolio-measures-view.test.tsx gives its measures over 60 months, which the decimal module of Python computed: a beta of 0.620693, a standard deviation of 0.040657, an expected return of -0.002159, and a required return of 0.002101, which lies above it.
const classId = 7 as ClassId;

function render(valuation: PortfolioValuation): string {
  const database = databaseWithClosesForTest();
  return renderToStaticMarkup(
    <PortfolioKeyMeasures
      classId={classId}
      report={readPortfolioMeasures(database, valuation)}
      marketLine={studentLineForTest(database, valuation)}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

const texts: Record<
  Locale,
  { measures: string; below: string; lineTitle: string }
> = {
  id: {
    measures:
      "<h2>Ukuran portofolio Anda</h2><p>Ukuran di bawah memakai 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.</p><dl><div><dt>Beta terhadap IHSG</dt><dd>0,62</dd></div><div><dt>Simpangan baku</dt><dd>4,07%</dd></div><div><dt>Imbal hasil yang diharapkan</dt><dd>-0,22%</dd></div><div><dt>Imbal hasil yang disyaratkan CAPM</dt><dd>0,21%</dd></div></dl>",
    below:
      "</table></details><p>Imbal hasil yang diharapkan berada di bawah garis pasar sekuritas, sehingga lebih rendah daripada imbal hasil yang disyaratkan CAPM untuk betanya.</p><p>",
    lineTitle: "<section><h2>Garis pasar sekuritas</h2>",
  },
  en: {
    measures:
      "<h2>Measures of your portfolio</h2><p>The measures below use 60 monthly returns from October 2021 to September 2026.</p><dl><div><dt>Beta against the IHSG</dt><dd>0.62</dd></div><div><dt>Standard deviation</dt><dd>4.07%</dd></div><div><dt>Expected return</dt><dd>-0.22%</dd></div><div><dt>Return that CAPM requires</dt><dd>0.21%</dd></div></dl>",
    below:
      "</table></details><p>The expected return lies below the security market line, so it is lower than the return that CAPM requires for its beta.</p><p>",
    lineTitle: "<section><h2>Security market line</h2>",
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`shows the key measures of the portfolio as a grid, where the portfolio lies against the security market line, and the chart of the line, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = render(valuationForTest(["BBCA", "TLKM"]));
    expect(html).toContain(
      `<section>${text.measures}</section>${text.lineTitle}`,
    );
    expect(html).toContain(text.below);
    expect(html).toContain("<svg");
  });

  test(`says why a portfolio has no key measures in place of the grid, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const database = databaseWithClosesForTest();
    const valuation = cashValuationForTest();
    const failure = explainPortfolioMeasures(
      readPortfolioMeasures(database, valuation),
      { kind: "owner", classId },
    );
    expect(failure.ok).toBe(false);
    const html = render(valuation);
    expect(html).toContain(
      `<p>${failure.ok ? "" : failure.failure}</p></section>`,
    );
    expect(html).not.toContain("<dl>");
  });
}
