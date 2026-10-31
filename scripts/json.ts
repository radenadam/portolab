import { readFileSync } from "node:fs";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

export function readTextFile(path: string): Result<string, string> {
  try {
    return succeed(readFileSync(path, "utf8"));
  } catch (error) {
    return fail(
      `${path} cannot be read. The system reported: ${errorMessage(error)}`,
    );
  }
}

export function parseJsonText(
  text: string,
  source: string,
): Result<unknown, string> {
  try {
    const parsed: unknown = JSON.parse(text);
    return succeed(parsed);
  } catch (error) {
    return fail(
      `${source} is not valid JSON. The parser reported: ${errorMessage(error)}`,
    );
  }
}

/** Reads a JSON file and parses its content, naming the file as the source of every failure. */
export function readJsonFile<Value>(
  path: string,
  parse: (value: unknown, source: string) => Result<Value, string>,
): Result<Value, string> {
  const text = readTextFile(path);
  const json = text.ok ? parseJsonText(text.value, path) : text;
  return json.ok ? parse(json.value, path) : json;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
