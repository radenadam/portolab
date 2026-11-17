import { m } from "~/paraglide/messages.js";
import { parseAnalysisAxis } from "~/features/measures/parse-analysis-axis";
import { defaultAnalysisAxis } from "~/features/measures/analysis-axes";
import { parseImpactShare } from "./parse-impact-share";
import { defaultImpactShare } from "./impact-shares";

export function readImpactSelection(url: URL) {
  const shareValue = url.searchParams.get("impact");
  const axisValue = url.searchParams.get("impactAxis");
  const share = parseImpactShare(shareValue, m.trading_impact_share_label());
  const axis = parseAnalysisAxis(axisValue, m.trading_impact_axis_label());
  return {
    share: share.ok ? share.value : undefined,
    axis: axis.ok && axisValue !== null ? axis.value : undefined,
    fields:
      share.ok && axis.ok
        ? undefined
        : {
            share: shareValue ?? String(defaultImpactShare),
            axis: axisValue ?? defaultAnalysisAxis,
            shareFailure: share.ok ? undefined : share.failure,
            axisFailure: axis.ok ? undefined : axis.failure,
            path: url.pathname,
            kept: [...url.searchParams].filter(
              ([name]) => name !== "impact" && name !== "impactAxis",
            ),
          },
  };
}
