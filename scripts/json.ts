import { readFileSync } from "node:fs";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

export function readJsonFile(path: string): Result<unknown, string> {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fail(`${path} cannot be read. The system reported: ${reason}`);
  }
  return parseJsonText(text, path);
}

export function parseJsonText(
  text: string,
  source: string,
): Result<unknown, string> {
  try {
    const parsed: unknown = JSON.parse(text);
    return succeed(parsed);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fail(`${source} is not valid JSON. The parser reported: ${reason}`);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
