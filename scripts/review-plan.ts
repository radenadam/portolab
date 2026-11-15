import {
  reviewRoundLimit,
  checkRoundLimit,
  mergeReviewRoundLimit,
} from "./review-limits.ts";
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
import { parseReviewCounts, parseReviewState } from "./review-state.ts";
import type { CommitScope } from "./review-history.ts";
import { numberFindings } from "./review-findings.ts";
import type { ReviewerReport, RoundReport } from "./review-findings.ts";
import { chooseLenses, parseLens } from "./review-lenses.ts";
import type { ChangedFile, Lens } from "./review-lenses.ts";
import type { ReviewState } from "./review-state.ts";

const planKinds = ["review", "check", "pass", "unchanged", "capped"] as const;
const capReasons = [
  "merge-reviews",
  "finding-checks",
  "mixed-push",
  "unreviewed-change",
] as const;
type CapReason = (typeof capReasons)[number];

/** The history reader cannot give a push merge scope without a reviewed head, so the type excludes that state. */
export type ReviewHistory =
  | { since: undefined; commitScope: "author" }
  | { since: string; commitScope: Exclude<CommitScope, "fixes-and-merges"> }
  | {
      since: string;
      commitScope: "fixes-and-merges";
      authorFiles: ChangedFile[];
      mergeFiles: ChangedFile[];
    };

/** What one run of the panel does. */
export interface ReviewPlan {
  /**
   * - review: the reviewer reads the files under review through the lenses, and the verifier checks its findings and the open ones.
   * - check: the verifier checks open findings and the scope of author changes after ordinary reviews.
   * - pass: no agent runs, because no file changed and no finding is open.
   * - unchanged: no agent runs, because no file changed that could have fixed the open findings, so they stay open.
   * - capped: no agent runs, because files changed or findings stay open after every round that could handle them.
   */
  kind: (typeof planKinds)[number];
  /** The planner owns the refusal rule, so the verdict must not guess its reason from counters. Older plans have no reason. */
  capReason: CapReason | undefined;
  /** The allowances spent so far. A combined run spends a finding check and a merge review. */
  round: number;
  /** The extra merge review rounds used, including this run when it uses one. */
  mergeRounds: number;
  /** Finding-check allowances spent, including this run when it checks author files. */
  checkRounds: number;
  /** The head that the last finished round reviewed, when the head of the pull request still contains it, so that only the commits after it need review. */
  since: string | undefined;
  /** The lenses of the reviewer, empty unless the plan is a review. */
  lenses: Lens[];
  /** The paths of the files under review, each of which the reviewer must name as read. Empty unless the plan is a review. */
  files: string[];
  /** Author files whose changes must only fix open findings after the ordinary cap. */
  fixFiles: string[];
  previous: ReviewState;
}

/** Plans one run of the panel from the state of the earlier rounds and the files under review: the whole change, or the files that the commits of the pull request changed since the head that the last finished round reviewed. */
export function planReview(
  previous: ReviewState,
  history: ReviewHistory,
  files: readonly ChangedFile[],
): ReviewPlan {
  const { since, commitScope } = history;
  const plan: Omit<ReviewPlan, "kind" | "round"> = {
    since,
    lenses: [],
    files: [],
    fixFiles: [],
    previous,
    mergeRounds: previous.mergeRounds,
    checkRounds: previous.checkRounds,
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
  const ordinaryRounds =
    previous.round - previous.mergeRounds - previous.checkRounds;
  const extraMergeReview =
    ordinaryRounds >= reviewRoundLimit && canReviewMerge(previous, commitScope);
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
  return planAfterReviewCap(plan, history, files);
}

function planAfterReviewCap(
  plan: Omit<ReviewPlan, "kind" | "round">,
  history: ReviewHistory,
  files: readonly ChangedFile[],
): ReviewPlan {
  const previous = plan.previous;
  const hasOpenFindings = previous.openFindings.length > 0;
  const canCheck = hasOpenFindings && previous.checkRounds < checkRoundLimit;
  if (history.commitScope === "fixes-and-merges") {
    const combined = planCombinedAllowances(plan, history, canCheck);
    if (combined !== undefined) return combined;
  }
  if (canCheck && history.commitScope === "author") {
    return {
      ...plan,
      kind: "check",
      round: previous.round + 1,
      checkRounds: previous.checkRounds + 1,
      fixFiles: files.map(({ path }) => path),
    };
  }
  return {
    ...plan,
    kind: "capped",
    capReason: reasonForCap(history.commitScope, hasOpenFindings),
    round: previous.round,
  };
}

function planCombinedAllowances(
  plan: Omit<ReviewPlan, "kind" | "round">,
  history: Extract<ReviewHistory, { commitScope: "fixes-and-merges" }>,
  canCheck: boolean,
): ReviewPlan | undefined {
  const previous = plan.previous;
  const needsCheck = history.authorFiles.length > 0;
  const needsMerge = history.mergeFiles.length > 0;
  if (
    (needsCheck && !canCheck) ||
    (needsMerge && previous.mergeRounds >= mergeReviewRoundLimit)
  )
    return undefined;
  return {
    ...plan,
    kind: needsMerge ? "review" : "check",
    round: previous.round + (needsCheck ? 1 : 0) + (needsMerge ? 1 : 0),
    mergeRounds: previous.mergeRounds + (needsMerge ? 1 : 0),
    checkRounds: previous.checkRounds + (needsCheck ? 1 : 0),
    files: history.mergeFiles.map(({ path }) => path),
    lenses: needsMerge ? chooseLenses(history.mergeFiles) : [],
    fixFiles: history.authorFiles.map(({ path }) => path),
  };
}

function reasonForCap(
  commitScope: CommitScope,
  hasOpenFindings: boolean,
): CapReason {
  switch (commitScope) {
    case "base-merges":
      return "merge-reviews";
    case "author":
      return hasOpenFindings ? "finding-checks" : "unreviewed-change";
    case "mixed":
    case "fixes-and-merges":
      return "mixed-push";
  }
}

function canReviewMerge(
  previous: ReviewState,
  commitScope: CommitScope,
): boolean {
  return (
    commitScope === "base-merges" &&
    previous.mergeRounds < mergeReviewRoundLimit
  );
}

/** Tells the reviewer which part of the change the files under review hold, and how to read the diff of one of them, because the diff of a whole change can be too long for one read. */
export function describeReviewScope(plan: ReviewPlan, base: string): string {
  const { since } = plan;
  const wholeDiff = `\`git diff ${base}...HEAD -- <path>\``;
  if (since !== undefined && plan.mergeRounds > plan.previous.mergeRounds) {
    return `They hold manual base merge resolutions since ${since}. Read only their remerge diffs with \`git log --first-parent --merges --diff-merges=remerge -p ${since}..HEAD -- <path>\`.`;
  }
  return since === undefined
    ? `They hold the whole change, and ${wholeDiff} shows what changed in one of them.`
    : `They hold what changed since ${since}, the head that the panel last reviewed, because earlier rounds reviewed the rest of the change. \`git diff ${since} HEAD -- <path>\` shows what changed in one of them since then, and ${wholeDiff} shows its whole change.`;
}

/** Whether the plan spends an allowance through an agent. */
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
  const fixFiles =
    value["fixFiles"] === undefined && lacksPreviousCount(value, "checkRounds")
      ? succeed([])
      : parseStringsAt(value, source, { keys: ["fixFiles"], mayBeEmpty: true });
  if (!fixFiles.ok) {
    return fixFiles;
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
    fixFiles: fixFiles.value,
    previous: previous.value,
  });
}

function parsePlanLimits(
  value: unknown,
  source: string,
): Result<
  Pick<ReviewPlan, "round" | "mergeRounds" | "checkRounds" | "capReason">,
  string
> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const counts = parseReviewCounts(value, source, {
    merges: lacksPreviousCount(value, "mergeRounds"),
    checks: lacksPreviousCount(value, "checkRounds"),
  });
  if (!counts.ok) return counts;
  const capReason =
    value["capReason"] === undefined
      ? succeed(undefined)
      : parseChoiceAt(value, source, {
          name: "capReason",
          choices: capReasons,
        });
  return capReason.ok
    ? succeed({
        ...counts.value,
        capReason: capReason.value,
      })
    : capReason;
}

function lacksPreviousCount(
  value: Record<string, unknown>,
  field: "mergeRounds" | "checkRounds",
): boolean {
  const previous = value["previous"];
  return isRecord(previous) && previous[field] === undefined;
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
