import { readdirSync } from "node:fs";
import { marketIndex } from "../app/features/market-data/tracked-instruments.ts";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readJsonFile } from "./json.ts";
import { readFilesIn } from "./read-files-in.ts";
import {
  isInterfaceTestSource,
  literalIndexProblems,
  messageKeyProblems,
  messageKeys,
  parseLocales,
  readMessages,
  messageTextProblems,
} from "./messages.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Paraglide falls back to the base language when a message is missing, so a gap would never surface as an error.
const locales = readJsonFile("project.inlang/settings.json", parseLocales);
if (!locales.ok) {
  exitWithFailure([locales.failure], writeScriptFailure);
}
const featureFolders = readdirSync("app/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Shared fixtures keep assertions from repeating the same text, so their literals count alongside the interface tests.
const testSources: string[] = [];
for (const folder of ["app", "e2e"]) {
  for (const test of readFilesIn(folder, isInterfaceTestSource)) {
    testSources.push(test.text);
  }
}

const problems: string[] = [];
const keysByLanguage = new Map<string, string[]>();
for (const locale of locales.value) {
  const path = `messages/${locale}.json`;
  const messages = readMessages(path);
  if (messages.ok) {
    keysByLanguage.set(locale, messageKeys(messages.value));
    problems.push(
      ...literalIndexProblems(path, messages.value, marketIndex.code),
      ...messageTextProblems(path, messages.value, testSources),
    );
  } else {
    problems.push(messages.failure);
  }
}
// Keys can only be compared once every language file has been read.
if (keysByLanguage.size === locales.value.length) {
  problems.push(...messageKeyProblems(keysByLanguage, featureFolders));
}
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
