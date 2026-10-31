import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readJsonFile } from "./json.ts";
import { parseSchema } from "./review-schemas.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const schemaPath = process.argv[2];
if (schemaPath === undefined) {
  exitWithFailure(
    ["print-schema.ts needs the path of a schema as its first argument."],
    writeScriptFailure,
  );
}
const schema = readJsonFile(schemaPath, parseSchema);
if (!schema.ok) {
  exitWithFailure([schema.failure], writeScriptFailure);
}
// The agent action takes the schema as one argument, so it is printed on one line.
process.stdout.write(JSON.stringify(schema.value));
