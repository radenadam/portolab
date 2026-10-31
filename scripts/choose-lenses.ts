import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import { chooseLenses, parseRouterChoice } from "./review-inputs.ts";
import { parseRouteSchemaLenses, reviewSchemaPaths } from "./review-schemas.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const knownLenses = readJsonFile(
  reviewSchemaPaths.route,
  parseRouteSchemaLenses,
);
const chosenLenses = parseJsonWith(
  process.env["ROUTER_OUTPUT"],
  "ROUTER_OUTPUT",
  parseRouterChoice,
);
if (!knownLenses.ok || !chosenLenses.ok) {
  exitWithFailure(failuresOf([knownLenses, chosenLenses]), writeScriptFailure);
}
const lenses = chooseLenses(chosenLenses.value, knownLenses.value);
if (!lenses.ok) {
  exitWithFailure([lenses.failure], writeScriptFailure);
}
process.stdout.write(JSON.stringify(lenses.value));
