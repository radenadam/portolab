import { stockComparisonText } from "./stock-comparison-text";
import { NumberText } from "~/number-text";
import type { ClassId } from "~/features/classes/classes.schema";
import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { homeTitle } from "~/features/trading/home-title";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatCorrelation, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import styles from "~/stat-grid.module.css";
import { CorrelationFormula } from "./formulas";
import {
  measureFailureText,
  riskMeasureFailureText,
} from "./measure-failure-text";
import { MeasureLabel } from "./measure-list";
import type { StoredMeasureFailure } from "./measure-stored.server";
import type { StockSummary } from "./measure-summaries";
import { monthSpanInputs } from "./month-span";
import type { StockCorrelation } from "./read-stock-correlation.server";
import { MeasureTable } from "./measure-table";
import { ReturnTables } from "./return-tables";
import { stockConceptRows } from "./stock-concept-rows";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";

export function StockKeyMeasures({
  code,
  classId,
  measures,
  correlation,
  children,
}: {
  children: ReactNode;
  code: string;
  classId: ClassId;
  measures: Result<StockSummary, StoredMeasureFailure>;
  correlation: StockCorrelation | undefined;
}): ReactNode {
  const rows = measures.ok ? stockConceptRows(measures.value) : undefined;
  const correlationExample =
    correlation === undefined ? undefined : correlation.ok ? (
      <>
        <p>
          <NumberText>
            {formatCorrelation(correlation.value.correlation.value)}
          </NumberText>
        </p>
        <p>
          <NumberText>
            {m.measures_months_notice(
              monthSpanInputs(correlation.value.months),
            )}
          </NumberText>
        </p>
      </>
    ) : (
      <p>
        <NumberText>
          {correlationFailure(correlation.failure, classId)}
        </NumberText>
      </p>
    );
  return (
    <>
      {!measures.ok && (
        <p className={styles["note"]}>
          <NumberText>
            {measureFailureText(measures.failure, { kind: "stock", code })}
          </NumberText>
        </p>
      )}
      <div className={styles["grid"]}>
        <dl className={styles["ranges"]}>{children}</dl>
        {rows !== undefined &&
          [rows.beta, rows.risk, rows.expectedReturn].map((row) => (
            <dl key={row.label} className={styles["stat"]}>
              <dt>
                <MeasureLabel row={{ ...row, label: row.statisticLabel }} />
              </dt>
              <dd>
                <NumberText whole>{row.value}</NumberText>
              </dd>
              <dd className={styles["note"]}>
                <NumberText>{row.comparison}</NumberText>
              </dd>
            </dl>
          ))}
        {correlation !== undefined && (
          <dl className={styles["stat"]}>
            <dt>
              {m.measures_portfolio_correlation_label()}
              <ConceptCard
                title={m.measures_portfolio_correlation_label()}
                meaning={m.measures_portfolio_correlation_body()}
                example={correlationExample}
                calculation={
                  correlation.ok ? (
                    <>
                      <p>
                        {m.measures_correlation_prices_notice({
                          page: homeTitle(),
                        })}
                      </p>
                      <p>
                        <CorrelationFormula
                          first="i"
                          second="p"
                          correlation={correlation.value.correlation}
                        />
                      </p>
                      <MeasureTable
                        header={[
                          m.measures_stock_label(),
                          m.measures_weight_label(),
                        ]}
                        rows={[
                          ...correlation.value.instruments.map(
                            (instrument) => ({
                              key: instrument.code,
                              name: instrument.code,
                              cells: {
                                kind: "numbers" as const,
                                values: [
                                  formatPercent(instrument.weight, "two"),
                                ],
                              },
                            }),
                          ),
                          {
                            key: "cash",
                            name: m.measures_cash_label(),
                            cells: {
                              kind: "numbers",
                              values: [
                                formatPercent(
                                  correlation.value.cashWeight,
                                  "two",
                                ),
                              ],
                            },
                          },
                        ]}
                      />
                      <ReturnTables
                        showHeading={false}
                        instruments={correlation.value.instruments}
                      />
                    </>
                  ) : (
                    correlationExample
                  )
                }
                lesson={<ConceptLesson termId="korelasi" />}
              />
            </dt>
            <dd>
              {correlation.ok ? (
                <NumberText>
                  {formatCorrelation(correlation.value.correlation.value)}
                </NumberText>
              ) : (
                <span className={styles["note"]}>
                  <NumberText>
                    {correlationFailure(correlation.failure, classId)}
                  </NumberText>
                </span>
              )}
            </dd>
            {correlation.ok && (
              <dd className={styles["note"]}>
                {stockComparisonText({
                  kind: "correlation",
                  value: correlation.value.correlation.value,
                })}
              </dd>
            )}
          </dl>
        )}
      </div>
    </>
  );
}

function correlationFailure(
  failure: Extract<StockCorrelation, { ok: false }>["failure"],
  classId: ClassId,
): string {
  switch (failure.kind) {
    case "noPortfolioVariation":
      return riskMeasureFailureText(failure);
    case "noHoldings":
    case "unpriced": {
      const explained = explainPortfolioMeasures(failure, {
        kind: "owner",
        classId,
      });
      if (explained.ok)
        throw new Error("An unavailable portfolio has no measures.");
      return explained.failure;
    }
    case "unmeasured":
      return measureFailureText(failure.failure, { kind: "correlation" });
  }
}
