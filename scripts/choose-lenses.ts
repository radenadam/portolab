import { readJsonFile } from "./json.ts";
import { chooseLenses, parseRouteSchemaLenses } from "./review-inputs.ts";
import { exitWithFailure } from "./script-failure.ts";

const knownLenses = readJsonFile(
  ".github/review/route.schema.json",
  parseRouteSchemaLenses,
);
if (!knownLenses.ok) {
  exitWithFailure([knownLenses.failure]);
}
const lenses = chooseLenses(
  process.env["ROUTER_OUTPUT"] ?? "",
  knownLenses.value,
);
if (!lenses.ok) {
  exitWithFailure([lenses.failure]);
}
process.stdout.write(JSON.stringify(lenses.value));
