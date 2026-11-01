import { exitWithFailure } from "../app/exit-with-failure.server.ts";
import { readFilesIn } from "./read-files-in.ts";
import {
  isWorkflowFile,
  parseWorkflowJobs,
  timeLimitProblems,
} from "./workflow-steps.ts";
import { writeScriptFailure } from "./write-script-failure.ts";

// Every step of a workflow has a time limit below the limit of its job, as the timeout standard in AGENTS.md asks.
const workflows = readFilesIn(".github/workflows", isWorkflowFile);
const problems: string[] = [];
if (workflows.length === 0) {
  problems.push(
    "The check found no workflow in .github/workflows, so it would pass without checking anything.",
  );
}
for (const workflow of workflows) {
  const jobs = parseWorkflowJobs(workflow.text, workflow.path);
  if (jobs.ok) {
    problems.push(...timeLimitProblems(workflow.path, jobs.value));
  } else {
    problems.push(jobs.failure);
  }
}
if (problems.length > 0) {
  exitWithFailure(problems, writeScriptFailure);
}
