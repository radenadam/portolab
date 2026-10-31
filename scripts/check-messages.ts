import { readdirSync } from "node:fs";
import { readJsonFile } from "./json.ts";
import { messageKeyProblems, parseLocales, readMessages } from "./messages.ts";
import { exitWithFailure } from "./script-failure.ts";

// Paraglide falls back to the base language when a message is missing, so a gap would never surface as an error.
const locales = readJsonFile("project.inlang/settings.json", parseLocales);
if (!locales.ok) {
  exitWithFailure([locales.failure]);
}
const featureFolders = readdirSync("app/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const problems: string[] = [];
const keysByLanguage = new Map<string, string[]>();
for (const locale of locales.value) {
  const messages = readMessages(`messages/${locale}.json`);
  if (messages.ok) {
    keysByLanguage.set(
      locale,
      Object.keys(messages.value).filter((key) => key !== "$schema"),
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
  exitWithFailure(problems);
}
