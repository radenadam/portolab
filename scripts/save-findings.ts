import { mkdirSync, writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonWith } from "./json.ts";
import { parseReviewerReport } from "./review-findings.ts";
import { buildRoundReport, parseReviewPlan } from "./review-plan.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The reviewer's answer depends on the plan, because only a review round has one.
const plan = parseJsonWith(process.env["PLAN"], "PLAN", parseReviewPlan);
if (!plan.ok) {
  exitWithFailure([plan.failure], writeScriptFailure);
}
const reviewerReport =
  plan.value.kind === "review"
    ? parseJsonWith(
        process.env["REVIEWER_OUTPUT"],
        "REVIEWER_OUTPUT",
        parseReviewerReport,
      )
    : undefined;
if (reviewerReport?.ok === false) {
  exitWithFailure([reviewerReport.failure], writeScriptFailure);
}
const roundReport = buildRoundReport(plan.value, reviewerReport?.value);
// The verifier reads the findings from this file. The review job builds the same report from the outputs of the jobs, so it never trusts this file.
mkdirSync("review", { recursive: true });
writeFileSync("review/findings.json", JSON.stringify(roundReport, null, 2));
process.stdout.write(`total=${String(roundReport.findings.length)}\n`);
