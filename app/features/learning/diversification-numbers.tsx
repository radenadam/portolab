import type { ReactNode } from "react";
import {
  formatPercentagePoints,
  formatPercent,
  isOnePercentagePoint,
} from "~/formatting";
import { Message } from "~/message";
import { m } from "~/paraglide/messages.js";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { emphasizedNumber } from "./emphasized-number";

export function DiversificationNumbers({
  average,
  risk,
}: {
  average: MonthlyReturn;
  risk: MonthlyReturn;
}): ReactNode {
  // Equal risks can leave a negative floating-point residue, which would read as a negative saving.
  const points = formatPercentagePoints(
    monthlyReturn(Math.max(0, average - risk)),
  );
  return (
    <Message
      text={m.learning_diversification_numbers_notice}
      values={{
        average: emphasizedNumber(formatPercent(average, "two")),
        risk: emphasizedNumber(formatPercent(risk, "two")),
        saving: (
          <Message
            text={
              isOnePercentagePoint(points)
                ? m.learning_one_risk_point_part
                : m.learning_several_risk_points_part
            }
            values={{ points: emphasizedNumber(points) }}
          />
        ),
      }}
    />
  );
}
