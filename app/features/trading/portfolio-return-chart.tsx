import type { ReactNode } from "react";
import { TimeChart } from "~/charts/time-chart";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";
import { portfolioLabel } from "./portfolio-label";
import type { ReturnPoint } from "./portfolio-history";

/** The small summary and the large view compare the same final closes. */
export function PortfolioReturnChart({
  points,
  labelledBy,
  annotations,
  studentName,
}: {
  points: readonly ReturnPoint[];
  labelledBy: string;
  studentName?: string | undefined;
  annotations?: readonly { date: string; label: string }[];
}): ReactNode {
  return (
    <TimeChart
      coloredChanges
      points={points}
      lines={[
        {
          name: portfolioLabel(studentName),
          kind: "own",
          valueOf: (point) => point.portfolio,
        },
        {
          name: marketIndex.code,
          kind: "reference",
          valueOf: (point) => point.market,
        },
      ]}
      labelledBy={labelledBy}
      dateLabel={m.app_trading_day_label()}
      tableLabel={m.app_returns_table_label()}
      annotations={annotations}
    />
  );
}
