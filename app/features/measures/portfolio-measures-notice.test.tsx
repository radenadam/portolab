import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { nameMaximumLength } from "~/features/accounts/account-limits";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { PortfolioMeasuresNotice } from "./portfolio-measures-notice";
import {
  aadiValuationForTest,
  databaseWithClosesForTest,
} from "./measures-for-test.server";
import { readPortfolioMeasures } from "./read-measures.server";
import type { PortfolioMeasuresReport } from "./read-measures.server";

for (const locale of locales) {
  test(`keeps digit-only names as text in every portfolio failure in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const studentName = "8".repeat(nameMaximumLength);
    const reports: readonly PortfolioMeasuresReport[] = [
      { kind: "noHoldings" },
      { kind: "unpriced", codes: ["BBCA"] },
      readPortfolioMeasures(
        databaseWithClosesForTest(),
        aadiValuationForTest(),
      ),
    ];
    for (const report of reports) {
      const html = renderToStaticMarkup(
        <PortfolioMeasuresNotice
          report={report}
          reader={{ kind: "lecturer", studentName }}
        />,
      );
      expect(html).toContain(`data-text-value="">${studentName}</span>`);
      expect(html).not.toContain(`data-number="">${studentName}</span>`);
    }
  });
}
