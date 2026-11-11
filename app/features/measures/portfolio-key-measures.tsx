import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import { StudentMarketLine } from "./market-line-section";
import { MarketLinePosition, MonthsNotice } from "./measure-list";
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
          <>
            <MonthsNotice returns={measures.value.market.returns} />
            <dl className={styles["keyMeasures"]}>
              <KeyMeasure
                label={m.measures_beta_label({ index: marketIndex.code })}
                value={formatBeta(measures.value.beta)}
              />
              <KeyMeasure
                label={m.measures_standard_deviation_label()}
                value={formatPercent(measures.value.standardDeviation, "two")}
              />
              <KeyMeasure
                label={m.measures_expected_return_label()}
                value={formatPercent(measures.value.expectedReturn, "two")}
              />
              <KeyMeasure
                label={m.measures_required_return_label()}
                value={formatPercent(
                  measures.value.requiredReturn.value,
                  "two",
                )}
              />
            </dl>
          </>
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

function KeyMeasure({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode {
  return (
    <div className={styles["keyMeasure"]}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
