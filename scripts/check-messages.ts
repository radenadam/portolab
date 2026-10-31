import { readdirSync } from "node:fs";
import { isRecord, readJsonFile } from "./json.ts";

// Paraglide falls back to the base language when a message is missing, so a gap would never surface as an error.
const languages = ["id", "en"];
const featureNames = readdirSync("app/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name.replaceAll("-", "_"));
const allowedPrefixes = ["app", ...featureNames];

const keysByLanguage = new Map(
  languages.map((language) => [language, messageKeys(language)]),
);
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

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exit(1);
}

function messageKeys(language: string): string[] {
  const path = `messages/${language}.json`;
  const messages = readJsonFile(path);
  if (!messages.ok) {
    process.stderr.write(`${messages.failure}\n`);
    process.exit(1);
  }
  if (!isRecord(messages.value)) {
    process.stderr.write(`${path} must be a JSON object of messages.\n`);
    process.exit(1);
  }
  return Object.keys(messages.value).filter((key) => key !== "$schema");
}
