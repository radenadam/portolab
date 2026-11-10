import { countedText } from "~/counted-text";
import { textForReader } from "~/features/trading/text-for-reader";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail } from "~/result";
import type { Result } from "~/result";
import { measureFailureText } from "./measure-failure-text";
import type { PortfolioSummary } from "./measure-summaries";
import type { PortfolioMeasuresReport } from "./read-measures.server";

/** The measures of a portfolio, or the text that tells its reader why it has none and when it gets them. */
export function explainPortfolioMeasures(
  report: PortfolioMeasuresReport,
  reader: PortfolioReader,
): Result<PortfolioSummary, string> {
  switch (report.kind) {
    case "noHoldings":
      return fail(
        textForReader(reader, {
          owner: () => m.measures_no_holdings_notice(),
          lecturer: (name) => m.measures_lecturer_no_holdings_notice({ name }),
        }),
      );
    case "unpriced": {
      const codes = formatList(report.codes, "conjunction");
      return fail(
        textForReader(reader, {
          owner: () =>
            countedText(
              report.codes.length,
              {
                one: m.measures_one_unpriced_holding_notice,
                several: m.measures_several_unpriced_holdings_notice,
              },
              { codes },
            ),
          lecturer: (name) =>
            countedText(
              report.codes.length,
              {
                one: m.measures_lecturer_one_unpriced_holding_notice,
                several: m.measures_lecturer_several_unpriced_holdings_notice,
              },
              { codes, name },
            ),
        }),
      );
    }
    case "measured":
      return report.measures.ok
        ? report.measures
        : fail(
            measureFailureText(report.measures.failure, {
              kind: "portfolio",
              reader,
            }),
          );
  }
}
