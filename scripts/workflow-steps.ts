import { parse } from "yaml";
import { errorMessage } from "../app/error-message.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";

interface WorkflowStep {
  /** The name of the step, or what it uses or runs when it has no name. */
  label: string;
  timeoutMinutes: number | undefined;
}

interface WorkflowJob {
  id: string;
  timeoutMinutes: number | undefined;
  steps: WorkflowStep[];
}

/** Whether a path names a workflow of GitHub Actions. */
export function isWorkflowFile(path: string): boolean {
  return /^\.github\/workflows\/[^/]+\.ya?ml$/.test(path);
}

/** Reads the text of a workflow into its jobs, with the time limit of each job and of each of its steps. */
export function parseWorkflowJobs(
  value: unknown,
  source: string,
): Result<WorkflowJob[], string> {
  if (typeof value !== "string") {
    return fail(
      `${source} must be the text of a workflow, but it is ${describeValue(value)}.`,
    );
  }
  let workflow: unknown;
  try {
    workflow = parse(value);
  } catch (error) {
    return fail(
      `${source} must be valid YAML, but it is not. The parser reported: ${errorMessage(error)}`,
    );
  }
  const jobs = isRecord(workflow) ? workflow["jobs"] : undefined;
  if (!isRecord(jobs)) {
    return fail(
      `${source} must have an object at jobs, but jobs is ${describeValue(jobs)}.`,
    );
  }
  const parsedJobs: WorkflowJob[] = [];
  for (const [id, job] of Object.entries(jobs)) {
    const parsedJob = parseJob(job, `${source}: the job ${id}`);
    if (!parsedJob.ok) {
      return parsedJob;
    }
    parsedJobs.push({ id, ...parsedJob.value });
  }
  return succeed(parsedJobs);
}

/** Returns one sentence for each job without a time limit, and for each step without a time limit below the limit of its job. A step needs a limit of its own, so a step that hangs fails by name while its job still has time for the steps that keep its records. */
export function timeLimitProblems(
  source: string,
  jobs: readonly WorkflowJob[],
): string[] {
  const problems: string[] = [];
  for (const job of jobs) {
    if (job.timeoutMinutes === undefined) {
      problems.push(
        `${source}: the job ${job.id} must have a timeout-minutes, but it has none.`,
      );
      continue;
    }
    const jobMinutes = String(job.timeoutMinutes);
    for (const step of job.steps) {
      if (step.timeoutMinutes === undefined) {
        problems.push(
          `${source}: the step "${step.label}" of the job ${job.id} must have a timeout-minutes below the ${jobMinutes} minutes of its job, but it has none.`,
        );
      } else if (step.timeoutMinutes >= job.timeoutMinutes) {
        problems.push(
          `${source}: the step "${step.label}" of the job ${job.id} must have a timeout-minutes below the ${jobMinutes} minutes of its job, but it has ${String(step.timeoutMinutes)}.`,
        );
      }
    }
  }
  return problems;
}

function parseJob(
  value: unknown,
  source: string,
): Result<Omit<WorkflowJob, "id">, string> {
  const job = parseTimedEntry(value, source);
  if (!job.ok) {
    return job;
  }
  const { fields, timeoutMinutes } = job.value;
  const steps = fields["steps"];
  if (!Array.isArray(steps)) {
    return fail(
      `${source} must have a list at steps, but steps is ${describeValue(steps)}.`,
    );
  }
  const parsedSteps: WorkflowStep[] = [];
  for (const [index, step] of steps.entries()) {
    const parsedStep = parseStep(step, `${source}, step ${String(index + 1)}`);
    if (!parsedStep.ok) {
      return parsedStep;
    }
    parsedSteps.push(parsedStep.value);
  }
  return succeed({ timeoutMinutes, steps: parsedSteps });
}

function parseStep(
  value: unknown,
  source: string,
): Result<WorkflowStep, string> {
  const step = parseTimedEntry(value, source);
  if (!step.ok) {
    return step;
  }
  const { fields, timeoutMinutes } = step.value;
  const { name, uses, run } = fields;
  let label = source;
  if (typeof name === "string") {
    label = name;
  } else if (typeof uses === "string") {
    label = uses;
  } else if (typeof run === "string") {
    label = run;
  }
  return succeed({ label, timeoutMinutes });
}

/** Reads a job or a step, which is an object that may have a time limit. */
function parseTimedEntry(
  value: unknown,
  source: string,
): Result<
  { fields: Record<string, unknown>; timeoutMinutes: number | undefined },
  string
> {
  if (!isRecord(value)) {
    return fail(
      `${source} must be an object, but it is ${describeValue(value)}.`,
    );
  }
  const timeoutMinutes = parseTimeLimit(value["timeout-minutes"], source);
  return timeoutMinutes.ok
    ? succeed({ fields: value, timeoutMinutes: timeoutMinutes.value })
    : timeoutMinutes;
}

function parseTimeLimit(
  value: unknown,
  source: string,
): Result<number | undefined, string> {
  if (value === undefined) {
    return succeed(undefined);
  }
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return succeed(value);
  }
  return fail(
    `${source} must have a whole number of minutes at timeout-minutes, but it is ${describeValue(value)}.`,
  );
}
