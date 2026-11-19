import type { CSSProperties, ReactNode } from "react";
import { compareRoundedNumbers } from "~/compare-rounded-numbers";
import type { ChangeDirection } from "~/formatting";
import { correlation } from "~/units/correlation";
import type { Correlation } from "~/units/correlation";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { formatCorrelation, formatNumber } from "~/formatting";
import { numberFormat } from "~/intl-formats";
import { intlLocale } from "~/intl-locale";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { ExplainedFormula } from "~/math-notation";
import { correlationFormulaText } from "./formula-texts";
import { PopoverButton } from "~/popover";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import { AnalysisCalculation } from "./analysis-calculation";
import { CovarianceFormula } from "./formulas";
import { CorrelationFormula } from "./comovement-formulas";
import type { PortfolioSummary } from "./measure-summaries";
import { PairTable } from "./portfolio-tables";
import { UnavailableMeasures } from "./unavailable-measures";
import styles from "./analysis-extras.module.css";

function correlationFill(value: Correlation): string {
  const direction = compareRoundedNumbers(value, correlation(0), "ratio");
  const colors: Record<ChangeDirection, { color: string; strength: number }> = {
    rise: { color: "var(--color-data)", strength: 0.7 },
    fall: { color: "var(--color-correlation-negative)", strength: 0.6 },
    none: { color: "var(--color-raised)", strength: 0 },
  };
  const fill = colors[direction];
  return `color-mix(in srgb, ${fill.color} ${percentOf(plotFraction(Math.abs(value) * fill.strength))}, var(--color-raised))`;
}

function pairOf(portfolio: PortfolioSummary, first: string, second: string) {
  const pair = portfolio.pairs.find(
    (candidate) =>
      (candidate.first === first && candidate.second === second) ||
      (candidate.first === second && candidate.second === first),
  );
  if (pair === undefined)
    throw new Error(`The portfolio has no pair for ${first} and ${second}.`);
  return pair;
}

export function AnalysisCorrelations({
  portfolio,
}: {
  portfolio: PortfolioSummary | undefined;
}): ReactNode {
  const title = m.measures_analysis_correlations_title();
  const example = portfolio?.pairs.find(
    ({ first, second }) => first !== second,
  );
  const onlyHolding =
    portfolio?.holdings.length === 1 ? portfolio.holdings[0] : undefined;
  const oneHoldingNotice =
    onlyHolding === undefined
      ? undefined
      : m.measures_one_analysis_holding_notice({ code: onlyHolding.code });
  const legendColors: CSSProperties & {
    "--correlation-negative": string;
    "--correlation-positive": string;
  } = {
    "--correlation-negative": correlationFill(correlation(-1)),
    "--correlation-positive": correlationFill(correlation(1)),
  };
  return (
    <section
      className={styles["card"]}
      data-layout="card"
      aria-labelledby="analysis-correlations-title"
    >
      <div className={styles["header"]}>
        <h2>
          <span id="analysis-correlations-title">{title}</span>
          <ConceptCard
            title={m.measures_pair_correlation_label()}
            meaning={m.measures_analysis_correlations_body({
              negative: formatNumber(-1),
              positive: formatNumber(1),
            })}
            example={
              example === undefined ? (
                oneHoldingNotice === undefined ? (
                  <UnavailableMeasures />
                ) : (
                  <p>{oneHoldingNotice}</p>
                )
              ) : (
                <>
                  <p>
                    {m.measures_analysis_pair_title({
                      first: example.first,
                      second: example.second,
                    })}
                  </p>
                  <strong>
                    <NumberText whole>
                      {formatCorrelation(example.correlation)}
                    </NumberText>
                  </strong>
                </>
              )
            }
            calculation={
              portfolio === undefined ? undefined : (
                <>
                  <ExplainedFormula
                    text={m.measures_covariance_formula_notice()}
                  >
                    <CovarianceFormula first="i" second="j" />
                  </ExplainedFormula>
                  <ExplainedFormula text={correlationFormulaText()}>
                    <CorrelationFormula
                      first="i"
                      second="j"
                      correlation={undefined}
                    />
                  </ExplainedFormula>
                  <PairTable portfolio={portfolio} />
                </>
              )
            }
            lesson={<ConceptLesson termId="korelasi" />}
          />
        </h2>
      </div>
      {portfolio === undefined ? (
        <UnavailableMeasures />
      ) : oneHoldingNotice !== undefined ? (
        <p className={styles["notice"]}>{oneHoldingNotice}</p>
      ) : (
        <>
          <div className={styles["matrixViewport"]} data-scrolls-sideways="">
            <table className={styles["matrix"]} aria-label={title}>
              <thead>
                <tr>
                  <td />
                  {portfolio.holdings.slice(0, -1).map(({ code }) => (
                    <th key={code} scope="col">
                      {code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* A pair appears once, below the diagonal, because the correlation of two stocks is the same in either order and a stock with itself is always 1. */}
                {portfolio.holdings.slice(1).map((holding, row) => (
                  <tr key={holding.code}>
                    <th scope="row">{holding.code}</th>
                    {portfolio.holdings.slice(0, -1).map((other, column) => {
                      if (column > row) return <td key={other.code} />;
                      const pair = pairOf(portfolio, holding.code, other.code);
                      const text = formatCorrelation(pair.correlation);
                      const drawing = (
                        <>
                          <svg width="100%" height="100%" aria-hidden="true">
                            <rect
                              width="100%"
                              height="100%"
                              rx="0.5em"
                              fill={correlationFill(pair.correlation)}
                            />
                          </svg>
                          <NumberText whole>{text}</NumberText>
                        </>
                      );
                      return (
                        <td key={other.code}>
                          <PopoverButton
                            popover={`analysis-pair-${holding.code}-${other.code}`}
                            label={m.measures_analysis_correlation_cell_label({
                              first: holding.code,
                              second: other.code,
                              value: text,
                            })}
                            className={styles["cell"]}
                          >
                            {drawing}
                          </PopoverButton>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className={styles["gradient"]}
            style={legendColors}
            aria-hidden="true"
          >
            <NumberText whole>{formatNumber(-1)}</NumberText>
            <i />
            <NumberText whole>
              {numberFormat(intlLocale(), {
                signDisplay: "always",
                maximumFractionDigits: 0,
              }).format(1)}
            </NumberText>
          </div>
          {portfolio.holdings.flatMap((first, firstIndex) =>
            portfolio.holdings.slice(0, firstIndex).map((second) => {
              const pair = pairOf(portfolio, first.code, second.code);
              return (
                <AnalysisCalculation
                  key={`${first.code}-${second.code}`}
                  id={`analysis-pair-${first.code}-${second.code}`}
                  title={m.measures_analysis_pair_title({
                    first: first.code,
                    second: second.code,
                  })}
                  row={{
                    label: title,
                    value: formatCorrelation(pair.correlation),
                    description: correlationFormulaText(),
                    formula: (
                      <CorrelationFormula
                        first="i"
                        second="j"
                        correlation={{
                          formula: "correlation",
                          value: pair.correlation,
                          inputs: {
                            covariance: pair.covariance,
                            firstStandardDeviation: first.standardDeviation,
                            secondStandardDeviation: second.standardDeviation,
                          },
                        }}
                      />
                    ),
                    inputs: (
                      <PairTable
                        portfolio={{
                          pairs: [
                            {
                              ...pair,
                              first: first.code,
                              second: second.code,
                            },
                          ],
                        }}
                      />
                    ),
                  }}
                />
              );
            }),
          )}
        </>
      )}
    </section>
  );
}
