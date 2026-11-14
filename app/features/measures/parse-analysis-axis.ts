import { checkFieldLengthForReader } from "~/form-text";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { parseChoice } from "~/value-parsers";
import { analysisAxes } from "./analysis-axes";
import type { AnalysisAxis } from "./analysis-axes";

export function parseAnalysisAxis(
  value: unknown,
  source: string,
): Result<AnalysisAxis, string> {
  if (value === null) return succeed("beta");
  if (typeof value === "string") {
    const length = checkFieldLengthForReader(value, source);
    if (!length.ok) return length;
  }
  return parseChoice(value, source, analysisAxes);
}
