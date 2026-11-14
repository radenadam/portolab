import { gunzipSync, gzipSync } from "node:zlib";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";
import { notAnObject, parseListField, parseStringAt } from "./json.ts";
import { parseFinding } from "./review-findings.ts";
import { parseOptionalCommitHashAt } from "./review-inputs.ts";
import type { Finding } from "./review-findings.ts";

/** What the panel knows from its earlier rounds on a pull request. */
export interface ReviewState {
  /** The head that the last finished round reviewed, or undefined before any round finished. */
  head: string | undefined;
  /** The rounds in which an agent ran, whether or not they finished. */
  round: number;
  /** The extra rounds that reviewed merges of the base branch, whether or not they finished. */
  mergeRounds: number;
  /** The verified findings in the change that the last finished round left open. */
  openFindings: Finding[];
}

const stateBeforeFirstRound: ReviewState = {
  head: undefined,
  round: 0,
  mergeRounds: 0,
  openFindings: [],
};

// Only the workflow posts as this account, so a person who comments on the pull request cannot write the state of the panel.
const workflowAccount = "github-actions[bot]";

// The state is compressed JSON in base64 inside an HTML comment, so no text of a finding can end the comment early, GitHub does not show it, and open findings take little of the length that GitHub allows a review. Only the end of a review counts, because the text of a finding above it can quote a marker.
const markerPattern = /<!-- review-state ([A-Za-z0-9+/=]+) -->\s*$/;

/** The text that a review ends with, so that the next round reads the state from it. */
export function stateMarker(state: ReviewState): string {
  const json = JSON.stringify(state);
  return `<!-- review-state ${gzipSync(json).toString("base64")} -->`;
}

/** Reads the state from the newest review that the workflow posted with a state, from the pages that `gh api --paginate --slurp` prints for the reviews of a pull request. */
export function parseLatestReviewState(
  value: unknown,
  source: string,
): Result<ReviewState, string> {
  if (!Array.isArray(value)) {
    return fail(
      `${source} must be a list of pages of reviews, but it is ${describeValue(value)}.`,
    );
  }
  let latest: ReviewState = stateBeforeFirstRound;
  for (const [pageIndex, page] of value.entries()) {
    if (!Array.isArray(page)) {
      return fail(
        `${source}: page ${String(pageIndex + 1)} must be a list of reviews, but it is ${describeValue(page)}.`,
      );
    }
    for (const [reviewIndex, review] of page.entries()) {
      const reviewSource = `${source}: page ${String(pageIndex + 1)}, review ${String(reviewIndex + 1)}`;
      const state = parseReviewStateOf(review, reviewSource);
      if (!state.ok) {
        return state;
      }
      if (state.value !== undefined) {
        latest = state.value;
      }
    }
  }
  return succeed(latest);
}

/** Reads the state that one review carries, or undefined when another account posted it or it carries none. */
function parseReviewStateOf(
  value: unknown,
  source: string,
): Result<ReviewState | undefined, string> {
  const author = parseStringAt(value, source, ["user", "login"]);
  if (!author.ok) {
    return author;
  }
  if (author.value !== workflowAccount) {
    return succeed(undefined);
  }
  const body = parseStringAt(value, source, ["body"]);
  if (!body.ok) {
    return body;
  }
  const encoded = markerPattern.exec(body.value)?.[1];
  if (encoded === undefined) {
    return succeed(undefined);
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(
      gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"),
    );
  } catch {
    return fail(
      `${source} must carry the state of the panel as base64 of compressed JSON, but it carries ${describeValue(encoded)}.`,
    );
  }
  return parseReviewState(decoded, `${source}: the state of the panel`);
}

export function parseReviewState(
  value: unknown,
  source: string,
): Result<ReviewState, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const head = parseOptionalCommitHashAt(value, source, "head");
  if (!head.ok) {
    return head;
  }
  const round = parseRoundAt(value, source);
  if (!round.ok) {
    return round;
  }
  // Reviews posted before the merge allowance have no count and used none of it.
  const mergeRounds =
    value["mergeRounds"] === undefined
      ? succeed(0)
      : parseMergeRoundsAt(value, source, round.value);
  if (!mergeRounds.ok) {
    return mergeRounds;
  }
  const openFindings = parseListField(value, source, {
    field: "openFindings",
    itemName: "open finding",
    parseItem: parseFinding,
  });
  if (!openFindings.ok) {
    return openFindings;
  }
  return succeed({
    head: head.value,
    round: round.value,
    mergeRounds: mergeRounds.value,
    openFindings: openFindings.value,
  });
}

/** Reads the count of rounds that a state or a plan holds at round. */
export function parseRoundAt(
  value: unknown,
  source: string,
  field = "round",
): Result<number, string> {
  const round = isRecord(value) ? value[field] : undefined;
  return typeof round === "number" && Number.isInteger(round) && round >= 0
    ? succeed(round)
    : fail(
        `${source} must have a whole number from 0 at ${field}, but ${field} is ${describeValue(round)}.`,
      );
}

/** Extra merge rounds also count toward the total, so their count cannot exceed it. */
export function parseMergeRoundsAt(
  value: unknown,
  source: string,
  total: number,
): Result<number, string> {
  const mergeRounds = parseRoundAt(value, source, "mergeRounds");
  if (!mergeRounds.ok) {
    return mergeRounds;
  }
  return mergeRounds.value > total
    ? fail(
        `${source} must have mergeRounds at most round (${String(total)}), but mergeRounds is ${String(mergeRounds.value)}.`,
      )
    : mergeRounds;
}
