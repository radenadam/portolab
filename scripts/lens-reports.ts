import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { isRecord } from "../app/value-shapes.ts";
import {
  notAnObject,
  parseListField,
  parseStringAt,
  parseStringsAt,
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
function parseLensReport(
  value: unknown,
  source: string,
): Result<LensReport, string> {
  if (!isRecord(value)) {
    return notAnObject(source, value);
  }
  const lens = parseStringAt(value, source, ["lens"]);
  if (!lens.ok) {
    return lens;
  }
  const report = parseFindingsAndCandidates(
    value,
    source,
    parseReportedFinding,
  );
  return report.ok ? succeed({ lens: lens.value, ...report.value }) : report;
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
    return notAnObject(source, value);
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
  const id = parseStringAt(value, source, ["id"]);
  if (!id.ok) {
    return id;
  }
  const lens = parseStringAt(value, source, ["lens"]);
  if (!lens.ok) {
    return lens;
  }
  const content = parseFindingContent(value, source);
  if (!content.ok) {
    return content;
  }
  return succeed({ ...content.value, id: id.value, lens: lens.value });
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
    return notAnObject(source, value);
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
  const siblings = parseStringsAt(value, source, {
    keys: ["siblings"],
    mayBeEmpty: true,
  });
  if (!siblings.ok) {
    return siblings;
  }
  const rootCause = parseStringAt(value, source, ["rootCause"]);
  if (!rootCause.ok) {
    return rootCause;
  }
  return succeed({
    location: location.value,
    claim: claim.value,
    basis: basis.value,
    siblings: siblings.value,
    rootCause: rootCause.value,
  });
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
