import { readdirSync } from "node:fs";
import { isRecord, readJsonFile } from "./json.ts";
import { messageKeyProblems } from "./message-keys.ts";

// Paraglide falls back to the base language when a message is missing, so a gap would never surface as an error.
const languages = ["id", "en"];
const featureFolders = readdirSync("app/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const keysByLanguage = new Map(
  languages.map((language) => [language, messageKeys(language)]),
);
const problems = messageKeyProblems(keysByLanguage, featureFolders);

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
