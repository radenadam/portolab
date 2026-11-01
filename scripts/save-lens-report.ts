import { writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { failuresOf } from "../app/result.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import { parseLensOutput, toLensReport } from "./lens-reports.ts";
import { parseChoice } from "../app/value-parsers.ts";
import { parseRouteSchemaLenses, reviewSchemaPaths } from "./review-schemas.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const knownLenses = readJsonFile(
  reviewSchemaPaths.route,
  parseRouteSchemaLenses,
);
const output = parseJsonWith(
  process.env["LENS_OUTPUT"],
  "LENS_OUTPUT",
  parseLensOutput,
);
// The name of the lens can only be checked against the schema, so a schema that cannot be read stands in for it.
const lens = knownLenses.ok
  ? parseChoice(process.env["LENS"], "LENS", knownLenses.value)
  : knownLenses;
if (!lens.ok || !output.ok) {
  exitWithFailure(failuresOf([lens, output]), writeScriptFailure);
}
writeFileSync(
  `findings-${lens.value}.json`,
  JSON.stringify(toLensReport(lens.value, output.value), null, 2),
);
