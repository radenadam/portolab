import { writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonWith } from "./json.ts";
import { parseVerifiedFindings } from "./review-inputs.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const verified = parseJsonWith(
  process.env["VERIFIER_OUTPUT"],
  "VERIFIER_OUTPUT",
  parseVerifiedFindings,
);
if (!verified.ok) {
  exitWithFailure([verified.failure], writeScriptFailure);
}
writeFileSync(
  "verified.json",
  JSON.stringify({ findings: verified.value }, null, 2),
);
