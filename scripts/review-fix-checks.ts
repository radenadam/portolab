import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { parseChoiceAt, parseListField, parseTextAt } from "./json.ts";

export interface FixCheck {
  file: string;
  status: "fix" | "unrelated";
  evidence: string;
}

/** Reads the verifier's account of each author file after the ordinary cap. */
export function parseFixChecks(
  value: unknown,
  source: string,
): Result<FixCheck[], string> {
  return parseListField(value, source, {
    field: "fixChecks",
    itemName: "fix check",
    parseItem: parseFixCheck,
  });
}

function parseFixCheck(
  value: unknown,
  source: string,
): Result<FixCheck, string> {
  const file = parseTextAt(value, source, ["file"]);
  if (!file.ok) return file;
  const status = parseChoiceAt(value, source, {
    name: "status",
    choices: ["fix", "unrelated"] as const,
  });
  if (!status.ok) return status;
  const evidence = parseTextAt(value, source, ["evidence"]);
  return evidence.ok
    ? succeed({
        file: file.value,
        status: status.value,
        evidence: evidence.value,
      })
    : evidence;
}

/** Every author file needs one answer, because checking the findings alone cannot exclude unrelated changes. */
export function fixCheckProblem(
  files: readonly string[],
  checks: readonly FixCheck[] | undefined,
): string | undefined {
  if (files.length === 0) return undefined;
  if (checks === undefined)
    return "The verifier's checks of the author files are missing, so the finding-check allowance cannot accept this push.";
  const missing = files.filter(
    (file) => checks.filter((check) => check.file === file).length !== 1,
  );
  const unknown = checks
    .filter((check) => !files.includes(check.file))
    .map(({ file }) => file);
  if (missing.length > 0 || unknown.length > 0) {
    return `The verifier must account for each author file exactly once. Missing or repeated: ${missing.join(", ") || "none"}. Unknown: ${unknown.join(", ") || "none"}.`;
  }
  const unrelated = checks.filter(({ status }) => status === "unrelated");
  return unrelated.length === 0
    ? undefined
    : `The finding-check allowance permits only fixes of open findings. ${unrelated.map(({ file, evidence }) => `${file}: ${evidence}`).join(" ")}`;
}
