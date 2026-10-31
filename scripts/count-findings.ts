import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readLensReports } from "./lens-reports.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The verify job downloads the reports of every lens into this directory.
const { reports, problems } = readLensReports("findings");
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
let total = 0;
for (const report of reports) {
  total += report.findings.length;
}
process.stdout.write(String(total));
