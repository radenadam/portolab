import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord, isStringArray, readJsonFile } from "./json.ts";

/** Reads the languages of the app from the settings of the inlang project. */
export function parseLocales(
  value: unknown,
  source: string,
): Result<string[], string> {
  const locales = isRecord(value) ? value["locales"] : undefined;
  return isStringArray(locales) && locales.length > 0
    ? succeed(locales)
    : fail(`${source} has no valid "locales".`);
}

/** Reads one language file of Paraglide messages as an object of message keys. */
export function readMessages(
  path: string,
): Result<Record<string, unknown>, string> {
  return readJsonFile(path, parseMessages);
}

export function parseMessages(
  value: unknown,
  source: string,
): Result<Record<string, unknown>, string> {
  return isRecord(value)
    ? succeed(value)
    : fail(`${source} must be a JSON object of messages.`);
}

/** Returns one sentence for each key that a language lacks, or that does not start with a feature folder or with app. */
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
  }
  return problems;
}
