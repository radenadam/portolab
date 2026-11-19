import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readFilesIn } from "./read-files-in.ts";
import { styleLayerProblems } from "./style-layer-problems.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

const problems = readFilesIn("app", (path) => path.endsWith(".css")).flatMap(
  styleLayerProblems,
);
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
