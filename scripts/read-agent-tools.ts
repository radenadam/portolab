import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readTextFile } from "./read-text-file.ts";
import { parseAgentTools } from "./review-inputs.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const definitionPath = process.argv[2];
if (definitionPath === undefined) {
  exitWithFailure(
    [
      "read-agent-tools.ts needs the path of an agent definition as its first argument.",
    ],
    writeScriptFailure,
  );
}
const definition = readTextFile(definitionPath);
if (!definition.ok) {
  exitWithFailure([definition.failure], writeScriptFailure);
}
const tools = parseAgentTools(definition.value, definitionPath);
if (!tools.ok) {
  exitWithFailure([tools.failure], writeScriptFailure);
}
process.stdout.write(tools.value);
