import { expect, test } from "vitest";
import type { Finding } from "./review-findings.ts";
import {
  parseLatestReviewState,
  parseReviewState,
  stateMarker,
} from "./review-state.ts";
import type { ReviewState } from "./review-state.ts";

const firstHead = "1".repeat(40);
const stateBeforeFirstRound: ReviewState = {
  head: undefined,
  round: 0,
  openFindings: [],
};
const secondHead = "2".repeat(40);

const openFinding: Finding = {
  id: "1.1",
  lens: "craft",
  location: "app/root.tsx:12",
  claim: "A comment ends the marker early: -->",
  basis: "The basis.",
  siblings: [],
  rootCause: "",
  scope: "change",
};

function review(login: string, body: string): unknown {
  return { user: { login }, body };
}

function stateReview(state: ReviewState): unknown {
  return review(
    "github-actions[bot]",
    `## Review panel\n\nThe body.\n\n${stateMarker(state)}`,
  );
}

test("reads back the state that a review carries, even when a finding holds the end of an HTML comment", () => {
  const state: ReviewState = {
    head: firstHead,
    round: 1,
    openFindings: [openFinding],
  };
  expect(parseLatestReviewState([[stateReview(state)]], "reviews")).toEqual({
    ok: true,
    value: state,
  });
});

test("starts before the first round when no review carries a state", () => {
  expect(parseLatestReviewState([], "reviews")).toEqual({
    ok: true,
    value: stateBeforeFirstRound,
  });
  expect(
    parseLatestReviewState(
      [[review("github-actions[bot]", "A review from before the state.")]],
      "reviews",
    ),
  ).toEqual({ ok: true, value: stateBeforeFirstRound });
});

test("reads the newest state across pages, and ignores a later review without one", () => {
  const first: ReviewState = { head: firstHead, round: 1, openFindings: [] };
  const second: ReviewState = { head: secondHead, round: 2, openFindings: [] };
  expect(
    parseLatestReviewState(
      [
        [stateReview(first)],
        [stateReview(second), review("github-actions[bot]", "No state.")],
      ],
      "reviews",
    ),
  ).toEqual({ ok: true, value: second });
});

test("ignores a state that another account posted, so that a comment cannot skip the review", () => {
  const forged = review(
    "someone",
    stateMarker({ head: secondHead, round: 0, openFindings: [] }),
  );
  const real: ReviewState = { head: firstHead, round: 1, openFindings: [] };
  expect(
    parseLatestReviewState([[stateReview(real), forged]], "reviews"),
  ).toEqual({ ok: true, value: real });
});

test("keeps a state without a head, which a first round that did not finish leaves", () => {
  const state: ReviewState = { head: undefined, round: 1, openFindings: [] };
  expect(parseLatestReviewState([[stateReview(state)]], "reviews")).toEqual({
    ok: true,
    value: state,
  });
});

test("fails on reviews that are not pages of reviews, naming where", () => {
  expect(parseLatestReviewState({}, "reviews")).toEqual({
    ok: false,
    failure: "reviews must be a list of pages of reviews, but it is {}.",
  });
  expect(parseLatestReviewState([[{ body: "" }]], "reviews")).toEqual({
    ok: false,
    failure:
      "reviews: page 1, review 1 must have a string at user.login, but user.login is missing.",
  });
});

test("fails on a state that the workflow did not write", () => {
  expect(
    parseLatestReviewState(
      [[review("github-actions[bot]", "<!-- review-state e30= -->")]],
      "reviews",
    ),
  ).toEqual({
    ok: false,
    failure:
      "reviews: page 1, review 1: the state of the panel must have a whole number from 0 at round, but round is missing.",
  });
  expect(
    parseLatestReviewState(
      [[review("github-actions[bot]", "<!-- review-state bm90IGpzb24= -->")]],
      "reviews",
    ),
  ).toEqual({
    ok: false,
    failure:
      'reviews: page 1, review 1 must carry the state of the panel as base64 of JSON, but it carries "bm90IGpzb24=".',
  });
});

test("rejects a round that is not a whole number from 0", () => {
  expect(parseReviewState({ round: -1, openFindings: [] }, "state").ok).toBe(
    false,
  );
  expect(parseReviewState({ round: 1.5, openFindings: [] }, "state").ok).toBe(
    false,
  );
});
