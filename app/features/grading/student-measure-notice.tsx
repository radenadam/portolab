import type { ReactNode } from "react";
import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";
import { NumberText } from "~/number-text";
import type { ComparedStudent } from "./student-filters";

/** The table and selected panel must keep the same distinction between names and quantities. */
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
