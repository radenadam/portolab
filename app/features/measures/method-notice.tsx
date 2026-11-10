import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { defaultEstimationSettings } from "./estimation-settings";
import { monthlyReturnCount } from "./monthly-return-count";

/** How Portolab takes the monthly returns of the measures, with the settings that every measure uses, and that the measures are a simulation. */
export function MethodNotice(): ReactNode {
  return (
    <p>
      {m.measures_method_notice({
        index: marketIndex.code,
        window: formatNumber(defaultEstimationSettings.returnCount),
        minimum: monthlyReturnCount(
          defaultEstimationSettings.minimumReturnCount,
        ),
      })}
    </p>
  );
}
