import { mkdirSync, writeFileSync } from "node:fs";
import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseJsonWith } from "./json.ts";
import { parseReviewPlan } from "./review-plan.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const plan = parseJsonWith(process.env["PLAN"], "PLAN", parseReviewPlan);
if (!plan.ok) {
  exitWithFailure([plan.failure], writeScriptFailure);
}
// The reviewer reads the list from this file, one path on each line.
mkdirSync("review", { recursive: true });
writeFileSync("review/files.txt", `${plan.value.files.join("\n")}\n`);
