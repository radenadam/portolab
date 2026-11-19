import type { ReactNode } from "react";
import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";
import { NumberText } from "~/number-text";
import type { ComparedStudent } from "./student-filters";

/** Why the ranking has no measure for a student. A portfolio without measures explains itself with the notice of the measures, which keeps the name of the student apart from its quantities, and a missing ratio gives its own reason. */
export function StudentMeasureNotice({
  student,
  text,
}: {
  student: ComparedStudent;
  text: string;
}): ReactNode {
  return "report" in student ? (
    <PortfolioMeasuresNotice
      report={student.report}
      reader={{ kind: "lecturer", studentName: student.name }}
    />
  ) : (
    <NumberText>{text}</NumberText>
  );
}
