import { failuresOf } from "../app/result.ts";
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
const chosenLenses = parseJsonWith(
  process.env["ROUTER_OUTPUT"],
  "ROUTER_OUTPUT",
  parseRouterChoice,
);
if (!knownLenses.ok || !chosenLenses.ok) {
  exitWithFailure(failuresOf([knownLenses, chosenLenses]));
}
const lenses = chooseLenses(chosenLenses.value, knownLenses.value);
if (!lenses.ok) {
  exitWithFailure([lenses.failure]);
}
process.stdout.write(JSON.stringify(lenses.value));
