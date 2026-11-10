import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { parseDependabotTitle } from "./parse-dependabot-title.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// The check of titles and the merge of an update both read the subject here, so the subject that the check accepts is the one that lands.
const subject = parseDependabotTitle(process.env["TITLE"], "TITLE");
if (!subject.ok) {
  exitWithFailure([subject.failure], writeScriptFailure);
}
process.stdout.write(subject.value);
