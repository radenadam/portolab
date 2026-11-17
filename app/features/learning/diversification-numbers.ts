import {
  formatPercentagePoints,
  formatPercent,
  isOnePercentagePoint,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";

export function diversificationNumbers({
  average,
  risk,
}: {
  average: MonthlyReturn;
  risk: MonthlyReturn;
}): string {
  const difference = monthlyReturn(Math.max(0, average - risk));
  const values = { points: formatPercentagePoints(difference) };
  const saving = isOnePercentagePoint(values.points)
    ? m.learning_one_risk_point_part(values)
    : m.learning_several_risk_points_part(values);
  return m.learning_diversification_numbers_notice({
    average: formatPercent(average, "two"),
    risk: formatPercent(risk, "two"),
    saving,
  });
}
