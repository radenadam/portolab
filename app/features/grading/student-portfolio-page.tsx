import { Icon } from "~/icon";
import { NumberText } from "~/number-text";
import { formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "./taught-student.module.css";
import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import { HomePortfolio } from "~/features/trading/home-portfolio";
import { readHomePortfolioData } from "~/features/trading/read-home-portfolio.server";
import { readPortfolioReport } from "~/features/trading/read-portfolio-report.server";
import type { Route } from "./+types/student-portfolio-page";
import { readTaughtPortfolio } from "./read-taught-portfolio.server";
import { TaughtStudentPage, taughtStudentMeta } from "./taught-student-page";

export const meta = taughtStudentMeta("portfolio");

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const taught = readTaughtPortfolio(context, { request, url, params, now });
  const common = { student: taught.student, returnPath: taught.returnPath };
  if (
    taught.portfolio.holdings.length === 0 &&
    taught.portfolio.orders.length === 0
  )
    return { ...common, kind: "empty" as const, cash: taught.portfolio.cash };
  const report = readPortfolioReport(context.get(databaseContext), taught, {
    now,
    delayMinutes: taught.source.delayMinutes,
  });
  return {
    ...common,
    kind: "portfolio" as const,
    home: readHomePortfolioData(context, {
      ...taught,
      classId: taught.student.classId,
      request,
      url,
      now,
      report,
    }),
  };
}

export default function StudentPortfolioPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { student, returnPath } = loaderData;
  return (
    <TaughtStudentPage
      page="portfolio"
      student={student}
      returnPath={returnPath}
    >
      {loaderData.kind === "empty" ? (
        <section className={styles["empty"]}>
          <Icon name="clock" className={undefined} />
          <p>
            <NumberText>
              {(textValue) =>
                m.grading_student_empty_body({
                  name: textValue(student.name),
                  cash: formatRupiah(loaderData.cash),
                })
              }
            </NumberText>
          </p>
        </section>
      ) : (
        <HomePortfolio
          home={loaderData.home}
          classId={student.classId}
          reader={{ kind: "lecturer", studentName: student.shortName }}
        />
      )}
    </TaughtStudentPage>
  );
}
