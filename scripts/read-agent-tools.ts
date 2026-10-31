import { exitWithFailure } from "./exit-with-failure.ts";
import { readTextFile } from "./read-text-file.ts";
import { parseAgentTools } from "./review-inputs.ts";

const definitionPath = process.argv[2];
if (definitionPath === undefined) {
  exitWithFailure([
    "read-agent-tools.ts needs the path of an agent definition as its first argument.",
  ]);
}
const definition = readTextFile(definitionPath);
if (!definition.ok) {
  exitWithFailure([definition.failure]);
}
const tools = parseAgentTools(definition.value, definitionPath);
if (!tools.ok) {
  exitWithFailure([tools.failure]);
}
process.stdout.write(tools.value);
