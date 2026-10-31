import type { Result } from "../app/result.ts";
import { parseJsonObject, parseStringsAt, readJsonFile } from "./json.ts";
import { listOfWords } from "../app/sentences.ts";
import { describeValue } from "../app/value-shapes.ts";

/** Reads the languages of the app from the settings of the inlang project. */
export function parseLocales(
  value: unknown,
  source: string,
): Result<string[], string> {
  return parseStringsAt(value, source, {
    keys: ["locales"],
    mayBeEmpty: false,
  });
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

/** Whether a file is a test that can show the text of the interface, which means a browser test or a test of the app. */
export function isInterfaceTest(path: string): boolean {
  return /^e2e\/.+\.test\.ts$/.test(path) || /^app\/.+\.test\.tsx?$/.test(path);
}

/** Returns one sentence for each message of a language file whose text no test shows in full. A message without placeholders must appear in a test as a whole string, because a short text such as a label also appears inside longer ones. Each part of a message between its placeholders must appear in a test. */
export function untestedMessageProblems(
  path: string,
  messages: Record<string, unknown>,
  testSources: readonly string[],
): string[] {
  const tests = testSources.join("\n");
  const problems: string[] = [];
  for (const key of messageKeys(messages)) {
    const text = messages[key];
    if (typeof text !== "string") {
      problems.push(
        `${path}: the message "${key}" must be text, but it is ${describeValue(text)}.`,
      );
      continue;
    }
    const parts = text.split(/\{[^}]*\}/);
    if (parts.length === 1) {
      if (!containsWholeString(tests, text)) {
        problems.push(
          `${path}: no test checks the message "${key}", so add a test that shows "${text}" as a whole string.`,
        );
      }
      continue;
    }
    const missingParts = parts.filter(
      (part) => /\p{L}/u.test(part) && !tests.includes(part),
    );
    if (missingParts.length > 0) {
      problems.push(
        `${path}: no test checks the message "${key}" in full, so add a test that shows ${listOfWords(missingParts.map((part) => `"${part}"`))}.`,
      );
    }
  }
  return problems;
}

function containsWholeString(source: string, text: string): boolean {
  for (const quote of ['"', "'", "`"]) {
    if (source.includes(`${quote}${text}${quote}`)) {
      return true;
    }
  }
  return false;
}
