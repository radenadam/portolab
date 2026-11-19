import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { ViewLink } from "~/view-link";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import type { ConceptTermId } from "~/features/learning/concept-term-ids";
import { recordsStepForReader } from "~/features/trading/text-for-reader";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { formatPercent, formatRupiah, formatList } from "~/formatting";
import {
  ConditionSeparator,
  Formula,
  Fraction,
  MathNumber,
  Operator,
  Variable,
} from "~/math-notation";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { parseChoice } from "~/value-parsers";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import { analysisAllocationRows } from "./analysis-allocation-rows";
import { allocationGroups, defaultAllocationGroup } from "./allocation-groups";
import type { AllocationGroup } from "./allocation-groups";
import { MeasureTable } from "./measure-table";
import styles from "./analysis-extras.module.css";
import analysisStyles from "./analysis.module.css";

export function AnalysisAllocation({
  valuation,
  reader,
}: {
  valuation: PortfolioValuation;
  reader: PortfolioReader;
}): ReactNode {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const title = m.measures_analysis_allocation_title();
  // The grouping only changes how the same weights read, so a link with an unknown value must not block the analysis.
  const selection = parseChoice(
    search.get("allocation") ?? defaultAllocationGroup,
    title,
    allocationGroups,
  );
  const group = selection.ok ? selection.value : defaultAllocationGroup;
  const allocation = analysisAllocationRows(valuation, group);
  const rows = allocation.kind === "valued" ? allocation.rows : [];
  const notice = allocationNotice(allocation, reader);
  const details: Record<
    AllocationGroup,
    { label: string; title: string; term: ConceptTermId }
  > = {
    sector: {
      label: m.measures_analysis_sector_label(),
      title: m.measures_analysis_sector_weight_label(),
      term: "bobot-sektor",
    },
    stock: {
      label: m.measures_analysis_stock_label(),
      title: m.measures_weight_label(),
      term: "bobot",
    },
  };
  const calculation =
    allocation.kind !== "valued" ? undefined : (
      <>
        <p>
          <Formula
            left={<Variable name="w" index="i" />}
            right={
              <>
                <Fraction
                  numerator={<Variable name="V" index="i" />}
                  denominator={<Variable name="V" index="p" />}
                />
                <ConditionSeparator />
                <Variable name="V" index="p" />
                <Operator symbol="=" />
                <MathNumber>{formatRupiah(allocation.total)}</MathNumber>
              </>
            }
          />
        </p>
        <MeasureTable
          header={[
            details[group].label,
            m.measures_value_label(),
            m.measures_weight_label(),
          ]}
          rows={rows.map((row) => ({
            key: row.key,
            name: row.name,
            cells: {
              kind: "numbers",
              values: [
                formatRupiah(row.value),
                formatPercent(row.weight, "two"),
              ],
            },
          }))}
        />
      </>
    );
  return (
    <section
      id="analysis-allocation"
      className={styles["card"]}
      data-layout="card"
      aria-labelledby="analysis-allocation-title"
    >
      <div className={styles["header"]}>
        <h2>
          <span id="analysis-allocation-title">{title}</span>
          <ConceptCard
            title={details[group].title}
            meaning={m.measures_analysis_allocation_body()}
            example={
              notice ??
              rows.map((row) => (
                <p key={row.key}>
                  {row.name}{" "}
                  <NumberText whole>
                    {formatPercent(row.weight, "one")}
                  </NumberText>
                </p>
              ))
            }
            calculation={calculation}
            lesson={<ConceptLesson termId={details[group].term} />}
          />
        </h2>
        <nav
          className={analysisStyles["axis"]}
          aria-label={m.measures_analysis_allocation_group_label()}
        >
          {allocationGroups.map((choice) => {
            const parameters = new URLSearchParams(search);
            parameters.set("allocation", choice);
            return (
              <ViewLink
                key={choice}
                to={`?${parameters.toString()}#analysis-allocation`}
                aria-current={group === choice ? "true" : undefined}
              >
                <span>{details[choice].label}</span>
              </ViewLink>
            );
          })}
        </nav>
      </div>
      {notice !== undefined ? (
        <p className={styles["notice"]}>{notice}</p>
      ) : (
        <>
          <svg
            className={styles["segments"]}
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            {rows.map((row, index) => {
              let start = 0;
              for (const previous of rows.slice(0, index))
                start += previous.weight;
              return (
                <rect
                  key={row.key}
                  x={percentOf(plotFraction(start))}
                  width={percentOf(plotFraction(row.weight))}
                  height="100%"
                  rx="0.25em"
                  className={row.key === "cash" ? styles["cash"] : undefined}
                />
              );
            })}
          </svg>
          <div className={styles["allocationRows"]} data-layout="rows">
            {rows.map((row) => (
              <div key={row.key} className={styles["allocationRow"]}>
                <span
                  className={
                    group === "stock" && row.key !== "cash"
                      ? styles["stockName"]
                      : undefined
                  }
                >
                  {row.name}
                </span>
                <svg
                  width="100%"
                  height="100%"
                  className={styles["bar"]}
                  aria-hidden="true"
                >
                  <rect
                    width="100%"
                    height="100%"
                    className={styles["track"]}
                  />
                  {/* A weight fills its share of the whole track, and cash fills from the other end, as in the table of holdings. */}
                  <rect
                    x={
                      row.key === "cash"
                        ? percentOf(plotFraction(1 - row.weight))
                        : undefined
                    }
                    width={percentOf(plotFraction(row.weight))}
                    height="100%"
                    className={row.key === "cash" ? styles["cash"] : undefined}
                  />
                </svg>
                <strong>
                  <NumberText whole>
                    {formatPercent(row.weight, "one")}
                  </NumberText>
                </strong>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function allocationNotice(
  allocation: ReturnType<typeof analysisAllocationRows>,
  reader: PortfolioReader,
): string | undefined {
  switch (allocation.kind) {
    case "unpriced":
      return allocation.codes.length === 1
        ? m.measures_one_unpriced_stock_allocation_notice({
            codes: formatList(allocation.codes, "conjunction"),
          })
        : m.measures_several_unpriced_stocks_allocation_notice({
            codes: formatList(allocation.codes, "conjunction"),
          });
    case "zeroValue":
      return recordsStepForReader(reader, {
        student: m.measures_analysis_allocation_zero_notice,
        lecturer: m.measures_analysis_lecturer_allocation_zero_notice,
      });
    case "valued":
      return undefined;
  }
}
