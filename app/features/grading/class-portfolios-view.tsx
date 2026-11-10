import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { MethodNotice } from "~/features/measures/method-notice";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "./grading.module.css";
import { portfoliosWorkbookPath } from "./grading-paths";
import type { ClassPortfolios } from "./read-class-portfolios.server";
import { RankedStudents, UnmeasuredStudents } from "./student-standings";

/** The portfolios of the students of a class below the title of their page: the values at delayed prices, the prices that the latest update could not fetch, the link to the workbook, and the students in the order of decision 0021, or that no student has joined yet. */
export function ClassPortfoliosView({
  classId,
  portfolios,
  source,
}: {
  classId: ClassId;
  portfolios: ClassPortfolios;
  source: PriceSourceDescription;
}): ReactNode {
  const { ranked, unmeasured, quoteFailure } = portfolios;
  if (ranked.length === 0 && unmeasured.length === 0) {
    return <p>{m.grading_no_students_body()}</p>;
  }
  return (
    <>
      <p>
        {m.grading_valuation_notice({
          source: source.name,
          minutes: formatNumber(source.delayMinutes),
        })}
      </p>
      {quoteFailure !== undefined && (
        <p className={styles["details"]}>{quoteFailure}</p>
      )}
      <MethodNotice />
      {/* A plain link makes the browser request the address itself, which the server answers with the file, where a link of React Router would ask the router for the data of a page. */}
      <a href={portfoliosWorkbookPath(classId)} className={styles["link"]}>
        {m.grading_export_link()}
      </a>
      <p className={styles["details"]}>{m.grading_export_notice()}</p>
      <h2>{m.grading_ranked_title()}</h2>
      {ranked.length === 0 ? (
        <p>{m.grading_no_ranked_body()}</p>
      ) : (
        <>
          <p>{m.grading_ranked_notice()}</p>
          <RankedStudents classId={classId} students={ranked} />
        </>
      )}
      {unmeasured.length > 0 && (
        <>
          <h2>{m.grading_unmeasured_title()}</h2>
          <UnmeasuredStudents classId={classId} students={unmeasured} />
        </>
      )}
    </>
  );
}
