import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";
import { notAnObject, parseChoiceAt, parseListField } from "./json.ts";
import { parseOptionalCommitHashAt } from "./review-inputs.ts";
import { chooseLenses, parseLens } from "./review-lenses.ts";
import type { ChangedFile, Lens } from "./review-lenses.ts";
import { parseReviewState, parseRoundAt } from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";

/** The rounds in which the reviewer reads what changed. Later rounds only check that the open findings are fixed, so a pull request that keeps drawing new findings still ends. */
export const reviewRoundLimit = 3;

/** The rounds after the review rounds that check the open findings. After them the panel runs no agent, and a maintainer decides how the pull request continues. */
export const checkRoundLimit = 2;

const planKinds = ["review", "check", "pass", "capped"] as const;

/** What one run of the panel does. */
export interface ReviewPlan {
  /**
   * - review: the reviewer reads the files under review through the lenses, and the verifier checks its findings and the open ones.
   * - check: the verifier checks only the open findings, because the review rounds are used.
   * - pass: no agent runs, because nothing needs one.
   * - capped: no agent runs, because every round is used while findings stay open.
   */
  kind: (typeof planKinds)[number];
  /** The round of this run, which counts it only when an agent runs. */
  round: number;
  /** The head that the last finished round reviewed, when the head of the pull request still contains it, so that only the commits after it need review. */
  since: string | undefined;
  /** The lenses of the reviewer, empty unless the plan is a review. */
  lenses: Lens[];
  /** Whether files changed that no agent reviews, because the review rounds are used. */
  hasUnreviewedFiles: boolean;
  previous: ReviewState;
}

/** Plans one run of the panel from the state of the earlier rounds and the files under review: the whole change, or the files that changed since the head that the last round reviewed. */
export function planReview(
  previous: ReviewState,
  since: string | undefined,
  files: readonly ChangedFile[],
): ReviewPlan {
  const plan = {
    since,
    lenses: [],
    hasUnreviewedFiles: false,
    previous,
  };
  const chosenLenses = chooseLenses(files);
  if (previous.round < reviewRoundLimit && chosenLenses.length > 0) {
    return {
      ...plan,
      kind: "review",
      round: previous.round + 1,
      lenses: chosenLenses,
    };
  }
  const hasUnreviewedFiles = chosenLenses.length > 0;
  if (previous.openFindings.length === 0) {
    return { ...plan, kind: "pass", round: previous.round, hasUnreviewedFiles };
  }
  if (previous.round < reviewRoundLimit + checkRoundLimit) {
    return {
      ...plan,
      kind: "check",
      round: previous.round + 1,
      hasUnreviewedFiles,
    };
  }
  return { ...plan, kind: "capped", round: previous.round, hasUnreviewedFiles };
}

/** Tells the reviewer what the diff under review holds. */
export function describeReviewScope(since: string | undefined): string {
  return since === undefined
    ? "It holds the whole change."
    : `It holds what changed since ${since}, the head that the panel last reviewed. Earlier rounds reviewed the rest of the change.`;
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
  const round = parseRoundAt(value, source);
  if (!round.ok) {
    return round;
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
  const hasUnreviewedFiles = value["hasUnreviewedFiles"];
  if (typeof hasUnreviewedFiles !== "boolean") {
    return fail(
      `${source} must have true or false at hasUnreviewedFiles, but hasUnreviewedFiles is ${describeValue(hasUnreviewedFiles)}.`,
    );
  }
  const previous = parseReviewState(value["previous"], `${source}: previous`);
  if (!previous.ok) {
    return previous;
  }
  return succeed({
    kind: kind.value,
    round: round.value,
    since: since.value,
    lenses: chosenLenses.value,
    hasUnreviewedFiles,
    previous: previous.value,
  });
}
