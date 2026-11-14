import type { SessionNumber } from "../classes/course-calendar.ts";

export const termIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export const formulaIds = [
  "weighted-return",
  "portfolio-variance",
  "variance",
  "covariance",
  "correlation",
  "beta",
  "required-return",
  "jensens-alpha",
  "sharpe",
  "treynor",
  "risk-free-rate",
  "variance-share",
] as const;

export const tableIds = [
  "trading-rules",
  "trading-sessions",
  "transaction-costs",
  "price-source",
  "estimation-settings",
] as const;

export type ContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "formula"; id: (typeof formulaIds)[number] }
  | { kind: "table"; id: (typeof tableIds)[number] };

export type LessonSection =
  | {
      id: "summary" | "key-idea" | "body" | "unavailable";
      blocks: ContentBlock[];
    }
  | { id: "terms"; termIds: string[] }
  | { id: "interactive" | "practice" };

export type SessionKind = "short" | "full" | "review" | "exam";

export interface SessionContent {
  session: SessionNumber;
  kind: SessionKind;
  title: string;
  sections: LessonSection[];
}

export interface GlossaryTerm {
  id: string;
  title: string;
  session: SessionNumber;
  blocks: ContentBlock[];
}

export interface LearningContent {
  sessions: SessionContent[];
  terms: GlossaryTerm[];
}

// The calendar owns the session numbers. This table makes a changed course fail to compile until its content structure is chosen.
export const sessionKinds = {
  1: "short",
  2: "full",
  3: "short",
  4: "short",
  5: "short",
  6: "full",
  7: "review",
  8: "exam",
  9: "full",
  10: "full",
  11: "short",
  12: "short",
  13: "short",
  14: "short",
  15: "review",
  16: "exam",
} as const satisfies Record<SessionNumber, SessionKind>;

export function contentSession(number: number): SessionNumber | undefined {
  return isSessionNumber(number) ? number : undefined;
}

function isSessionNumber(value: number): value is SessionNumber {
  return Object.hasOwn(sessionKinds, value);
}
