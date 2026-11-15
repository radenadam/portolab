import { beta } from "~/units/beta";
import { matrixCell } from "~/matrix-cell";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { MeasureTable } from "~/features/measures/measure-table";
import type { MeasureTableRow } from "~/features/measures/measure-table";
import { MeasureLabel } from "~/features/measures/measure-list";
import type { MeasureRow } from "~/features/measures/measure-list";
import {
  StandardDeviationFormula,
  PortfolioVarianceFormula,
  WeightedSumFormula,
} from "~/features/measures/formulas";
import { ReturnTables } from "~/features/measures/return-tables";
import type { TradeImpact } from "~/features/measures/measure-trade";
import type { ValuedPortfolioMeasures } from "~/features/measures/measure-valued-portfolio";
import { companyOf } from "~/features/market-data/company-of";
import { sectorName } from "~/features/market-data/sector-name";
import { formatBeta, formatPercent, formatVariance } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { sectorWeight } from "./sector-weight";
import styles from "./trade-impact.module.css";

export function ImpactRows({
  impact,
  code,
  ticket,
}: {
  impact: TradeImpact;
  code: string;
  ticket: boolean;
}): ReactNode {
  const { before, after } = impact;
  const measures: Record<
    "beta" | "risk" | "expectedReturn",
    {
      label: string;
      value: (portfolio: ValuedPortfolioMeasures) => number;
      format: (value: number) => string;
      formula: ReactNode;
    }
  > = {
    beta: {
      label: m.trading_impact_beta_label(),
      value: (portfolio) => portfolio.beta.value,
      format: (value) => formatBeta(beta(value)),
      formula: <WeightedSumFormula measure="beta" />,
    },
    risk: {
      label: m.trading_impact_risk_label(),
      value: (portfolio) => portfolio.standardDeviation.value,
      format: (value) => formatPercent(value, "two"),
      formula: (
        <>
          <PortfolioVarianceFormula />
          <br />
          <StandardDeviationFormula of="p" variance={after.variance.value} />
        </>
      ),
    },
    expectedReturn: {
      label: m.trading_impact_return_label(),
      value: (portfolio) => portfolio.expectedReturn.value,
      format: (value) => formatPercent(value, "two"),
      formula: <WeightedSumFormula measure="expectedReturn" />,
    },
  };
  const order = ticket
    ? (["beta", "expectedReturn", "risk"] as const)
    : (["beta", "risk", "expectedReturn"] as const);
  return (
    <div className={styles["rows"]} data-impact-rows="">
      {order.map((key) => {
        const measure = measures[key];
        const row: MeasureRow = {
          label: measure.label,
          concept: key,
          value: measure.format(measure.value(after)),
          formula: measure.formula,
          inputs: <ImpactInputs impact={impact} risk={key === "risk"} />,
        };
        return (
          <ImpactRow
            key={key}
            label={<MeasureLabel row={row} />}
            before={measure.value(before)}
            after={measure.value(after)}
            format={measure.format}
          />
        );
      })}
      <ImpactRow
        label={m.trading_impact_weight_label({ name: code })}
        before={stockWeight(before, code)}
        after={stockWeight(after, code)}
        format={(value) => formatPercent(value, "one")}
      />
      <ImpactRow
        label={
          <>
            {m.trading_impact_weight_label({
              name: sectorName(companyOf(code).sector),
            })}
            <ConceptHelp title={m.trading_impact_sector_title()}>
              <p>{m.trading_impact_sector_body()}</p>
              <ImpactInputs impact={impact} risk={false} />
              <ConceptLesson termId="diversifikasi" />
            </ConceptHelp>
          </>
        }
        before={sectorWeight(before.holdings, code)}
        after={sectorWeight(after.holdings, code)}
        format={(value) => formatPercent(value, "one")}
      />
    </div>
  );
}

function stockWeight(
  portfolio: ValuedPortfolioMeasures,
  code: string,
): PortfolioWeight {
  return (
    portfolio.holdings.find((holding) => holding.code === code)?.weight ??
    portfolioWeight(0)
  );
}

function ImpactRow({
  label,
  before,
  after,
  format,
}: {
  label: ReactNode;
  before: number;
  after: number;
  format: (value: number) => string;
}): ReactNode {
  const first = format(before);
  const second = format(after);
  return (
    <div className={styles["row"]}>
      <span className={styles["rowLabel"]}>{label}</span>
      <span className={styles["from"]}>
        <NumberText whole>{first}</NumberText>
      </span>
      <span className={styles["arrow"]} aria-hidden>
        →
      </span>
      <strong>
        <span className={styles["srOnly"]}>
          {m.trading_impact_becomes_part()}
        </span>
        <NumberText whole>
          {second}
          {first !== second && (
            <span className={styles["direction"]} aria-hidden>
              {after > before ? "▲" : "▼"}
            </span>
          )}
        </NumberText>
      </strong>
    </div>
  );
}

function ImpactInputs({
  impact,
  risk,
}: {
  impact: TradeImpact;
  risk: boolean;
}): ReactNode {
  const rowsOf = (
    values: (
      holding: ValuedPortfolioMeasures["holdings"][number],
    ) => readonly string[],
    withSector: boolean,
  ): MeasureTableRow[] =>
    impact.before.holdings.map((holding) => ({
      key: holding.code,
      name: withSector ? (
        <>
          {holding.code}
          <span className={styles["sector"]}>
            {sectorName(companyOf(holding.code).sector)}
          </span>
        </>
      ) : (
        holding.code
      ),
      cells: { kind: "numbers", values: values(holding) },
    }));
  return (
    <div className={styles["inputs"]}>
      <MeasureTable
        header={[
          m.trading_impact_stock_label(),
          m.trading_impact_weight_before_label(),
          m.trading_impact_weight_after_label(),
        ]}
        rows={rowsOf(
          (holding) => [
            formatPercent(holding.weight, "two"),
            formatPercent(stockWeight(impact.after, holding.code), "two"),
          ],
          true,
        )}
      />
      <MeasureTable
        header={[
          m.trading_impact_stock_label(),
          m.trading_impact_beta_label(),
          m.trading_impact_return_label(),
        ]}
        rows={rowsOf(
          (holding) => [
            formatBeta(holding.beta.value),
            formatPercent(holding.expectedReturn.value, "two"),
          ],
          false,
        )}
      />
      {risk && (
        <table>
          {impact.before.holdings.map((holding, row) => (
            <tbody key={holding.code}>
              {impact.before.holdings.slice(row).map((other, column) => (
                <tr key={other.code}>
                  <th>
                    {holding.code} · {other.code}
                  </th>
                  <td>
                    <NumberText whole>
                      {formatVariance(
                        matrixCell(
                          impact.before.variance.inputs.covariances,
                          row,
                          row + column,
                        ),
                      )}
                    </NumberText>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      )}
      <ReturnTables showHeading={false} instruments={impact.before.holdings} />
    </div>
  );
}
