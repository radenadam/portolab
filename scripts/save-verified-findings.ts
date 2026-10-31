import { writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonWith } from "./json.ts";
import { readLensReports } from "./lens-reports.ts";
import { parseVerifiedFindings } from "./review-inputs.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The verify job downloads the reports of every lens into this directory.
const { reports, problems } = readLensReports("findings");
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
// The verifier runs only when a lens reported a finding, so without findings there is no output to read.
if (reports.every((report) => report.findings.length === 0)) {
  writeFileSync("verified.json", JSON.stringify({ findings: [] }, null, 2));
} else {
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
}
