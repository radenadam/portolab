import { m } from "~/paraglide/messages.js";
import { estimatedLabelWidth } from "./estimated-label-width";

// The longest name leaves room for its mark and value in the estimated phone plot.
const chartNameWidth = 12;

/** A name beside a mark stays bounded, while the legend, tooltip, and table keep its full text. */
export function chartName(name: string): string {
  if (estimatedLabelWidth(name) <= chartNameWidth) return name;
  let prefix = "";
  const segments = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (const { segment } of segments.segment(name)) {
    const next = prefix + segment;
    if (
      estimatedLabelWidth(m.app_chart_short_name_part({ name: next })) >
      chartNameWidth
    )
      break;
    prefix = next;
  }
  return m.app_chart_short_name_part({ name: prefix });
}
