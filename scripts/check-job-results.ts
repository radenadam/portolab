import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { checkJobProblems } from "./check-job-problems.ts";
import { parseJsonObject, parseJsonWith } from "./json.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const source = "CHECK_RESULTS";
const results = parseJsonWith(process.env[source], source, parseJsonObject);
const problems = results.ok
  ? checkJobProblems(results.value, source)
  : [results.failure];
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
