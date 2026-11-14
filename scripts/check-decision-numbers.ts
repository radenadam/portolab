import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { decisionNumberProblems } from "./decision-number-problems.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const problems = decisionNumberProblems("docs/decisions");
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
