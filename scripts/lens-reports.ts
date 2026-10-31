import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord, isStringArray } from "../app/value-shapes.ts";
import {
  invalidField,
  notAnObject,
  parseListField,
  readJsonFile,
} from "./json.ts";
import type { Parser } from "./json.ts";

/** A finding as a lens returns it, before the panel gives it an id. */
interface FindingContent {
  location: string;
  claim: string;
  basis: string;
  siblings: string[];
  rootCause: string;
}

export interface ReportedFinding extends FindingContent {
  /** The lens and the position of the finding in its report, such as craft-1. */
  id: string;
  lens: string;
}

interface CandidateStandard {
  standard: string;
  incident: string;
}

/** The answer of a lens, in the shape that `.github/review/lens-report.schema.json` defines. */
interface LensOutput {
  findings: FindingContent[];
  candidateStandards: CandidateStandard[];
}

export interface LensReport {
  lens: string;
  findings: ReportedFinding[];
  candidateStandards: CandidateStandard[];
}

/** Reads the answer of a lens. */
export function parseLensOutput(
  value: unknown,
  source: string,
): Result<LensOutput, string> {
  return parseFindingsAndCandidates(value, source, parseFindingContent);
}

/** Gives each finding of a lens its lens and an id, such as craft-1, so that the review can check that the verifier answered every finding exactly once. */
export function toLensReport(lens: string, output: LensOutput): LensReport {
  const findings: ReportedFinding[] = [];
  for (const [index, finding] of output.findings.entries()) {
    findings.push({ ...finding, id: `${lens}-${String(index + 1)}`, lens });
  }
  return { lens, findings, candidateStandards: output.candidateStandards };
}

/** Reads a lens report that the lens job saved, whose findings carry their lens and id. */
export function parseLensReport(
  value: unknown,
  source: string,
): Result<LensReport, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { lens } = value;
  if (typeof lens !== "string") {
    return invalidField(source, "lens");
  }
  const report = parseFindingsAndCandidates(
    value,
    source,
    parseReportedFinding,
  );
  return report.ok ? succeed({ lens, ...report.value }) : report;
}

/** Reads the findings and the candidate standards that both a lens answer and a saved report hold. Only the shape of one finding differs between them. */
function parseFindingsAndCandidates<Finding>(
  value: unknown,
  source: string,
  parseFinding: Parser<Finding>,
): Result<
  { findings: Finding[]; candidateStandards: CandidateStandard[] },
  string
> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const findings = parseListField(value, source, {
    field: "findings",
    itemName: "finding",
    parseItem: parseFinding,
  });
  if (!findings.ok) {
    return findings;
  }
  const candidateStandards = parseCandidateStandards(value, source);
  if (!candidateStandards.ok) {
    return candidateStandards;
  }
  return succeed({
    findings: findings.value,
    candidateStandards: candidateStandards.value,
  });
}

/** Reads a finding that carries its lens and its id, as a saved report and the verifier hold it. */
export function parseReportedFinding(
  value: unknown,
  source: string,
): Result<ReportedFinding, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { id, lens } = value;
  if (typeof id !== "string") {
    return invalidField(source, "id");
  }
  if (typeof lens !== "string") {
    return invalidField(source, "lens");
  }
  const content = parseFindingContent(value, source);
  if (!content.ok) {
    return content;
  }
  return succeed({ ...content.value, id, lens });
}

export interface LensReportsInDirectory {
  reports: LensReport[];
  /** One sentence for each file that could not be read or parsed. */
  problems: string[];
}

/** Reads every lens report in a directory. A missing directory holds no reports, because the review checks separately that every chosen lens sent one. */
export function readLensReports(directory: string): LensReportsInDirectory {
  const reports: LensReport[] = [];
  const problems: string[] = [];
  const files = existsSync(directory) ? readdirSync(directory).sort() : [];
  for (const file of files) {
    const report = readJsonFile(join(directory, file), parseLensReport);
    if (report.ok) {
      reports.push(report.value);
    } else {
      problems.push(report.failure);
    }
  }
  return { reports, problems };
}

function parseFindingContent(
  value: unknown,
  source: string,
): Result<FindingContent, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { location, claim, basis, siblings, rootCause } = value;
  if (typeof location !== "string") {
    return invalidField(source, "location");
  }
  if (typeof claim !== "string") {
    return invalidField(source, "claim");
  }
  if (typeof basis !== "string") {
    return invalidField(source, "basis");
  }
  if (!isStringArray(siblings)) {
    return invalidField(source, "siblings");
  }
  if (typeof rootCause !== "string") {
    return invalidField(source, "rootCause");
  }
  return succeed({ location, claim, basis, siblings, rootCause });
}

function parseCandidateStandards(
  value: unknown,
  source: string,
): Result<CandidateStandard[], string> {
  return parseListField(value, source, {
    field: "candidateStandards",
    itemName: "candidate standard",
    parseItem: parseCandidateStandard,
  });
}

function parseCandidateStandard(
  value: unknown,
  source: string,
): Result<CandidateStandard, string> {
  if (!isRecord(value)) {
    return notAnObject(source);
  }
  const { standard, incident } = value;
  if (typeof standard !== "string") {
    return invalidField(source, "standard");
  }
  if (typeof incident !== "string") {
    return invalidField(source, "incident");
  }
  return succeed({ standard, incident });
}
