import type { Result } from "../app/result.ts";
import { fail } from "../app/result.ts";
import ts from "typescript";
import { parseJsonObject, parseJsonWith, parseStringsAt } from "./json.ts";
import { readTextFile } from "./read-text-file.ts";
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
  const text = readTextFile(path);
  if (!text.ok) return text;
  const parsed = parseJsonWith(text.value, path, parseJsonObject);
  if (!parsed.ok) return parsed;
  // JSON.parse keeps only the last copy, so the parsed object cannot reveal a duplicate message.
  const keys = new Set<string>();
  const duplicates = new Set<string>();
  function visit(node: ts.Node): void {
    if (!ts.isObjectLiteralExpression(node)) {
      ts.forEachChild(node, visit);
      return;
    }
    for (const property of node.properties) {
      if (
        ts.isPropertyAssignment(property) &&
        ts.isStringLiteral(property.name)
      ) {
        const key = property.name.text;
        if (keys.has(key)) duplicates.add(describeValue(key));
        keys.add(key);
      }
    }
  }
  visit(ts.parseJsonText(path, text.value));
  return duplicates.size > 0
    ? fail(
        `${path} must give each message key once, but it repeats ${listOfWords([...duplicates])}.`,
      )
    : parsed;
}

/** Returns the keys of the messages in one language file, without the key that names the file's schema. */
export function messageKeys(messages: Record<string, unknown>): string[] {
  return Object.keys(messages).filter((key) => key !== "$schema");
}

/** The index code comes from its definition, so translations must take it through a placeholder. */
export function literalIndexProblems(
  path: string,
  messages: Record<string, unknown>,
  indexCode: string,
): string[] {
  const problems: string[] = [];
  for (const key of messageKeys(messages)) {
    const text = messages[key];
    if (typeof text !== "string") continue;
    const words = text.replaceAll(/\{[^}]*\}/gu, "").split(/[^\p{L}\p{N}_]+/u);
    if (words.some((word) => word.toUpperCase() === indexCode.toUpperCase())) {
      problems.push(
        `${path}: the message "${key}" writes the index "${indexCode}" directly, so take its code through a placeholder.`,
      );
    }
  }
  return problems;
}

// The kinds of text in the interface, so that a reader can find every text of one kind by its key. A part is a piece of a sentence that code joins into another text, such as a range of characters.
const messageKinds = [
  "title",
  "body",
  "label",
  "hint",
  "notice",
  "error",
  "link",
  "name",
  "part",
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

/** Expected interface text can live in a named fixture shared by unit and browser tests. */
export function isInterfaceTestSource(path: string): boolean {
  return (
    /^e2e\/.+\.test\.ts$/.test(path) ||
    /^app\/.+\.test\.tsx?$/.test(path) ||
    /^(?:app|e2e)\/.+-for-test\.tsx?$/.test(path)
  );
}

/** Checks that messages are complete texts instead of leading fragments, and that tests show every text in full. A message without placeholders must appear as a whole string, because a short label also appears inside longer texts. Each part between placeholders must appear in a test. */
export function messageTextProblems(
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
    if (!key.endsWith("_part") && /^[\s·,:;]/u.test(text)) {
      problems.push(
        `${path}: the message "${key}" starts with whitespace or a separator, so write a complete message instead of a fragment that code joins.`,
      );
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
