import { countOf, listOfWords, singularOrPlural } from "../app/sentences.ts";
import type { Finding, FindingsToVerify, Verdict } from "./review-findings.ts";
import { checkRoundLimit, reviewRoundLimit, runsAgent } from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import type { ReviewState } from "./review-state.ts";

export interface ReviewInput {
  plan: ReviewPlan;
  /** The head of the pull request that this run reviewed. */
  reviewedHead: string;
  /** The findings that the save step wrote for the verifier, or undefined when it wrote none. */
  toVerify: FindingsToVerify | undefined;
  /** The verdicts that the save step wrote, or undefined when it wrote none. */
  verdicts: Verdict[] | undefined;
  /** One sentence for each agent that ran, about its minutes and turns or about why they are unknown. */
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

/** Decides from the plan and the files that the steps wrote whether the change passes, and what the next round reads. */
export function judgeReview(input: ReviewInput): Judgement {
  const { plan } = input;
  if (plan.kind === "capped") {
    return {
      ...unfinished(
        plan,
        `The panel has used its ${countOf(reviewRoundLimit, "review round", "review rounds")} and its ${countOf(checkRoundLimit, "round that checks open findings", "rounds that check open findings")}, and ${countOf(plan.previous.openFindings.length, "finding stays open", "findings stay open")}, so it ran no agent. A maintainer decides how this pull request continues.`,
      ),
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
  // A missing input is a failure, never an empty one, because a step that failed writes no file.
  if (runsAgent(input.plan) && input.toVerify === undefined) {
    return input.plan.kind === "review"
      ? "The reviewer's report is missing, so this change has not been reviewed. The log of the run names the reason."
      : "The open findings were not saved for the verifier, so none has been checked. The log of the run names the reason.";
  }
  const findings = input.toVerify?.findings ?? [];
  if (findings.length > 0 && input.verdicts === undefined) {
    return "The verifier's verdicts are missing, so no finding has been verified. The log of the run names the reason.";
  }
  return coverageProblem(findings, input.verdicts ?? []);
}

function finished(input: ReviewInput): Judgement {
  // An open finding of an earlier round that the verifier refutes is fixed, because an earlier round confirmed it.
  const earlierIds = new Set(
    input.plan.previous.openFindings.map(({ id }) => id),
  );
  const verified: VerifiedFinding[] = [];
  const fixed: VerifiedFinding[] = [];
  for (const finding of withVerdicts(
    input.toVerify?.findings ?? [],
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
