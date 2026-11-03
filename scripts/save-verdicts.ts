import { writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonWith } from "./json.ts";
import { parseVerdicts } from "./review-findings.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const verdicts = parseJsonWith(
  process.env["VERIFIER_OUTPUT"],
  "VERIFIER_OUTPUT",
  parseVerdicts,
);
if (!verdicts.ok) {
  exitWithFailure([verdicts.failure], writeScriptFailure);
}
writeFileSync(
  "review/verdicts.json",
  JSON.stringify({ verdicts: verdicts.value }, null, 2),
);
