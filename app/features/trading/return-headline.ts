import { formatPercentagePoints, formatSignedPercent } from "~/formatting";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";
import type { CumulativeReturn } from "~/units/cumulative-return";

/** The rounded difference chooses the words, so a lead smaller than the displayed precision reads as equal. */
export function returnHeadline(
  portfolio: CumulativeReturn,
  market: CumulativeReturn,
): string {
  const difference = portfolio - market;
  const direction = formatSignedPercent(difference).direction;
  const points = formatPercentagePoints(Math.abs(difference));
  const inputs = { points, index: marketIndex.code };
  const isOnePoint = points === formatPercentagePoints(0.01);
  switch (direction) {
    case "rise":
      return isOnePoint
        ? m.trading_home_one_ahead_point_title(inputs)
        : m.trading_home_several_ahead_points_title(inputs);
    case "fall":
      return isOnePoint
        ? m.trading_home_one_behind_point_title(inputs)
        : m.trading_home_several_behind_points_title(inputs);
    case "none":
      return m.trading_home_equal_title(inputs);
  }
}
