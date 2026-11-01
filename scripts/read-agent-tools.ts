import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseFilePath } from "../app/value-parsers.ts";
import { readTextFile } from "./read-text-file.ts";
import { parseAgentTools } from "./review-inputs.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const definitionPath = parseFilePath(
  process.argv[2],
  "The first argument of read-agent-tools.ts",
);
if (!definitionPath.ok) {
  exitWithFailure([definitionPath.failure], writeScriptFailure);
}
const definition = readTextFile(definitionPath.value);
if (!definition.ok) {
  exitWithFailure([definition.failure], writeScriptFailure);
}
const tools = parseAgentTools(definition.value, definitionPath.value);
if (!tools.ok) {
  exitWithFailure([tools.failure], writeScriptFailure);
}
process.stdout.write(tools.value);
