import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseFilePath } from "../app/value-parsers.ts";
import { parseTranscriptRun } from "./agent-run.ts";
import { readJsonFile } from "./json.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The transcript stays on the runner of the agent's job, so that job measures it and gives the numbers as its output, which the review job parses.
const transcriptPath = parseFilePath(
  process.argv[2],
  "The first argument of measure-agent-run.ts",
);
if (!transcriptPath.ok) {
  exitWithFailure([transcriptPath.failure], writeScriptFailure);
}
const run = readJsonFile(transcriptPath.value, parseTranscriptRun);
if (!run.ok) {
  exitWithFailure([run.failure], writeScriptFailure);
}
process.stdout.write(JSON.stringify(run.value));
