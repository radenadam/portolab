import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import { formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import { StudentMarketLine } from "./market-line-section";
import { MarketLinePosition, MeasureLabel, MonthsNotice } from "./measure-list";
import type { MeasureRow } from "./measure-list";
import { portfolioConceptRows } from "./portfolio-concept-rows";
import type { PortfolioSummary } from "./measure-summaries";
import type { StoredMeasureFailure } from "./measure-stored.server";
import styles from "./measures.module.css";
import type {
  PortfolioMeasuresReport,
  StudentLine,
} from "./read-measures.server";

/** The key measures of the portfolio of a student as a grid, and the chart of the security market line with where the portfolio lies against it as its caption, which the portfolio shows as decision 0026 sets. The page of the measures shows the formula and the inputs of each. */
export function PortfolioKeyMeasures({
  classId,
  report,
  marketLine,
}: {
  classId: ClassId;
  report: PortfolioMeasuresReport;
  marketLine: Result<StudentLine, StoredMeasureFailure>;
}): ReactNode {
  const measures = explainPortfolioMeasures(report, { kind: "owner", classId });
  return (
    <>
      <section>
        <h2>{m.measures_portfolio_title()}</h2>
        {measures.ok ? (
          <KeyMeasures portfolio={measures.value} classId={classId} />
        ) : (
          <p>{measures.failure}</p>
        )}
      </section>
      <section>
        <StudentMarketLine
          marketLine={marketLine}
          caption={
            measures.ok && (
              <MarketLinePosition
                distance={measures.value.securityMarketLine.value}
              />
            )
          }
        />
      </section>
    </>
  );
}

function KeyMeasures({
  portfolio,
  classId,
}: {
  portfolio: PortfolioSummary;
  classId: ClassId;
}): ReactNode {
  const concepts = portfolioConceptRows(portfolio, { kind: "owner", classId });
  return (
    <>
      <MonthsNotice returns={portfolio.market.returns} />
      <dl className={styles["keyMeasures"]}>
        <KeyMeasure row={concepts.beta} />
        <KeyMeasure row={concepts.risk} />
        <KeyMeasure row={concepts.expectedReturn} />
        <KeyMeasure
          row={{
            label: m.measures_required_return_label(),
            value: formatPercent(portfolio.requiredReturn.value, "two"),
            formula: null,
          }}
        />
      </dl>
    </>
  );
}

function KeyMeasure({ row }: { row: MeasureRow }): ReactNode {
  return (
    <div className={styles["keyMeasure"]}>
      <dt>
        <MeasureLabel row={row} />
      </dt>
      <dd>{row.value}</dd>
    </div>
  );
}
