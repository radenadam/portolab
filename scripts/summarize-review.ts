import { countOf, listOfWords, singularOrPlural } from "../app/sentences.ts";
import { judgeReview } from "./judge-review.ts";
import type { ReviewInput, VerifiedFinding } from "./judge-review.ts";
import type { FindingsToVerify } from "./review-findings.ts";
import { reviewRoundLimit } from "./review-plan.ts";
import type { ReviewPlan } from "./review-plan.ts";
import type { ReviewState } from "./review-state.ts";

/** What a round found outside the change, which an issue records. */
interface OutsideFindings {
  round: number;
  findings: VerifiedFinding[];
  candidateStandards: FindingsToVerify["candidateStandards"];
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
        ? (input.toVerify?.candidateStandards ?? [])
        : [],
    },
  };
}

function scopeSentence(plan: ReviewPlan): string {
  const commits =
    plan.since === undefined
      ? "the whole change"
      : `the commits since ${plan.since}`;
  const unreviewed = plan.hasUnreviewedFiles
    ? ` No agent reviewed ${commits}, because the panel has used its ${countOf(reviewRoundLimit, "review round", "review rounds")}.`
    : "";
  switch (plan.kind) {
    case "review":
      return `Round ${String(plan.round)} reviewed ${commits} through the ${listOfWords(plan.lenses)} ${singularOrPlural(plan.lenses.length, "lens", "lenses")}.`;
    case "check":
      return `Round ${String(plan.round)} only checked the open findings.${unreviewed}`;
    case "pass":
      if (plan.hasUnreviewedFiles) {
        return `No agent ran, because no finding is open.${unreviewed}`;
      }
      return plan.since === undefined
        ? "No agent ran, because the pull request changes no file and no finding is open."
        : `No agent ran, because the commits since ${plan.since} changed no file of the pull request and no finding is open.`;
    case "capped":
      return `No agent ran.${unreviewed}`;
  }
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
