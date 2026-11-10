import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { findStudentPlace } from "~/features/trading/find-student-place.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import type { Route } from "./+types/stock-measures-page";
import type { StoredMeasureFailure } from "./measure-stored.server";
import type { StockSummary } from "./measure-summaries";
import styles from "./measures.module.css";
import { measuresPath } from "./measures-path";
import { MethodNotice } from "./method-notice";
import { readStockMeasures } from "./read-measures.server";
import { StockMeasuresView } from "./stock-measures-view";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(m.measures_stock_page_title({ code: loaderData.code })),
    },
  ];
}

export function loader({ context, params, url }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  code: string;
  measures: Result<StockSummary, StoredMeasureFailure>;
} {
  const place = findStudentPlace(context, url, params.classId);
  // Portolab measures only the stocks that it tracks, so another code is an address that does not exist.
  const code = trackedStockCodes.find((candidate) => candidate === params.code);
  if (code === undefined) {
    throw data(null, { status: 404 });
  }
  return {
    classId: place.classId,
    className: place.className,
    code,
    measures: readStockMeasures(context.get(databaseContext), code),
  };
}

export default function StockMeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, code } = loaderData;
  return (
    <>
      <h1>{m.measures_stock_page_title({ code })}</h1>
      <Link to={measuresPath(classId)} className={styles["link"]}>
        {m.measures_all_measures_link({ class: className })}
      </Link>
      <MethodNotice />
      <StockMeasuresView code={code} measures={loaderData.measures} />
    </>
  );
}
