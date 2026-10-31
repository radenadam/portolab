import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord, isStringArray } from "../app/value-shapes.ts";
import { invalidField, parseJsonObject, readJsonFile } from "./json.ts";
import { listOfWords } from "./sentences.ts";

/** Reads the languages of the app from the settings of the inlang project. */
export function parseLocales(
  value: unknown,
  source: string,
): Result<string[], string> {
  const locales = isRecord(value) ? value["locales"] : undefined;
  return isStringArray(locales) && locales.length > 0
    ? succeed(locales)
    : invalidField(source, "locales");
}

/** Reads one language file of Paraglide messages as an object of message keys. */
export function readMessages(
  path: string,
): Result<Record<string, unknown>, string> {
  return readJsonFile(path, parseJsonObject);
}

/** Returns the keys of the messages in one language file, without the key that names the file's schema. */
export function messageKeys(messages: Record<string, unknown>): string[] {
  return Object.keys(messages).filter((key) => key !== "$schema");
}

// The kinds of text in the interface, so that a reader can find every text of one kind by its key.
const messageKinds = [
  "title",
  "body",
  "label",
  "notice",
  "error",
  "link",
  "name",
];

/** Returns one sentence for each key that a language lacks, that does not start with a feature folder or with app, or that does not end with a kind of text. */
export function messageKeyProblems(
  keysByLanguage: ReadonlyMap<string, readonly string[]>,
  featureFolders: readonly string[],
): string[] {
  const allowedPrefixes = [
    "app",
    ...featureFolders.map((folder) => folder.replaceAll("-", "_")),
  ];
  const allKeys = new Set([...keysByLanguage.values()].flat());
  const problems: string[] = [];
  for (const key of allKeys) {
    for (const [language, keys] of keysByLanguage) {
      if (!keys.includes(key)) {
        problems.push(`messages/${language}.json: add the message "${key}".`);
      }
    }
    if (!allowedPrefixes.some((prefix) => key.startsWith(`${prefix}_`))) {
      problems.push(
        `"${key}": start the key with the feature folder that uses it, or with "app_" when the whole app shares it.`,
      );
    }
    if (!messageKinds.some((kind) => key.endsWith(`_${kind}`))) {
      problems.push(
        `"${key}": end the key with the kind of text it holds, which is one of ${listOfWords(
          messageKinds.map((kind) => `_${kind}`),
          "disjunction",
        )}.`,
      );
    }
  }
  return problems;
}
