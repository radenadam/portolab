import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord } from "../app/value-shapes.ts";
import {
  notAnObject,
  parseChoiceAt,
  parseListField,
  parseStringAt,
  parseStringsAt,
  parseTextAt,
} from "./json.ts";
import type { Parser } from "./json.ts";
import { lenses } from "./review-lenses.ts";
import type { Lens } from "./review-lenses.ts";

/** Whether the change caused a finding or left it incomplete, or whether it lies in code that the change neither touched nor needed to touch. AGENTS.md defines both. */
const findingScopes = ["change", "existing"] as const;

type FindingScope = (typeof findingScopes)[number];

/** A finding as the reviewer returns it, before the panel gives it an id. */
interface FindingContent {
  lens: Lens;
  location: string;
  claim: string;
  basis: string;
  siblings: string[];
  rootCause: string;
  scope: FindingScope;
}

export interface Finding extends FindingContent {
  /** The round that reported the finding and its position in that round, such as 2.1. */
  id: string;
}

interface CandidateStandard {
  standard: string;
  incident: string;
}

/** What the reviewer says it checked through one lens. */
interface LensCheck {
  lens: Lens;
  checked: string;
}

/** What the reviewer says it did, so that an answer without findings can be told apart from a review that never happened. */
interface ReviewerCoverage {
  /** The files under review whose diff the reviewer read. */
  readFiles: string[];
  lensChecks: LensCheck[];
}

/** The answer of the reviewer, in the shape that `.github/review/findings.schema.json` defines. */
export interface ReviewerReport extends ReviewerCoverage {
  findings: FindingContent[];
  candidateStandards: CandidateStandard[];
}

/** What a round reported: the findings that the verifier checks, which are those of this round and the open findings of earlier rounds, with the candidate standards and the coverage of this round. A round without a reviewer has none of its own. */
export interface RoundReport extends ReviewerCoverage {
  findings: Finding[];
  candidateStandards: CandidateStandard[];
}

const verdictStatuses = ["confirmed", "refuted", "duplicate"] as const;

/** The verifier's answer for one finding, in the shape that `.github/review/verdicts.schema.json` defines. */
export interface Verdict {
  id: string;
  status: (typeof verdictStatuses)[number];
  /** The scope that the verifier found, which corrects the reviewer's. */
  scope: FindingScope;
  /** Every place with the same problem, including those that the reviewer missed. */
  siblings: string[];
  /** The id of the confirmed finding that a duplicate repeats, or an empty string. */
  duplicateOf: string;
  evidence: string;
}

export function parseReviewerReport(
  value: unknown,
  source: string,
): Result<ReviewerReport, string> {
  return parseReportWith(value, source, parseFindingContent);
}

/** Reads the report of a round that the save step writes for the verifier and the review. */
export function parseRoundReport(
  value: unknown,
  source: string,
): Result<RoundReport, string> {
  return parseReportWith(value, source, parseFinding);
}

/** Gives each finding of a round its id, such as 2.1, so that the review can check that the verifier answered every finding exactly once, and a later round can name it. */
export function numberFindings(
  round: number,
  findings: readonly FindingContent[],
): Finding[] {
  const numbered: Finding[] = [];
  for (const [index, finding] of findings.entries()) {
    numbered.push({ ...finding, id: `${String(round)}.${String(index + 1)}` });
  }
  return numbered;
}

export function parseVerdicts(
  value: unknown,
  source: string,
): Result<Verdict[], string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  return parseListField(value, source, {
    field: "verdicts",
    itemName: "verdict",
    parseItem: parseVerdict,
  });
}

function parseVerdict(value: unknown, source: string): Result<Verdict, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const id = parseStringAt(value, source, ["id"]);
  if (!id.ok) {
    return id;
  }
  const status = parseChoiceAt(value, source, {
    name: "status",
    choices: verdictStatuses,
  });
  if (!status.ok) {
    return status;
  }
  const scope = parseChoiceAt(value, source, {
    name: "scope",
    choices: findingScopes,
  });
  if (!scope.ok) {
    return scope;
  }
  const siblings = parseSiblings(value, source);
  if (!siblings.ok) {
    return siblings;
  }
  const duplicateOf = parseStringAt(value, source, ["duplicateOf"]);
  if (!duplicateOf.ok) {
    return duplicateOf;
  }
  const evidence = parseTextAt(value, source, ["evidence"]);
  if (!evidence.ok) {
    return evidence;
  }
  return succeed({
    id: id.value,
    status: status.value,
    scope: scope.value,
    siblings: siblings.value,
    duplicateOf: duplicateOf.value,
    evidence: evidence.value,
  });
}

/** Reads a finding that carries its id, as the file for the verifier and the state of the review hold it. */
export function parseFinding(
  value: unknown,
  source: string,
): Result<Finding, string> {
  const id = parseStringAt(value, source, ["id"]);
  if (!id.ok) {
    return id;
  }
  const content = parseFindingContent(value, source);
  return content.ok ? succeed({ ...content.value, id: id.value }) : content;
}

/** Reads what both the reviewer's answer and the report of a round hold. Only the shape of one finding differs between them. */
function parseReportWith<Item>(
  value: unknown,
  source: string,
  parseItem: Parser<Item>,
): Result<
  ReviewerCoverage & {
    findings: Item[];
    candidateStandards: CandidateStandard[];
  },
  string
> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const findings = parseListField(value, source, {
    field: "findings",
    itemName: "finding",
    parseItem,
  });
  if (!findings.ok) {
    return findings;
  }
  const candidateStandards = parseListField(value, source, {
    field: "candidateStandards",
    itemName: "candidate standard",
    parseItem: parseCandidateStandard,
  });
  if (!candidateStandards.ok) {
    return candidateStandards;
  }
  const readFiles = parseStringsAt(value, source, {
    keys: ["readFiles"],
    mayBeEmpty: true,
  });
  if (!readFiles.ok) {
    return readFiles;
  }
  const lensChecks = parseListField(value, source, {
    field: "lensChecks",
    itemName: "lens check",
    parseItem: parseLensCheck,
  });
  if (!lensChecks.ok) {
    return lensChecks;
  }
  return succeed({
    findings: findings.value,
    candidateStandards: candidateStandards.value,
    readFiles: readFiles.value,
    lensChecks: lensChecks.value,
  });
}

function parseLensCheck(
  value: unknown,
  source: string,
): Result<LensCheck, string> {
  const lens = parseChoiceAt(value, source, { name: "lens", choices: lenses });
  if (!lens.ok) {
    return lens;
  }
  const checked = parseTextAt(value, source, ["checked"]);
  return checked.ok
    ? succeed({ lens: lens.value, checked: checked.value })
    : checked;
}

function parseFindingContent(
  value: unknown,
  source: string,
): Result<FindingContent, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const lens = parseChoiceAt(value, source, { name: "lens", choices: lenses });
  if (!lens.ok) {
    return lens;
  }
  const location = parseStringAt(value, source, ["location"]);
  if (!location.ok) {
    return location;
  }
  const claim = parseStringAt(value, source, ["claim"]);
  if (!claim.ok) {
    return claim;
  }
  const basis = parseStringAt(value, source, ["basis"]);
  if (!basis.ok) {
    return basis;
  }
  const siblings = parseSiblings(value, source);
  if (!siblings.ok) {
    return siblings;
  }
  const rootCause = parseStringAt(value, source, ["rootCause"]);
  if (!rootCause.ok) {
    return rootCause;
  }
  const scope = parseChoiceAt(value, source, {
    name: "scope",
    choices: findingScopes,
  });
  if (!scope.ok) {
    return scope;
  }
  return succeed({
    lens: lens.value,
    location: location.value,
    claim: claim.value,
    basis: basis.value,
    siblings: siblings.value,
    rootCause: rootCause.value,
    scope: scope.value,
  });
}

function parseSiblings(
  value: unknown,
  source: string,
): Result<string[], string> {
  return parseStringsAt(value, source, {
    keys: ["siblings"],
    mayBeEmpty: true,
  });
}

function parseCandidateStandard(
  value: unknown,
  source: string,
): Result<CandidateStandard, string> {
  const standard = parseStringAt(value, source, ["standard"]);
  if (!standard.ok) {
    return standard;
  }
  const incident = parseStringAt(value, source, ["incident"]);
  if (!incident.ok) {
    return incident;
  }
  return succeed({ standard: standard.value, incident: incident.value });
}
