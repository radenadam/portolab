import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import { isRecord, isStringArray } from "../app/value-shapes.ts";
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
    return fail(
      `${source} must be JSON text, but it holds a value of type ${value === null ? "null" : typeof value}.`,
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
    return invalidField(source, list.field);
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

/** Reads the list of strings at a path of keys in a JSON object, such as the languages in a settings file or the names of the lenses in a schema. The list must not be empty. */
export function parseStringsAt(
  value: unknown,
  source: string,
  keys: readonly string[],
): Result<string[], string> {
  let current = value;
  for (const key of keys) {
    current = isRecord(current) ? current[key] : undefined;
  }
  return isStringArray(current) && current.length > 0
    ? succeed(current)
    : fail(`${source} has no list of strings at ${keys.join(".")}.`);
}

/** Reads a JSON object whose fields its caller reads later, such as a file of messages or a schema. */
export function parseJsonObject(
  value: unknown,
  source: string,
): Result<Record<string, unknown>, string> {
  return isRecord(value) ? succeed(value) : notAnObject(source);
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
