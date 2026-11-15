import type { PortfolioKind } from "./portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";

/** An owner reads their own values, while a lecturer reading a student needs that student's name. */
export type PortfolioReader =
  | { kind: "owner"; classId: ClassId; portfolioKind?: PortfolioKind }
  | { kind: "lecturer"; studentName: string };

/** The text of a page of a portfolio for its reader. The owner reads about "your" portfolio, and the lecturer reads about the portfolio of the student, whose name the text of the lecturer receives. */
export function textForReader(
  reader: PortfolioReader,
  texts: {
    owner: (portfolioKind: PortfolioKind) => string;
    lecturer: (studentName: string) => string;
  },
): string {
  switch (reader.kind) {
    case "owner":
      return texts.owner(reader.portfolioKind ?? "membership");
    case "lecturer":
      return texts.lecturer(reader.studentName);
  }
}

/** A lecturer who owns a demonstration needs the server owner for missing records, as when reading a student. */
export function recordsStepForReader(
  reader: PortfolioReader,
  texts: { student: () => string; lecturer: () => string },
): string {
  switch (reader.kind) {
    case "lecturer":
      return texts.lecturer();
    case "owner": {
      return recordsStepForPortfolio(
        reader.portfolioKind ?? "membership",
        texts,
      );
    }
  }
}

export function recordsStepForPortfolio(
  kind: PortfolioKind,
  texts: { student: () => string; lecturer: () => string },
): string {
  const steps: Record<PortfolioKind, () => string> = {
    membership: texts.student,
    demonstration: texts.lecturer,
  };
  return steps[kind]();
}
