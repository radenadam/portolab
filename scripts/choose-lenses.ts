import { readJsonFile } from "./json.ts";
import { chooseLenses, parseRouteSchemaLenses } from "./review-inputs.ts";

const schemaPath = ".github/review/route.schema.json";
const schema = readJsonFile(schemaPath);
const knownLenses = schema.ok
  ? parseRouteSchemaLenses(schema.value, schemaPath)
  : schema;
if (!knownLenses.ok) {
  process.stderr.write(`::error::${knownLenses.failure}\n`);
  process.exit(1);
}
const lenses = chooseLenses(
  process.env["ROUTER_OUTPUT"] ?? "",
  knownLenses.value,
);
if (!lenses.ok) {
  process.stderr.write(`::error::${lenses.failure}\n`);
  process.exit(1);
}
process.stdout.write(JSON.stringify(lenses.value));
