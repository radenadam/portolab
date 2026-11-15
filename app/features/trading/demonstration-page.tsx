import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { measuresPath } from "~/features/measures/measures-path";
import { activityPath } from "./activity-path";
import { demonstrationPath } from "./demonstration-path";
import { findTradingPlace } from "./find-trading-place.server";
import type { Route } from "./+types/demonstration-page";
import styles from "./demonstration.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.trading_demonstration_title()) }];
}

export function loader({ context, url, params }: Route.LoaderArgs) {
  const place = findTradingPlace(context, url, {
    classId: params.classId,
    kind: "demonstration",
  });
  return { classId: place.classId, startingCash: place.owner.startingCash };
}

export default function DemonstrationPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const path = demonstrationPath(loaderData.classId);
  return (
    <div className={styles["page"]}>
      <header className={styles["header"]}>
        <h1>{m.trading_demonstration_title()}</h1>
        <nav
          className={styles["tabs"]}
          aria-label={m.trading_demonstration_title()}
        >
          <NavLink className={() => styles["tab"]} to={path} end>
            {m.trading_demonstration_summary_label()}
          </NavLink>
          <NavLink
            className={() => styles["tab"]}
            to={activityPath(loaderData.classId, "demonstration")}
          >
            {m.trading_activity_title()}
          </NavLink>
          <NavLink
            className={() => styles["tab"]}
            to={measuresPath(loaderData.classId, "demonstration")}
          >
            {m.trading_demonstration_analysis_label()}
          </NavLink>
        </nav>
      </header>
      <p className={styles["notice"]}>
        <NumberText>
          {m.trading_demonstration_body({
            cash: formatRupiah(loaderData.startingCash),
          })}
        </NumberText>
      </p>
      <Outlet />
    </div>
  );
}
