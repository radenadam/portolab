import { readdirSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readJsonFile } from "./json.ts";
import { readFilesIn } from "./read-files-in.ts";
import {
  isInterfaceTest,
  messageKeyProblems,
  messageKeys,
  parseLocales,
  readMessages,
  untestedMessageProblems,
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

// Every text of the interface must appear in a test in each language, so the check reads the source of every test that can show one.
const testSources: string[] = [];
for (const folder of ["app", "e2e"]) {
  for (const test of readFilesIn(folder, isInterfaceTest)) {
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
      ...untestedMessageProblems(path, messages.value, testSources),
    );
  } else {
    problems.push(messages.failure);
  }
}
// Keys can only be compared once every language file has been read.
if (problems.length === 0) {
  problems.push(...messageKeyProblems(keysByLanguage, featureFolders));
}
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
