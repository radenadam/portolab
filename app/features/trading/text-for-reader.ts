import type { ClassId } from "~/features/classes/classes.schema";

/** Who reads the pages of a portfolio: the student who owns it, who opens the other pages of the class, or the lecturer of the class, who reads the portfolio of a student by the name of the student. */
export type PortfolioReader =
  | { kind: "owner"; classId: ClassId }
  | { kind: "lecturer"; studentName: string };

/** The text of a page of a portfolio for its reader. The owner reads about "your" portfolio, and the lecturer reads about the portfolio of the student, whose name the text of the lecturer receives. */
export function textForReader(
  reader: PortfolioReader,
  texts: { owner: () => string; lecturer: (studentName: string) => string },
): string {
  switch (reader.kind) {
    case "owner":
      return texts.owner();
    case "lecturer":
      return texts.lecturer(reader.studentName);
  }
}
