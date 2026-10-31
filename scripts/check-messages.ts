import { readdirSync } from "node:fs";
import { messageKeyProblems, readMessages } from "./messages.ts";

// Paraglide falls back to the base language when a message is missing, so a gap would never surface as an error.
const languages = ["id", "en"];
const featureFolders = readdirSync("app/features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const problems: string[] = [];
const keysByLanguage = new Map<string, string[]>();
for (const language of languages) {
  const messages = readMessages(`messages/${language}.json`);
  if (messages.ok) {
    keysByLanguage.set(
      language,
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
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exit(1);
}
