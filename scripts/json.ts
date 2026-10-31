import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord, isStringArray } from "../app/value-shapes.ts";
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
    return fail(
      `${source} must be JSON text, but it is ${describeValue(value)}.`,
    );
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

interface ListField<Item> {
  field: string;
  /** What one item is called in a failure text, such as "finding". */
  itemName: string;
  parseItem: Parser<Item>;
}

/** Reads a field of a JSON object that holds a list, and parses each item. A failure names the position of the item, such as "finding 2". */
export function parseListField<Item>(
  value: unknown,
  source: string,
  list: ListField<Item>,
): Result<Item[], string> {
  const items = isRecord(value) ? value[list.field] : undefined;
  if (!Array.isArray(items)) {
    return invalidField(source, {
      field: list.field,
      expected: "a list",
      value: items,
    });
  }
  const parsedItems: Item[] = [];
  for (const [index, item] of items.entries()) {
    const parsedItem = list.parseItem(
      item,
      `${source}: ${list.itemName} ${String(index + 1)}`,
    );
    if (!parsedItem.ok) {
      return parsedItem;
    }
    parsedItems.push(parsedItem.value);
  }
  return succeed(parsedItems);
}

interface StringsPath {
  /** The keys that lead to the list, or none when the value is the list. */
  keys: readonly string[];
  mayBeEmpty: boolean;
}

/** Reads the list of strings at a path of keys in a JSON value, such as the languages in a settings file or the names of the lenses in a schema. */
export function parseStringsAt(
  value: unknown,
  source: string,
  path: StringsPath,
): Result<string[], string> {
  let current = value;
  for (const key of path.keys) {
    current = isRecord(current) ? current[key] : undefined;
  }
  if (isStringArray(current) && (path.mayBeEmpty || current.length > 0)) {
    return succeed(current);
  }
  const list = path.mayBeEmpty
    ? "a list of strings"
    : "a list of strings that is not empty";
  const given = describeValue(current);
  if (path.keys.length === 0) {
    return fail(`${source} must be ${list}, but it is ${given}.`);
  }
  const place = path.keys.join(".");
  return fail(
    `${source} must have ${list} at ${place}, but ${place} is ${given}.`,
  );
}

/** Reads a JSON object whose fields its caller reads later, such as a file of messages or a schema. */
export function parseJsonObject(
  value: unknown,
  source: string,
): Result<Record<string, unknown>, string> {
  return isRecord(value) ? succeed(value) : notAnObject(source, value);
}

export function notAnObject(
  source: string,
  value: unknown,
): Result<never, string> {
  return fail(
    `${source} must be a JSON object, but it is ${describeValue(value)}.`,
  );
}

interface FieldProblem {
  field: string;
  /** What the field must hold, such as "a string". */
  expected: string;
  value: unknown;
}

export function invalidField(
  source: string,
  problem: FieldProblem,
): Result<never, string> {
  return fail(
    `${source} must have ${problem.expected} at ${problem.field}, but ${problem.field} is ${describeValue(problem.value)}.`,
  );
}

/** Reads a field of a JSON object that holds text. */
export function parseStringField(
  value: unknown,
  source: string,
  field: string,
): Result<string, string> {
  const fieldValue = isRecord(value) ? value[field] : undefined;
  return typeof fieldValue === "string"
    ? succeed(fieldValue)
    : invalidField(source, { field, expected: "a string", value: fieldValue });
}
