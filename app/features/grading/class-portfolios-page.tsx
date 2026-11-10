import type { ReactNode } from "react";
import { Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { requireTaughtClass } from "~/features/classes/taught-class.server";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/class-portfolios-page";
import { ClassPortfoliosView } from "./class-portfolios-view";
import styles from "./grading.module.css";
import { readClassPortfolios } from "./read-class-portfolios.server";
import type { ClassPortfolios } from "./read-class-portfolios.server";

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
  const source = readPriceSourceDescription(context);
  return {
    classId: taughtClass.id,
    className: taughtClass.name,
    portfolios: readClassPortfolios(context.get(databaseContext), taughtClass, {
      request,
      now: new Date(),
      delayMinutes: source.delayMinutes,
    }),
    source,
  };
}

export default function ClassPortfoliosPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { classId, className } = loaderData;
  return (
    <>
      <h1>{m.grading_page_title({ class: className })}</h1>
      <Link to={classPath(classId)} className={styles["link"]}>
        {m.grading_back_link({ class: className })}
      </Link>
      <ClassPortfoliosView
        classId={classId}
        portfolios={loaderData.portfolios}
        source={loaderData.source}
      />
    </>
  );
}
