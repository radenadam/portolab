import type { ReactNode } from "react";
import { TimeChart } from "~/charts/time-chart";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";
import type { ReturnPoint } from "./portfolio-history";

/** Sharing every point keeps the small summary and the large view consistent. */
export function PortfolioReturnChart({
  points,
  labelledBy,
  annotations,
}: {
  points: readonly ReturnPoint[];
  labelledBy: string;
  annotations?: readonly { date: string; label: string }[];
}): ReactNode {
  return (
    <TimeChart
      coloredChanges
      points={points}
      lines={[
        {
          name: m.trading_portfolio_series_label(),
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
