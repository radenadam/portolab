import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { followsGuide, parseTestEvent } from "./deployment-guide.ts";
import { readChangedFiles } from "./review-history.ts";
import { parseBranchName } from "./review-inputs.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The workflow of the deployment writes the output of this script to its outputs, and a later step follows the guide only when the output says so.
const event = parseTestEvent(
  process.env["GITHUB_EVENT_NAME"],
  "GITHUB_EVENT_NAME",
);
if (!event.ok) {
  exitWithFailure([event.failure], writeScriptFailure);
}
const decision = followsGuide(event.value, () => {
  const base = parseBranchName(process.env["BASE_REF"], "BASE_REF");
  return base.ok ? readChangedFiles([`origin/${base.value}...HEAD`]) : base;
});
if (!decision.ok) {
  exitWithFailure([decision.failure], writeScriptFailure);
}
if (!decision.value) {
  process.stderr.write(
    "The change touches no file of the deployment or of its test, so the test does not follow the guide.\n",
  );
}
process.stdout.write(`run=${String(decision.value)}\n`);
