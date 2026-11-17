import { parseFilledText } from "~/form-text";
import { characterCount } from "~/character-count";
import { formatList, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { analysisAxes, defaultAnalysisAxis } from "./analysis-axes";
import type { AnalysisAxis } from "./analysis-axes";

const maximumAxisLength = Math.max(...analysisAxes.map(characterCount));

export function parseAnalysisAxis(
  value: unknown,
  source: string,
): Result<AnalysisAxis, string> {
  if (value === null) return succeed(defaultAnalysisAxis);
  const text = parseFilledText(value, source);
  if (!text.ok) return text;
  const entered = text.value.trim();
  const axis = analysisAxes.find((candidate) => candidate === entered);
  if (axis !== undefined) return succeed(axis);
  const inputs = {
    field: source,
    choices: formatList(
      analysisAxes.map((choice) => `"${choice}"`),
      "disjunction",
    ),
  };
  const length = characterCount(entered);
  return fail(
    length > maximumAxisLength
      ? m.measures_analysis_long_axis_error({
          ...inputs,
          length: formatNumber(length),
        })
      : m.measures_analysis_axis_error({ ...inputs, value: entered }),
  );
}
