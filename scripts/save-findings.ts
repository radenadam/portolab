import { writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonWith, readJsonFile } from "./json.ts";
import { numberFindings, parseReviewerReport } from "./review-findings.ts";
import type { FindingsToVerify } from "./review-findings.ts";
import { parseReviewPlan } from "./review-plan.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The reviewer's answer depends on the plan, because only a review round has one.
const plan = readJsonFile("review/plan.json", parseReviewPlan);
if (!plan.ok) {
  exitWithFailure([plan.failure], writeScriptFailure);
}
const toVerify: FindingsToVerify = {
  findings: [...plan.value.previous.openFindings],
  candidateStandards: [],
};
if (plan.value.kind === "review") {
  const report = parseJsonWith(
    process.env["REVIEWER_OUTPUT"],
    "REVIEWER_OUTPUT",
    parseReviewerReport,
  );
  if (!report.ok) {
    exitWithFailure([report.failure], writeScriptFailure);
  }
  toVerify.findings.unshift(
    ...numberFindings(plan.value.round, report.value.findings),
  );
  toVerify.candidateStandards = report.value.candidateStandards;
}
writeFileSync("review/findings.json", JSON.stringify(toVerify, null, 2));
process.stdout.write(`total=${String(toVerify.findings.length)}\n`);
