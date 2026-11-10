import type { ReactNode } from "react";
import { Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { requireTaughtClass } from "~/features/classes/taught-class.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { MethodNotice } from "~/features/measures/method-notice";
import { formatNumber } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/class-portfolios-page";
import styles from "./grading.module.css";
import { portfoliosWorkbookPath } from "./grading-paths";
import { readClassPortfolios } from "./read-class-portfolios.server";
import type { ClassPortfolios } from "./read-class-portfolios.server";
import { RankedStudents, UnmeasuredStudents } from "./student-standings";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(m.grading_page_title({ class: loaderData.className })),
    },
  ];
}

export function loader({ context, request, params, url }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  portfolios: ClassPortfolios;
  source: PriceSourceDescription;
} {
  const taughtClass = requireTaughtClass(context, url, params.classId);
  return {
    classId: taughtClass.id,
    className: taughtClass.name,
    portfolios: readClassPortfolios(context.get(databaseContext), taughtClass, {
      request,
      now: new Date(),
    }),
    source: readPriceSourceDescription(context),
  };
}

export default function ClassPortfoliosPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, portfolios, source } = loaderData;
  const { ranked, unmeasured } = portfolios;
  return (
    <>
      <h1>{m.grading_page_title({ class: className })}</h1>
      <Link to={classPath(classId)} className={styles["link"]}>
        {m.grading_back_link({ class: className })}
      </Link>
      {ranked.length === 0 && unmeasured.length === 0 ? (
        <p>{m.grading_no_students_body()}</p>
      ) : (
        <>
          <p>
            {m.grading_valuation_notice({
              source: source.name,
              minutes: formatNumber(source.delayMinutes),
            })}
          </p>
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
      )}
    </>
  );
}
