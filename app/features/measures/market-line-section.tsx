import type { ReactNode } from "react";
import { countedText } from "~/counted-text";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { MarketLineFigure } from "./market-line-figure";
import { measureFailureText } from "./measure-failure-text";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { monthSpanInputs } from "./month-span";
import type {
  ChartedLine,
  LinePoint,
  OtherStocks,
  PortfolioLine,
  StockOnLine,
  StudentLine,
} from "./read-measures.server";

/** The section of the chart of the security market line on the page of the measures of a student, with the portfolio, its stocks, and every other stock against the line, or why the stored closes give no line. */
export function StudentMarketLine({
  marketLine,
}: {
  marketLine: Result<StudentLine, StoredMeasureFailure>;
}): ReactNode {
  if (!marketLine.ok) {
    return (
      <>
        <h2>{m.measures_line_title()}</h2>
        <p>{measureFailureText(marketLine.failure, { kind: "market" })}</p>
      </>
    );
  }
  const { notice, line, portfolio, holdings, others } = studentPlot(
    marketLine.value,
  );
  return (
    <>
      <h2>{m.measures_line_title()}</h2>
      <p>{notice}</p>
      <MarketLineFigure
        line={line}
        portfolio={portfolio}
        holdings={holdings}
        otherStocks={others.onLine}
        names={{
          portfolio: m.measures_line_portfolio_label(),
          holdings: m.measures_line_holdings_label(),
        }}
      />
      <OtherStocksNotices others={others} />
    </>
  );
}

/** The section of the chart of the security market line on the page of the measures of a student that the lecturer of the class reads, with the portfolio and its stocks. */
export function LecturerMarketLine({
  studentName,
  portfolioLine,
}: {
  studentName: string;
  portfolioLine: PortfolioLine;
}): ReactNode {
  return (
    <>
      <h2>{m.measures_line_title()}</h2>
      <p>
        {m.measures_lecturer_portfolio_line_notice({
          ...monthSpanInputs(portfolioLine.line.months),
          name: studentName,
        })}
      </p>
      <MarketLineFigure
        line={portfolioLine.line}
        portfolio={portfolioLine.portfolio}
        holdings={portfolioLine.holdings}
        otherStocks={[]}
        names={{
          portfolio: m.measures_lecturer_line_portfolio_label(),
          holdings: m.measures_lecturer_line_holdings_label(),
        }}
      />
    </>
  );
}

/** The text that says what the chart of a student places against which line, with the line, the portfolio if it has measures, its stocks on the line, and the other stocks. */
function studentPlot(plot: StudentLine): {
  notice: string;
  line: ChartedLine;
  portfolio: LinePoint | undefined;
  holdings: readonly StockOnLine[];
  others: OtherStocks;
} {
  switch (plot.kind) {
    case "portfolio":
      return {
        notice: m.measures_portfolio_line_notice(
          monthSpanInputs(plot.portfolioLine.line.months),
        ),
        line: plot.portfolioLine.line,
        portfolio: plot.portfolioLine.portfolio,
        holdings: plot.portfolioLine.holdings,
        others: plot.others,
      };
    case "latest":
      return {
        notice: m.measures_latest_line_notice({
          ...monthSpanInputs(plot.line.months),
          index: marketIndex.code,
        }),
        line: plot.line,
        portfolio: undefined,
        holdings: plot.holdings,
        others: plot.others,
      };
  }
}

/** Which stocks are not on the chart, and why. */
function OtherStocksNotices({ others }: { others: OtherStocks }): ReactNode {
  const { otherLineCodes } = others;
  return (
    <>
      {otherLineCodes.length > 0 && (
        <p>
          {countedText(
            otherLineCodes.length,
            {
              one: m.measures_one_other_line_notice,
              several: m.measures_several_other_lines_notice,
            },
            { codes: formatList(otherLineCodes, "conjunction") },
          )}
        </p>
      )}
      {others.hasUnmeasured && <p>{m.measures_unmeasured_stocks_notice()}</p>}
    </>
  );
}
