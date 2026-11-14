import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord } from "../app/value-shapes.ts";
import {
  notAnObject,
  parseChoiceAt,
  parseListField,
  parseStringsAt,
} from "./json.ts";
import type { CommitScope } from "./review-history.ts";
import { numberFindings } from "./review-findings.ts";
import type { ReviewerReport, RoundReport } from "./review-findings.ts";
import { parseOptionalCommitHashAt } from "./review-inputs.ts";
import { chooseLenses, parseLens } from "./review-lenses.ts";
import type { ChangedFile, Lens } from "./review-lenses.ts";
import {
  parseMergeRoundsAt,
  parseReviewState,
  parseRoundAt,
} from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";

/** Ordinary reviews have their own allowance, so late merges cannot replenish it. Failed rounds count too. */
export const reviewRoundLimit = 3;

/** The verifier-only rounds for fixes after the ordinary review rounds. Extra merge reviews do not replenish them. */
export const checkRoundLimit = 2;

/** Failed merge reviews count too, so repeated merges of the base branch cannot restart the panel without end. */
export const mergeReviewRoundLimit = 2;

const planKinds = ["review", "check", "pass", "unchanged", "capped"] as const;
const capReasons = [
  "merge-reviews",
  "finding-checks",
  "mixed-push",
  "unreviewed-change",
] as const;
type CapReason = (typeof capReasons)[number];

/** What one run of the panel does. */
export interface ReviewPlan {
  /**
   * - review: the reviewer reads the files under review through the lenses, and the verifier checks its findings and the open ones.
   * - check: the verifier checks only the open findings, because the ordinary review rounds are used.
   * - pass: no agent runs, because no file changed and no finding is open.
   * - unchanged: no agent runs, because no file changed that could have fixed the open findings, so they stay open.
   * - capped: no agent runs, because files changed or findings stay open after every round that could handle them.
   */
  kind: (typeof planKinds)[number];
  /** The planner owns the refusal rule, so the verdict must not guess its reason from counters. Older plans have no reason. */
  capReason: CapReason | undefined;
  /** The round of this run, which counts it only when an agent runs. */
  round: number;
  /** The extra merge review rounds used, including this run when it uses one. */
  mergeRounds: number;
  /** The head that the last finished round reviewed, when the head of the pull request still contains it, so that only the commits after it need review. */
  since: string | undefined;
  /** The lenses of the reviewer, empty unless the plan is a review. */
  lenses: Lens[];
  /** The paths of the files under review, each of which the reviewer must name as read. Empty unless the plan is a review. */
  files: string[];
  previous: ReviewState;
}

/** Plans one run of the panel from the state of the earlier rounds and the files under review: the whole change, or the files that the commits of the pull request changed since the head that the last finished round reviewed. */
export function planReview(
  previous: ReviewState,
  history: { since: string | undefined; commitScope: CommitScope },
  files: readonly ChangedFile[],
): ReviewPlan {
  const { since, commitScope } = history;
  const plan = {
    since,
    lenses: [],
    files: [],
    previous,
    mergeRounds: previous.mergeRounds,
    capReason: undefined,
  };
  const hasOpenFindings = previous.openFindings.length > 0;
  if (files.length === 0) {
    return {
      ...plan,
      kind: hasOpenFindings ? "unchanged" : "pass",
      round: previous.round,
    };
  }
  const ordinaryRounds = previous.round - previous.mergeRounds;
  const extraMergeReview =
    ordinaryRounds >= reviewRoundLimit && canReviewMerge(previous, history);
  if (ordinaryRounds < reviewRoundLimit || extraMergeReview) {
    return {
      ...plan,
      kind: "review",
      round: previous.round + 1,
      mergeRounds: previous.mergeRounds + (extraMergeReview ? 1 : 0),
      lenses: chooseLenses(files),
      files: files.map(({ path }) => path),
    };
  }
  // Only fixes may use a verifier-only round, because merge resolutions need a reviewer.
  if (
    hasOpenFindings &&
    commitScope === "author" &&
    ordinaryRounds < reviewRoundLimit + checkRoundLimit
  ) {
    return {
      ...plan,
      kind: "check",
      round: previous.round + 1,
    };
  }
  return {
    ...plan,
    kind: "capped",
    capReason: reasonForCap(history, hasOpenFindings),
    round: previous.round,
  };
}

function reasonForCap(
  history: { since: string | undefined; commitScope: CommitScope },
  hasOpenFindings: boolean,
): CapReason {
  switch (history.commitScope) {
    case "base-merges":
      return history.since === undefined
        ? "unreviewed-change"
        : "merge-reviews";
    case "author":
      return hasOpenFindings ? "finding-checks" : "unreviewed-change";
    case "mixed":
      return "mixed-push";
  }
}

function canReviewMerge(
  previous: ReviewState,
  history: { since: string | undefined; commitScope: CommitScope },
): boolean {
  return (
    history.since !== undefined &&
    history.commitScope === "base-merges" &&
    previous.mergeRounds < mergeReviewRoundLimit
  );
}

/** Tells the reviewer which part of the change the files under review hold, and how to read the diff of one of them, because the diff of a whole change can be too long for one read. */
export function describeReviewScope(
  since: string | undefined,
  base: string,
): string {
  const wholeDiff = `\`git diff ${base}...HEAD -- <path>\``;
  return since === undefined
    ? `They hold the whole change, and ${wholeDiff} shows what changed in one of them.`
    : `They hold what changed since ${since}, the head that the panel last reviewed, because earlier rounds reviewed the rest of the change. \`git diff ${since} HEAD -- <path>\` shows what changed in one of them since then, and ${wholeDiff} shows its whole change.`;
}

/** Whether the plan runs an agent, which makes the run count as a round. */
export function runsAgent(plan: ReviewPlan): boolean {
  return plan.kind === "review" || plan.kind === "check";
}

/** Reads the plan that the plan step wrote for the later steps. */
export function parseReviewPlan(
  value: unknown,
  source: string,
): Result<ReviewPlan, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const kind = parseChoiceAt(value, source, {
    name: "kind",
    choices: planKinds,
  });
  if (!kind.ok) {
    return kind;
  }
  const limits = parsePlanLimits(value, source);
  if (!limits.ok) {
    return limits;
  }
  const since = parseOptionalCommitHashAt(value, source, "since");
  if (!since.ok) {
    return since;
  }
  const chosenLenses = parseListField(value, source, {
    field: "lenses",
    itemName: "lens",
    parseItem: parseLens,
  });
  if (!chosenLenses.ok) {
    return chosenLenses;
  }
  const files = parseStringsAt(value, source, {
    keys: ["files"],
    mayBeEmpty: true,
  });
  if (!files.ok) {
    return files;
  }
  const previous = parseReviewState(value["previous"], `${source}: previous`);
  if (!previous.ok) {
    return previous;
  }
  return succeed({
    kind: kind.value,
    ...limits.value,
    since: since.value,
    lenses: chosenLenses.value,
    files: files.value,
    previous: previous.value,
  });
}

function parsePlanLimits(
  value: unknown,
  source: string,
): Result<Pick<ReviewPlan, "round" | "mergeRounds" | "capReason">, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const round = parseRoundAt(value, source);
  if (!round.ok) {
    return round;
  }
  // The plan job checks out the pull request head, while the final job may read newer code from the merge with main.
  const legacyPrevious =
    isRecord(value["previous"]) &&
    value["previous"]["mergeRounds"] === undefined;
  const mergeRounds =
    value["mergeRounds"] === undefined && legacyPrevious
      ? succeed(0)
      : parseMergeRoundsAt(value, source, round.value);
  if (!mergeRounds.ok) {
    return mergeRounds;
  }
  const capReason =
    value["capReason"] === undefined
      ? succeed(undefined)
      : parseChoiceAt(value, source, {
          name: "capReason",
          choices: capReasons,
        });
  return capReason.ok
    ? succeed({
        round: round.value,
        mergeRounds: mergeRounds.value,
        capReason: capReason.value,
      })
    : capReason;
}

/** Builds the report of a round from its plan and the reviewer's answer: the findings of the round, numbered after it, then the open findings of earlier rounds. A round without a reviewer has only the open findings. The verifier's job and the review job both build it, so the review never trusts a file that an agent could change. */
export function buildRoundReport(
  plan: ReviewPlan,
  reviewerReport: ReviewerReport | undefined,
): RoundReport {
  if (reviewerReport === undefined) {
    return {
      findings: [...plan.previous.openFindings],
      candidateStandards: [],
      readFiles: [],
      lensChecks: [],
    };
  }
  return {
    ...reviewerReport,
    findings: [
      ...numberFindings(plan.round, reviewerReport.findings),
      ...plan.previous.openFindings,
    ],
  };
}
