import { readFileSync } from "node:fs";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

export function readJsonFile(path: string): Result<unknown, string> {
  return parseJsonText(readFileSync(path, "utf8"), path);
}

export function parseJsonText(
  text: string,
  source: string,
): Result<unknown, string> {
  try {
    const parsed: unknown = JSON.parse(text);
    return succeed(parsed);
  } catch {
    return fail(`${source} is not valid JSON.`);
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
