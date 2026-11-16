import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue, isRecord } from "../../value-shapes.ts";

export function parseGuideLabels(
  value: unknown,
  source: string,
): Result<Map<string, string>, string> {
  if (!isRecord(value))
    return fail(
      `${source} must map message keys to text, but it is ${describeValue(value)}.`,
    );
  const labels = new Map<string, string>();
  const problems: string[] = [];
  for (const [key, text] of Object.entries(value)) {
    if (typeof text !== "string") {
      problems.push(
        `${source}.${key} must be text, but it is ${describeValue(text)}.`,
      );
    } else if (/_(label|link|title)$/u.test(key) && !text.includes("{")) {
      labels.set(`label:${key}`, text);
    }
  }
  return problems.length > 0 ? fail(problems.join("\n")) : succeed(labels);
}
