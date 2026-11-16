import type { PortfolioKind } from "./portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";

/** An owner reads their own values, while a lecturer reading a student needs that student's name. */
export type PortfolioReader =
  | { kind: "owner"; classId: ClassId; portfolioKind?: PortfolioKind }
  | { kind: "lecturer"; studentName: string };

export type RecordsReader =
  { kind: "owner"; portfolioKind?: PortfolioKind } | { kind: "lecturer" };

export function portfolioKindForReader(reader: RecordsReader): PortfolioKind {
  switch (reader.kind) {
    case "owner":
      return reader.portfolioKind ?? "membership";
    case "lecturer":
      return "membership";
  }
}

/** The text of a page of a portfolio for its reader. The owner reads about "your" portfolio, and the lecturer reads about the portfolio of the student, whose name the text of the lecturer receives. */
export function textForReader(
  reader:
    | { kind: "owner"; portfolioKind?: PortfolioKind }
    | Extract<PortfolioReader, { kind: "lecturer" }>,
  texts: {
    owner: (portfolioKind: PortfolioKind) => string;
    lecturer: (studentName: string) => string;
  },
): string {
  switch (reader.kind) {
    case "owner":
      return texts.owner(portfolioKindForReader(reader));
    case "lecturer":
      return texts.lecturer(reader.studentName);
  }
}

export function portfolioStudentName(
  reader: PortfolioReader,
): string | undefined {
  switch (reader.kind) {
    case "owner":
      return undefined;
    case "lecturer":
      return reader.studentName;
  }
}

export function readerWithTextName(
  reader: PortfolioReader,
  textValue: (value: string) => string,
): PortfolioReader {
  switch (reader.kind) {
    case "owner":
      return reader;
    case "lecturer":
      return { ...reader, studentName: textValue(reader.studentName) };
  }
}

/** A lecturer who owns a demonstration needs the server owner for missing records, as when reading a student. */
export function recordsStepForReader(
  reader: RecordsReader,
  texts: { student: () => string; lecturer: () => string },
): string {
  switch (reader.kind) {
    case "lecturer":
      return texts.lecturer();
    case "owner": {
      return recordsStepForPortfolio(portfolioKindForReader(reader), texts);
    }
  }
}

function recordsStepForPortfolio(
  kind: PortfolioKind,
  texts: { student: () => string; lecturer: () => string },
): string {
  const steps: Record<PortfolioKind, () => string> = {
    membership: texts.student,
    demonstration: texts.lecturer,
  };
  return steps[kind]();
}
