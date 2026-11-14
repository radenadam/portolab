import { parseFilledText } from "~/form-text";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { analysisAxes } from "./analysis-axes";
import type { AnalysisAxis } from "./analysis-axes";

export function parseAnalysisAxis(
  value: unknown,
  source: string,
): Result<AnalysisAxis, string> {
  if (value === null) return succeed("beta");
  const text = parseFilledText(value, source);
  if (!text.ok) return text;
  const axis = analysisAxes.find((candidate) => candidate === text.value);
  return axis === undefined
    ? fail(
        m.measures_analysis_axis_error({
          field: source,
          value: text.value.trim(),
          choices: formatList(
            analysisAxes.map((choice) => `"${choice}"`),
            "disjunction",
          ),
        }),
      )
    : succeed(axis);
}
