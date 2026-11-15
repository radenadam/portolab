import { readerWithTextName } from "~/features/trading/text-for-reader";
import type { ReactNode } from "react";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { NumberText } from "~/number-text";
import { failureOf } from "~/result";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import type { PortfolioMeasuresReport } from "./read-measures.server";

/** Formatting here keeps a student's name distinct from quantities in every failure explanation. */
export function PortfolioMeasuresNotice({
  report,
  reader,
}: {
  report: PortfolioMeasuresReport;
  reader: PortfolioReader;
}): ReactNode {
  return (
    <NumberText>
      {(textValue) =>
        failureOf(
          explainPortfolioMeasures(
            report,
            readerWithTextName(reader, textValue),
          ),
        )
      }
    </NumberText>
  );
}
