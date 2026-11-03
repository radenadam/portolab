import { countOf, listOfWords, singularOrPlural } from "../app/sentences.ts";
import type { Finding, RoundReport, Verdict } from "./review-findings.ts";
import { checkRoundLimit, reviewRoundLimit, runsAgent } from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import type { ReviewState } from "./review-state.ts";

export interface ReviewInput {
  plan: ReviewPlan;
  /** The head of the pull request that this run reviewed. */
  reviewedHead: string;
  /** The report of the round, built from the plan and the reviewer's answer, or undefined when a review round has no answer. */
  report: RoundReport | undefined;
  /** The verifier's verdicts, or undefined when its job gave none. */
  verdicts: Verdict[] | undefined;
  /** The result of each job of the panel, such as "success" or "failure". */
  jobResults: Record<string, string>;
  /** One sentence for each agent that ran, about its duration and its turns. */
  runs: string[];
  /** Inputs that could not be read, each as one sentence. */
  inputProblems: string[];
}

/** A finding with the verifier's verdict, whose scope and siblings replace the reviewer's. */
export interface VerifiedFinding extends Finding {
  status: Verdict["status"];
  evidence: string;
}

export interface Judgement {
  /** One sentence that says why the review passed or failed. */
  verdict: string;
  passed: boolean;
  /** Whether every agent that the plan needed gave a complete answer. */
  hasFinished: boolean;
  /** The state that the next round reads, or undefined when this run leaves the state as it was. */
  state: ReviewState | undefined;
  /** Every finding with its verdict, apart from the open findings of earlier rounds that the verifier found fixed. */
  verified: VerifiedFinding[];
  blocking: VerifiedFinding[];
  /** The open findings of earlier rounds that the verifier found fixed. */
  fixed: VerifiedFinding[];
}

const passedVerdict = "No verified finding in the change remains.";

/** Decides from the plan, the outputs of the jobs, and their results whether the change passes, and what the next round reads. */
export function judgeReview(input: ReviewInput): Judgement {
  const { plan } = input;
  const failureWithoutAgent = verdictWithoutAgent(plan);
  if (failureWithoutAgent !== undefined) {
    return {
      ...unfinished(plan, failureWithoutAgent),
      blocking: plan.previous.openFindings.map((finding) => ({
        ...finding,
        status: "confirmed",
        evidence: "An earlier round confirmed it.",
      })),
    };
  }
  const reason = unfinishedReason(input);
  return reason === undefined ? finished(input) : unfinished(plan, reason);
}

/** The verdict of a plan that fails without an agent, or undefined for a plan that runs one or passes. */
function verdictWithoutAgent(plan: ReviewPlan): string | undefined {
  const openCount = plan.previous.openFindings.length;
  const reviewRounds = countOf(
    reviewRoundLimit,
    "review round",
    "review rounds",
  );
  const nextStep =
    "A maintainer decides how this pull request continues, and a new pull request with the same commits starts with new rounds.";
  switch (plan.kind) {
    case "review":
    case "check":
    case "pass":
      return undefined;
    case "unchanged":
      return `${countOf(openCount, "verified finding in the change remains", "verified findings in the change remain")}, and no file of the pull request changed since the last finished round, so no agent ran. Push the fixes to start the next round.`;
    case "capped":
      if (openCount > 0) {
        return `The panel has used its ${reviewRounds} and its ${countOf(checkRoundLimit, "round that checks open findings", "rounds that check open findings")}, and ${countOf(openCount, "finding stays open", "findings stay open")}, so it ran no agent. ${nextStep}`;
      }
      return `The panel has used its ${reviewRounds}, and ${
        plan.since === undefined
          ? "no round finished reviewing the change"
          : `the commits since ${plan.since} changed files of the pull request while no finding was open`
      }, so no round may read them and no agent ran. ${nextStep}`;
  }
}

function unfinished(plan: ReviewPlan, verdict: string): Judgement {
  return {
    verdict,
    passed: false,
    hasFinished: false,
    // A run whose agent did not finish still counts as a round, so that a failing agent cannot run without end.
    state: runsAgent(plan)
      ? { ...plan.previous, round: plan.round }
      : undefined,
    verified: [],
    blocking: [],
    fixed: [],
  };
}

function unfinishedReason(input: ReviewInput): string | undefined {
  // Each input problem is a whole sentence, so all of them reach the review and the log of the run.
  if (input.inputProblems.length > 0) {
    return input.inputProblems.join(" ");
  }
  const failedJobs = unsuccessfulJobs(input.plan, input.jobResults);
  if (failedJobs !== undefined) {
    return failedJobs;
  }
  const reportGap = reportProblem(input);
  if (reportGap !== undefined) {
    return reportGap;
  }
  const findings = input.report?.findings ?? [];
  if (findings.length > 0 && input.verdicts === undefined) {
    return "The verifier's verdicts are missing, so no finding has been verified. The log of the verifier's job names the reason.";
  }
  return coverageProblem(findings, input.verdicts ?? []);
}

// The jobs that a kind of plan needs. A job of an agent can fail after its agent answered, such as in its measure, so its answer counts only when the job succeeded.
const expectedJobs: Record<ReviewPlan["kind"], string[]> = {
  review: ["plan", "reviewer", "verifier"],
  check: ["plan", "verifier"],
  pass: ["plan"],
  unchanged: ["plan"],
  capped: ["plan"],
};

/** Returns a sentence that says what happened to every job that the plan needs and that did not succeed. Only a job that ran has a log with the reason, because GitHub skips a job after a job that it needs did not succeed. */
function unsuccessfulJobs(
  plan: ReviewPlan,
  jobResults: Record<string, string>,
): string | undefined {
  const unsuccessful = expectedJobs[plan.kind].filter(
    (job) => jobResults[job] !== "success",
  );
  if (unsuccessful.length === 0) {
    return undefined;
  }
  const outcomes: string[] = [];
  const withLogs: string[] = [];
  for (const job of unsuccessful) {
    const result = jobResults[job];
    if (result === undefined) {
      outcomes.push(`the ${job} job has no result`);
    } else if (result === "skipped") {
      outcomes.push(`the ${job} job was skipped`);
    } else {
      outcomes.push(`the ${job} job ended with the result "${result}"`);
      withLogs.push(job);
    }
  }
  const nextStep =
    withLogs.length === 0
      ? ""
      : ` The ${singularOrPlural(withLogs.length, "log", "logs")} of the ${listOfWords(withLogs)} ${singularOrPlural(withLogs.length, "job names", "jobs name")} the reason.`;
  return `In this round, ${listOfWords(outcomes)}, so the round has not finished.${nextStep}`;
}

/** Returns a sentence when a round that runs an agent has no report, or when the reviewer's report does not account for its work. */
function reportProblem(input: ReviewInput): string | undefined {
  if (input.plan.kind !== "review") {
    return undefined;
  }
  // A missing input is a failure, never an empty one, because a job that did not finish gives no output.
  return input.report === undefined
    ? "The reviewer's report is missing, so this change has not been reviewed. The log of the reviewer's job names the reason."
    : coverageGap(input.plan, input.report);
}

function finished(input: ReviewInput): Judgement {
  // An open finding of an earlier round that the verifier refutes is fixed, because an earlier round confirmed it.
  const earlierIds = new Set(
    input.plan.previous.openFindings.map(({ id }) => id),
  );
  const verified: VerifiedFinding[] = [];
  const fixed: VerifiedFinding[] = [];
  for (const finding of withVerdicts(
    input.report?.findings ?? [],
    input.verdicts ?? [],
  )) {
    if (earlierIds.has(finding.id) && finding.status === "refuted") {
      fixed.push(finding);
    } else {
      verified.push(finding);
    }
  }
  const blocking = verified.filter(
    (finding) => finding.status === "confirmed" && finding.scope === "change",
  );
  return {
    verdict:
      blocking.length > 0
        ? `${countOf(blocking.length, "verified finding in the change remains", "verified findings in the change remain")}.`
        : passedVerdict,
    passed: blocking.length === 0,
    hasFinished: true,
    state: {
      head: input.reviewedHead,
      round: input.plan.round,
      openFindings: blocking.map(withoutVerdict),
    },
    verified,
    blocking,
    fixed,
  };
}

function withVerdicts(
  findings: readonly Finding[],
  verdicts: readonly Verdict[],
): VerifiedFinding[] {
  const verified: VerifiedFinding[] = [];
  for (const finding of findings) {
    const verdict = verdicts.find(({ id }) => id === finding.id);
    if (verdict !== undefined) {
      verified.push({
        ...finding,
        scope: verdict.scope,
        siblings: verdict.siblings,
        status: verdict.status,
        evidence: verdict.evidence,
      });
    }
  }
  return verified;
}

function withoutVerdict(finding: VerifiedFinding): Finding {
  return {
    id: finding.id,
    lens: finding.lens,
    location: finding.location,
    claim: finding.claim,
    basis: finding.basis,
    siblings: finding.siblings,
    rootCause: finding.rootCause,
    scope: finding.scope,
  };
}

/** Returns a sentence when the reviewer's answer does not account for every file under review and every lens of the round, because an answer without findings would otherwise pass for a review that never happened. */
function coverageGap(
  plan: ReviewPlan,
  report: RoundReport,
): string | undefined {
  const unread = plan.files.filter((path) => !report.readFiles.includes(path));
  const checkedLenses = report.lensChecks.map(({ lens }) => lens);
  const unchecked = plan.lenses.filter((lens) => !checkedLenses.includes(lens));
  const gaps: string[] = [];
  if (unread.length > 0) {
    gaps.push(
      `it does not name ${singularOrPlural(unread.length, "the file", "the files")} ${listOfWords(unread)} as read`,
    );
  }
  if (unchecked.length > 0) {
    gaps.push(
      `it does not say what it checked through the ${listOfWords(unchecked)} ${singularOrPlural(unchecked.length, "lens", "lenses")}`,
    );
  }
  return gaps.length === 0
    ? undefined
    : `The reviewer's report cannot be trusted, because ${listOfWords(gaps)}. So this change has not been fully reviewed.`;
}

/** Returns a sentence when the verifier did not give exactly one verdict for each finding, or when a duplicate repeats no confirmed finding. */
function coverageProblem(
  findings: readonly Finding[],
  verdicts: readonly Verdict[],
): string | undefined {
  const findingIds = findings.map(({ id }) => id);
  const verdictIds = verdicts.map(({ id }) => id);
  const missing = findingIds.filter((id) => !verdictIds.includes(id));
  const unknown = verdictIds.filter((id) => !findingIds.includes(id));
  const repeated = verdictIds.filter(
    (id, index) => verdictIds.indexOf(id) !== index,
  );
  if (missing.length > 0 || unknown.length > 0 || repeated.length > 0) {
    return `The verifier must give exactly one verdict for each finding, so its answer cannot be trusted. Missing: ${listOrNone(missing)}. Unknown: ${listOrNone(unknown)}. Repeated: ${listOrNone(repeated)}.`;
  }
  const confirmedIds = new Set(
    verdicts
      .filter((verdict) => verdict.status === "confirmed")
      .map(({ id }) => id),
  );
  const orphanIds = verdicts
    .filter(
      (verdict) =>
        verdict.status === "duplicate" &&
        !confirmedIds.has(verdict.duplicateOf),
    )
    .map(({ id }) => id);
  if (orphanIds.length > 0) {
    return `A duplicate must repeat a confirmed finding, but ${listOfWords(orphanIds)} ${singularOrPlural(orphanIds.length, "repeats", "repeat")} none.`;
  }
  return undefined;
}

function listOrNone(ids: readonly string[]): string {
  return ids.length > 0 ? ids.join(", ") : "none";
}
