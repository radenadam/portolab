import type { ClassId } from "~/features/classes/classes.schema";
import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatCorrelation, formatList, formatPercent } from "~/formatting";
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
import { monthSpanOf, monthSpanInputs } from "./month-span";
import type { StockCorrelation } from "./read-stock-correlation.server";
import { MeasureTable } from "./measure-table";
import { ReturnTables } from "./return-tables";
import { stockConceptRows } from "./stock-concept-rows";
import { marketIndex } from "~/features/market-data/tracked-instruments";
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
        <p>{formatCorrelation(correlation.value.correlation.value)}</p>
        <p>
          {m.measures_months_notice(monthSpanInputs(correlation.value.months))}
        </p>
      </>
    ) : (
      <p>{correlationFailure(correlation.failure, classId)}</p>
    );
  return (
    <>
      <p className={styles["note"]}>
        {measures.ok
          ? m.measures_stock_statistics_notice({
              ...monthSpanInputs(monthSpanOf(measures.value.returns)),
              measures: formatList(
                [
                  m.measures_beta_label({ index: marketIndex.code }),
                  m.measures_standard_deviation_label(),
                  m.measures_expected_return_label(),
                ],
                "conjunction",
              ),
            })
          : measureFailureText(measures.failure, { kind: "stock", code })}
      </p>
      <div className={styles["grid"]}>
        <dl className={styles["ranges"]}>{children}</dl>
        {rows !== undefined &&
          [rows.beta, rows.risk, rows.expectedReturn].map((row) => (
            <dl key={row.label} className={styles["stat"]}>
              <dt>
                <MeasureLabel row={row} />
              </dt>
              <dd>{row.value}</dd>
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
                formatCorrelation(correlation.value.correlation.value)
              ) : (
                <span className={styles["note"]}>
                  {correlationFailure(correlation.failure, classId)}
                </span>
              )}
            </dd>
            {correlation.ok && (
              <dd className={styles["note"]}>
                {m.measures_month_span_part(
                  monthSpanInputs(correlation.value.months),
                )}
              </dd>
            )}
          </dl>
        )}
      </div>
      {correlation?.ok === true && (
        <p className={styles["note"]}>
          {m.measures_correlation_prices_notice()}
        </p>
      )}
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
