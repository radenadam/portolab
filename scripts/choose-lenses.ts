import { exitWithFailure } from "./exit-with-failure.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import {
  chooseLenses,
  parseRouteSchemaLenses,
  parseRouterChoice,
} from "./review-inputs.ts";

const knownLenses = readJsonFile(
  ".github/review/route.schema.json",
  parseRouteSchemaLenses,
);
if (!knownLenses.ok) {
  exitWithFailure([knownLenses.failure]);
}
const chosenLenses = parseJsonWith(
  process.env["ROUTER_OUTPUT"],
  "ROUTER_OUTPUT",
  parseRouterChoice,
);
if (!chosenLenses.ok) {
  exitWithFailure([chosenLenses.failure]);
}
const lenses = chooseLenses(chosenLenses.value, knownLenses.value);
if (!lenses.ok) {
  exitWithFailure([lenses.failure]);
}
process.stdout.write(JSON.stringify(lenses.value));
