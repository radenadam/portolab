import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonObject, readJsonFile } from "./json.ts";
import { parsePathArgument } from "./parse-path-argument.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const schemaPath = parsePathArgument(
  process.argv[2],
  "The first argument of print-schema.ts",
);
if (!schemaPath.ok) {
  exitWithFailure([schemaPath.failure], writeScriptFailure);
}
const schema = readJsonFile(schemaPath.value, parseJsonObject);
if (!schema.ok) {
  exitWithFailure([schema.failure], writeScriptFailure);
}
// The agent action takes the schema as one argument, so it is printed on one line.
process.stdout.write(JSON.stringify(schema.value));
