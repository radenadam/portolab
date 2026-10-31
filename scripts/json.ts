import { readFileSync } from "node:fs";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

/** A parser at a boundary. Its caller supplies the source, which every failure text names. */
export type Parser<Value> = (
  value: unknown,
  source: string,
) => Result<Value, string>;

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

/** Parses JSON text, such as an environment variable, and then its content. */
export function parseJsonWith<Value>(
  text: string,
  source: string,
  parse: Parser<Value>,
): Result<Value, string> {
  const json = parseJsonText(text, source);
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
