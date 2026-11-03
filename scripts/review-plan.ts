import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord } from "../app/value-shapes.ts";
import {
  notAnObject,
  parseChoiceAt,
  parseListField,
  parseStringsAt,
} from "./json.ts";
import { parseOptionalCommitHashAt } from "./review-inputs.ts";
import { chooseLenses, parseLens } from "./review-lenses.ts";
import type { ChangedFile, Lens } from "./review-lenses.ts";
import { parseReviewState, parseRoundAt } from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";

/** The rounds in which the reviewer reads what changed, counting the rounds whose agent did not finish. Later rounds only check that the open findings are fixed, so a pull request that keeps drawing new findings still ends. */
export const reviewRoundLimit = 3;

/** The rounds after the review rounds that check the open findings. After them the panel runs no agent, and a maintainer decides how the pull request continues. */
export const checkRoundLimit = 2;

const planKinds = ["review", "check", "pass", "unchanged", "capped"] as const;

/** What one run of the panel does. */
export interface ReviewPlan {
  /**
   * - review: the reviewer reads the files under review through the lenses, and the verifier checks its findings and the open ones.
   * - check: the verifier checks only the open findings, because the review rounds are used.
   * - pass: no agent runs, because no file changed and no finding is open.
   * - unchanged: no agent runs, because no file changed that could have fixed the open findings, so they stay open.
   * - capped: no agent runs, because files changed or findings stay open after every round that could handle them.
   */
  kind: (typeof planKinds)[number];
  /** The round of this run, which counts it only when an agent runs. */
  round: number;
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
  since: string | undefined,
  files: readonly ChangedFile[],
): ReviewPlan {
  const plan = { since, lenses: [], files: [], previous };
  const hasOpenFindings = previous.openFindings.length > 0;
  if (files.length === 0) {
    return {
      ...plan,
      kind: hasOpenFindings ? "unchanged" : "pass",
      round: previous.round,
    };
  }
  if (previous.round < reviewRoundLimit) {
    return {
      ...plan,
      kind: "review",
      round: previous.round + 1,
      lenses: chooseLenses(files),
      files: files.map(({ path }) => path),
    };
  }
  // Without an open finding, nothing explains a change after the review rounds, so it never passes unread.
  if (hasOpenFindings && previous.round < reviewRoundLimit + checkRoundLimit) {
    return {
      ...plan,
      kind: "check",
      round: previous.round + 1,
    };
  }
  return {
    ...plan,
    kind: "capped",
    round: previous.round,
  };
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
    round: round.value,
    since: since.value,
    lenses: chosenLenses.value,
    files: files.value,
    previous: previous.value,
  });
}
