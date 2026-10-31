import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { readTextFile } from "./read-text-file.ts";

/** A parser at a boundary. Its caller supplies the source, which every failure text names. */
export type Parser<Value> = (
  value: unknown,
  source: string,
) => Result<Value, string>;

export function parseJsonText(
  value: unknown,
  source: string,
): Result<unknown, string> {
  // GitHub Actions sets an environment variable to an empty string when the expression behind it is empty, so both cases mean that the input never arrived.
  if (value === undefined || value === "") {
    return fail(`${source} is empty or not set, so it holds no JSON.`);
  }
  if (typeof value !== "string") {
    return fail(`${source} must be JSON text, but it is a ${typeof value}.`);
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return succeed(parsed);
  } catch (error) {
    return fail(
      `${source} is not valid JSON. The parser reported: ${errorMessage(error)}`,
    );
  }
}

/** Parses JSON text, such as an environment variable, and then its content. */
export function parseJsonWith<Value>(
  value: unknown,
  source: string,
  parse: Parser<Value>,
): Result<Value, string> {
  const json = parseJsonText(value, source);
  return json.ok ? parse(json.value, source) : json;
}

/** Reads a JSON file and parses its content, naming the file as the source of every failure. */
export function readJsonFile<Value>(
  path: string,
  parse: Parser<Value>,
): Result<Value, string> {
  const text = readTextFile(path);
  return text.ok ? parseJsonWith(text.value, path, parse) : text;
}

export function notAnObject(source: string): Result<never, string> {
  return fail(`${source} is not a JSON object.`);
}

export function invalidField(
  source: string,
  field: string,
): Result<never, string> {
  return fail(`${source} has no valid "${field}".`);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
