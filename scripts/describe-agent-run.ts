import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import { parseChoice, parseFilePath } from "../app/value-parsers.ts";
import { measureAgentRun, panelAgents } from "./agent-run.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The job of the agents measures each transcript, because the transcript stays on its runner, and the review job reads the sentence from the output of that job.
const agent = parseChoice(
  process.argv[2],
  "The first argument of describe-agent-run.ts",
  panelAgents,
);
const transcriptPath = parseFilePath(
  process.argv[3],
  "The second argument of describe-agent-run.ts",
);
if (!agent.ok || !transcriptPath.ok) {
  exitWithFailure(failuresOf([agent, transcriptPath]), writeScriptFailure);
}
process.stdout.write(measureAgentRun(agent.value, transcriptPath.value));
