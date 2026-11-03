import { countOf, listOfWords, singularOrPlural } from "../app/sentences.ts";
import { judgeReview } from "./judge-review.ts";
import type { ReviewInput, VerifiedFinding } from "./judge-review.ts";
import type { RoundReport } from "./review-findings.ts";
import { reviewRoundLimit } from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import type { ReviewState } from "./review-state.ts";

/** What a round found outside the change, which an issue records. */
interface OutsideFindings {
  round: number;
  findings: VerifiedFinding[];
  candidateStandards: RoundReport["candidateStandards"];
}

export interface ReviewOutcome {
  passed: boolean;
  /** One sentence that says why the review passed or failed. */
  verdict: string;
  body: string;
  /** The state that the next round reads, or undefined when this run leaves the state as it was. */
  state: ReviewState | undefined;
  outside: OutsideFindings;
}

export function summarizeReview(input: ReviewInput): ReviewOutcome {
  const judgement = judgeReview(input);
  const body = [
    "## Review panel",
    "",
    `**${judgement.passed ? "Passed" : "Failed"}.** ${judgement.verdict}`,
    "",
    [scopeSentence(input.plan), ...input.runs].join(" "),
    ...lensCheckSection(judgement.hasFinished ? input.report : undefined),
    ...blockingSection(judgement.blocking),
    ...fixedSection(judgement.fixed),
    ...dismissedSection(judgement.verified),
  ].join("\n");
  return {
    passed: judgement.passed,
    verdict: judgement.verdict,
    body,
    state: judgement.state,
    outside: {
      round: input.plan.round,
      findings: judgement.verified.filter(
        (finding) =>
          finding.status === "confirmed" && finding.scope === "existing",
      ),
      // A round that did not finish runs again, and then it reports its candidate standards again.
      candidateStandards: judgement.hasFinished
        ? (input.report?.candidateStandards ?? [])
        : [],
    },
  };
}

function scopeSentence(plan: ReviewPlan): string {
  const commits =
    plan.since === undefined
      ? "the whole change"
      : `the commits since ${plan.since}`;
  switch (plan.kind) {
    case "review":
      return `Round ${String(plan.round)} reviewed ${commits}, in ${countOf(plan.files.length, "file", "files")}, through the ${listOfWords(plan.lenses)} ${singularOrPlural(plan.lenses.length, "lens", "lenses")}.`;
    case "check":
      return `Round ${String(plan.round)} only checked the open findings. No reviewer read ${commits}, because the panel has used its ${countOf(reviewRoundLimit, "review round", "review rounds")}.`;
    case "pass":
      return plan.since === undefined
        ? "No agent ran, because the pull request changes no file and no finding is open."
        : `No agent ran, because the commits since ${plan.since} changed no file of the pull request and no finding is open.`;
    case "unchanged":
    case "capped":
      return "No agent ran.";
  }
}

/** What the reviewer checked through each lens, so that the review shows its work. */
function lensCheckSection(report: RoundReport | undefined): string[] {
  if (report === undefined || report.lensChecks.length === 0) {
    return [];
  }
  const lines = ["", "### What each lens checked", ""];
  for (const check of report.lensChecks) {
    lines.push(`- ${check.lens}: ${check.checked}`);
  }
  return lines;
}

/** The lines of one finding in a numbered list, which the review and the issue share. */
function findingLines(finding: VerifiedFinding, position: number): string[] {
  const lines = [
    "",
    `${String(position)}. \`${finding.location}\` (${finding.lens}, finding ${finding.id}): ${finding.claim}`,
    `   - Basis: ${finding.basis}`,
    `   - Evidence: ${finding.evidence}`,
  ];
  if (finding.siblings.length > 0) {
    lines.push(`   - Siblings: ${finding.siblings.join(", ")}`);
  }
  if (finding.rootCause !== "") {
    lines.push(`   - Root cause: ${finding.rootCause}`);
  }
  return lines;
}

function numberedFindings(findings: readonly VerifiedFinding[]): string[] {
  const lines: string[] = [];
  for (const [index, finding] of findings.entries()) {
    lines.push(...findingLines(finding, index + 1));
  }
  return lines;
}

function blockingSection(blocking: readonly VerifiedFinding[]): string[] {
  return blocking.length === 0
    ? []
    : [
        "",
        "### Verified findings in the change",
        ...numberedFindings(blocking),
      ];
}

function fixedSection(fixed: readonly VerifiedFinding[]): string[] {
  if (fixed.length === 0) {
    return [];
  }
  const lines = ["", "### Fixed since the last round", ""];
  for (const finding of fixed) {
    lines.push(
      `- Finding ${finding.id}, \`${finding.location}\`: ${finding.evidence}`,
    );
  }
  return lines;
}

function dismissedSection(verified: readonly VerifiedFinding[]): string[] {
  const refutedCount = verified.filter(
    (finding) => finding.status === "refuted",
  ).length;
  const duplicateCount = verified.filter(
    (finding) => finding.status === "duplicate",
  ).length;
  const sentences: string[] = [];
  if (refutedCount > 0) {
    sentences.push(
      `The verifier refuted ${countOf(refutedCount, "finding", "findings")}.`,
    );
  }
  if (duplicateCount > 0) {
    sentences.push(
      `The verifier merged ${countOf(duplicateCount, "duplicate finding", "duplicate findings")} into the findings that they repeat.`,
    );
  }
  return sentences.length > 0 ? ["", sentences.join(" ")] : [];
}

/** The title and the body of the issue that records what a round found outside the change. */
export function outsideIssue(
  pullRequest: string,
  outside: OutsideFindings,
): { title: string; body: string } {
  const lines = [
    `The review panel found these in round ${String(outside.round)} of pull request #${pullRequest}. They lie outside its change, so they did not block it. A pull request of their own fixes each finding and adopts or declines each candidate standard.`,
  ];
  if (outside.findings.length > 0) {
    lines.push(
      "",
      "## Verified findings",
      ...numberedFindings(outside.findings),
    );
  }
  if (outside.candidateStandards.length > 0) {
    lines.push("", "## Candidate standards", "");
    for (const candidate of outside.candidateStandards) {
      lines.push(`- ${candidate.standard} Incident: ${candidate.incident}`);
    }
  }
  return {
    title: `Fix what the review of pull request #${pullRequest} found outside it`,
    body: lines.join("\n"),
  };
}

/** Returns a sentence when a newer push cancelled the run, so that the run for the newer head posts the review. GitHub also cancels a job that runs out of time, and then the head has not moved, so this run judges it. */
export function supersededRun(
  jobResults: Record<string, string>,
  reviewedHead: string,
  currentHead: string,
): string | undefined {
  const wasCancelled = Object.values(jobResults).includes("cancelled");
  return wasCancelled && reviewedHead !== currentHead
    ? `A newer push moved the pull request to ${currentHead} while this run reviewed ${reviewedHead}, so the run for the newer head posts the review.`
    : undefined;
}

/** The review of a run without a plan that can be read, so that the reader learns why nothing was reviewed. */
export function unplannedReview(
  planResult: string,
  planProblem: string | undefined,
): { verdict: string; body: string } {
  const verdict =
    planProblem === undefined
      ? `The review job found no plan of the round, so this change has not been reviewed. The plan job ended with the result "${planResult}", and its log names the reason.`
      : `The plan of the round cannot be read, so this change has not been reviewed. ${planProblem}`;
  return {
    verdict,
    body: ["## Review panel", "", `**Failed.** ${verdict}`].join("\n"),
  };
}

// GitHub refuses the body of a review or of an issue that is longer than this.
const githubBodyLimit = 65_536;

const oversizeOutcomes: Record<"review" | "issue", string> = {
  review: "so it was not posted, and the log of this step holds it",
  issue: "so it was not opened",
};

/** Returns a sentence when a text is too long for GitHub, so that the step fails with the reason instead of losing the text. */
export function oversizeProblem(
  kind: "review" | "issue",
  text: string,
): string | undefined {
  const numbers = new Intl.NumberFormat("en");
  return text.length > githubBodyLimit
    ? `The ${kind} is ${numbers.format(text.length)} characters long, but GitHub takes at most ${numbers.format(githubBodyLimit)}, ${oversizeOutcomes[kind]}.`
    : undefined;
}
