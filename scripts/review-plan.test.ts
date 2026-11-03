import { expect, test } from "vitest";
import type { Finding } from "./review-findings.ts";
import type { ChangedFile } from "./review-lenses.ts";
import {
  checkRoundLimit,
  describeReviewScope,
  parseReviewPlan,
  planReview,
  reviewRoundLimit,
} from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import { parseLatestReviewState } from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";

// planReview takes the state that parseLatestReviewState reads, which holds no round before any review carries a state.
const stateBeforeFirstRound = successValueForTest(
  parseLatestReviewState([], "reviews"),
  "The reviews of a new pull request hold no state",
);

const head = "1".repeat(40);
const docs: ChangedFile = { path: "docs/product.md", change: "modified" };
const openFinding: Finding = {
  id: "1.1",
  lens: "docs",
  location: "docs/product.md:3",
  claim: "The claim.",
  basis: "The basis.",
  siblings: [],
  rootCause: "",
  scope: "change",
};

function stateAfter(round: number, openFindings: Finding[]): ReviewState {
  return { head, round, openFindings };
}

test("reviews the whole change in the first round", () => {
  expect(planReview(stateBeforeFirstRound, undefined, [docs])).toEqual({
    kind: "review",
    round: 1,
    since: undefined,
    lenses: ["consistency", "docs", "standards"],
    hasUnreviewedFiles: false,
    previous: stateBeforeFirstRound,
  });
});

test("reviews the files since the last reviewed head in a later round, up to the last review round", () => {
  const previous = stateAfter(reviewRoundLimit - 1, [openFinding]);
  expect(planReview(previous, head, [docs])).toMatchObject({
    kind: "review",
    round: reviewRoundLimit,
    since: head,
  });
});

test("runs no agent when no file changed and no finding is open", () => {
  const previous = stateAfter(1, []);
  expect(planReview(previous, head, [])).toEqual({
    kind: "pass",
    round: 1,
    since: head,
    lenses: [],
    hasUnreviewedFiles: false,
    previous,
  });
});

test("only checks the open findings when no file changed", () => {
  const previous = stateAfter(1, [openFinding]);
  expect(planReview(previous, head, [])).toMatchObject({
    kind: "check",
    round: 2,
    hasUnreviewedFiles: false,
  });
});

test("only checks the open findings after the review rounds, and says that the new files go unreviewed", () => {
  const previous = stateAfter(reviewRoundLimit, [openFinding]);
  expect(planReview(previous, head, [docs])).toMatchObject({
    kind: "check",
    round: reviewRoundLimit + 1,
    lenses: [],
    hasUnreviewedFiles: true,
  });
});

test("passes without an agent after the review rounds when no finding is open, and says that the new files go unreviewed", () => {
  const previous = stateAfter(reviewRoundLimit, []);
  expect(planReview(previous, head, [docs])).toMatchObject({
    kind: "pass",
    round: reviewRoundLimit,
    hasUnreviewedFiles: true,
  });
});

test("checks the open findings up to the last check round, and then runs no agent", () => {
  const lastCheck = reviewRoundLimit + checkRoundLimit;
  expect(
    planReview(stateAfter(lastCheck - 1, [openFinding]), head, []),
  ).toMatchObject({ kind: "check", round: lastCheck });
  expect(
    planReview(stateAfter(lastCheck, [openFinding]), head, [docs]),
  ).toMatchObject({
    kind: "capped",
    round: lastCheck,
    hasUnreviewedFiles: true,
  });
});

test("reads back the plan that the plan step writes, with and without a reviewed head", () => {
  const plans: ReviewPlan[] = [
    planReview(stateBeforeFirstRound, undefined, [docs]),
    planReview(stateAfter(1, [openFinding]), head, []),
  ];
  for (const plan of plans) {
    expect(
      parseReviewPlan(JSON.parse(JSON.stringify(plan)), "review/plan.json"),
    ).toEqual({ ok: true, value: plan });
  }
});

test("rejects a plan that names a lens outside the panel or no answer about unreviewed files", () => {
  const plan = planReview(stateBeforeFirstRound, undefined, [docs]);
  expect(
    parseReviewPlan({ ...plan, lenses: ["style"] }, "review/plan.json"),
  ).toEqual({
    ok: false,
    failure:
      'review/plan.json: lens 1 must be "architecture", "consistency", "craft", "docs", "product", "reliability", or "standards", but it is "style".',
  });
  expect(
    parseReviewPlan({ ...plan, hasUnreviewedFiles: "no" }, "review/plan.json"),
  ).toEqual({
    ok: false,
    failure:
      'review/plan.json must have true or false at hasUnreviewedFiles, but hasUnreviewedFiles is "no".',
  });
});

test("tells the reviewer whether the diff holds the whole change or what changed since a head", () => {
  expect(describeReviewScope(undefined)).toBe("It holds the whole change.");
  expect(describeReviewScope(head)).toBe(
    `It holds what changed since ${head}, the head that the panel last reviewed. Earlier rounds reviewed the rest of the change.`,
  );
});
