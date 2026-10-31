import { readTextFile } from "./json.ts";
import { parseAgentTools } from "./review-inputs.ts";
import { exitWithFailure } from "./script-failure.ts";

const definitionPath = process.argv[2] ?? "";
const definition = readTextFile(definitionPath);
if (!definition.ok) {
  exitWithFailure([definition.failure]);
}
const tools = parseAgentTools(definition.value, definitionPath);
if (!tools.ok) {
  exitWithFailure([tools.failure]);
}
process.stdout.write(tools.value);
