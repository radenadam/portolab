import { StudentHome } from "~/features/trading/student-home";
import { firstNameOf } from "~/features/accounts/first-name-of";
import { onboardingTitle } from "~/features/trading/onboarding-title";
import { parseChoice, parseRecordId } from "~/value-parsers";
import { classMapSections, classMapPath } from "./class-path";
import type { ClassMapSection } from "./class-path";
import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { closeHomeSummary } from "~/features/trading/close-home-summary.server";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { readHomePortfolio } from "~/features/trading/read-home-portfolio.server";
import type { Route } from "./+types/class-page";
import { findJoinedClass, findTaughtClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import { classCalendarOf } from "./course-calendar";
import type { ClassCalendar } from "./course-calendar";
import { parseClassMapAxis } from "./parse-class-map-axis";
import { classMapPoints } from "./class-map-points.server";
import { ClassOverviewView } from "./class-overview-view";
import { readClassOverview } from "./read-class-overview.server";
import type { ClassOverview } from "./read-class-overview.server";
import type { ClassMapAxis } from "./class-map";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  let title = loaderData.name;
  if (loaderData.role === "student") {
    title = m.classes_home_page_title({ class: loaderData.name });
    if (
      loaderData.home.onboarding !== undefined &&
      loaderData.home.welcome !== undefined
    )
      title = onboardingTitle(
        loaderData.home.onboarding,
        loaderData.home.welcome.startingCash,
      );
  }
  return [{ title: pageTitle(title) }];
}

export function loader({ context, params, url, request }: Route.LoaderArgs):
  | {
      role: "lecturer";
      id: ClassId;
      name: string;
      overview: ClassOverview;
      axis: ClassMapAxis;
      reveal: ClassMapSection | undefined;
      calendar: ClassCalendar | undefined;
      points: ReturnType<typeof classMapPoints>;
    }
  | {
      role: "student";
      id: ClassId;
      name: string;
      home: ReturnType<typeof readHomePortfolio>;
      firstName: string;
    } {
  const now = new Date();
  const user = requireUser(context, url);
  const classId = parseRecordId<ClassId>(params.classId, "classId");
  const database = context.get(databaseContext);
  // A class that does not exist and a class that the person may not see answer alike, so a guessed address reveals nothing.
  const notFound = data(null, { status: 404 });
  if (!classId.ok) {
    throw notFound;
  }
  switch (user.role) {
    case "lecturer": {
      const taught = findTaughtClass(database, classId.value, user.id);
      if (taught === undefined) {
        throw notFound;
      }

      const axis = parseClassMapAxis(url.searchParams.get("axis"), "axis");
      if (!axis.ok) throw notFound;
      const revealValue = url.searchParams.get("reveal");
      const reveal =
        revealValue === null
          ? undefined
          : parseChoice(revealValue, "reveal", classMapSections);
      if (reveal !== undefined && !reveal.ok) throw notFound;
      const overview = readClassOverview(database, taught, {
        request,
        now,
        delayMinutes: readPriceSourceDescription(context).delayMinutes,
        sourcePath: classMapPath(taught.id, axis.value),
      });
      return {
        role: user.role,
        id: taught.id,
        name: taught.name,
        overview,
        axis: axis.value,
        reveal: reveal?.value,
        points: classMapPoints(overview, {
          axis: axis.value,
          classId: taught.id,
        }),
        calendar: classCalendarOf(taught.firstSessionDate, now),
      };
    }
    case "student": {
      const joined = findJoinedClass(database, classId.value, user.id);
      if (joined === undefined) {
        throw notFound;
      }
      const home = readHomePortfolio(context, {
        request,
        url,
        classId: params.classId,
        now,
        firstSessionDate: joined.firstSessionDate,
      });
      return {
        role: user.role,
        id: joined.id,
        name: joined.name,
        home,
        firstName: firstNameOf(user.name),
      };
    }
  }
}

export async function action({
  context,
  params,
  request,
  url,
}: Route.ActionArgs) {
  const now = new Date();
  const user = requireUser(context, url);
  const classId = parseRecordId<ClassId>(params.classId, "classId");
  if (!classId.ok || user.role !== "student") throw data(null, { status: 404 });
  const form = await request.formData();
  const database = context.get(databaseContext);
  const joined = findJoinedClass(database, classId.value, user.id);
  if (joined === undefined) throw data(null, { status: 404 });
  const closed = closeHomeSummary(database, form, {
    ...joined,
    now,
  });
  if (!closed.ok)
    return data({ closeFailure: closed.failure }, { status: 400 });
  throw redirect(`${url.pathname}${url.search}`);
}

export default function ClassPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  switch (loaderData.role) {
    case "lecturer":
      return (
        <ClassOverviewView
          classId={loaderData.id}
          overview={loaderData.overview}
          axis={loaderData.axis}
          points={loaderData.points}
        />
      );
    case "student":
      return (
        <StudentHome
          home={loaderData.home}
          classId={loaderData.id}
          firstName={loaderData.firstName}
          onboarding={loaderData.home.onboarding}
          failure={actionData?.closeFailure}
        />
      );
  }
}
