import { HomeSinceCard } from "~/features/trading/home-since-card";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { parseChoice, parseRecordId } from "~/value-parsers";
import {
  classMapSections,
  classMapTargetId,
  calendarPath,
  classMapPath,
  resetStudentPasswordPath,
} from "./class-path";
import type { ClassMapSection } from "./class-path";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { data, Link, redirect } from "react-router";
import { dismissHomeSince } from "./home-dismissal.server";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { formatMarketTime } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { classPortfoliosPath } from "~/features/grading/grading-paths";
import { HomePortfolio } from "~/features/trading/home-portfolio";
import { readHomePortfolio } from "~/features/trading/read-home-portfolio.server";
import type { Route } from "./+types/class-page";
import { findJoinedClass, findTaughtClass } from "./class-store.server";
import type { ClassStudent } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import styles from "./classes.module.css";
import { classCalendarOf } from "./course-calendar";
import type { ClassCalendar } from "./course-calendar";
import { CourseCalendarNotice } from "./course-calendar-notice";
import { parseClassMapAxis } from "./parse-class-map-axis";
import { classMapPoints } from "./class-map-points.server";
import { ClassOverviewView } from "./class-overview-view";
import { readClassOverview } from "./read-class-overview.server";
import type { ClassOverview } from "./read-class-overview.server";
import type { ClassMapAxis } from "./class-map";
import { readPriceSourceDescription } from "~/features/market-data/price-source-context.server";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        loaderData.role === "student"
          ? m.classes_home_page_title({ class: loaderData.name })
          : loaderData.name,
      ),
    },
  ];
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
      return {
        role: user.role,
        id: joined.id,
        name: joined.name,
        home: readHomePortfolio(context, {
          request,
          url,
          classId: params.classId,
          now,
          firstSessionDate: joined.firstSessionDate,
        }),
      };
    }
  }
}

export function action({ context, params, url }: Route.ActionArgs): never {
  const now = new Date();
  const user = requireUser(context, url);
  const classId = parseRecordId<ClassId>(params.classId, "classId");
  if (!classId.ok || user.role !== "student") throw data(null, { status: 404 });
  const database = context.get(databaseContext);
  const joined = findJoinedClass(database, classId.value, user.id);
  if (joined === undefined) throw data(null, { status: 404 });
  dismissHomeSince(database, joined.membershipId, now);
  throw redirect(`${url.pathname}${url.search}`);
}

export default function ClassPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  switch (loaderData.role) {
    case "lecturer":
      return (
        <ClassOverviewView
          classId={loaderData.id}
          overview={loaderData.overview}
          axis={loaderData.axis}
          reveal={loaderData.reveal}
          points={loaderData.points}
          administration={
            <>
              <h2>{m.classes_calendar_title()}</h2>
              <CourseCalendarNotice
                calendar={loaderData.calendar}
                role={loaderData.role}
              />
              <Link
                to={pathReturningTo(
                  calendarPath(loaderData.id),
                  classMapPath(loaderData.id, loaderData.axis, {
                    section: "administration",
                  }),
                )}
                className={styles["link"]}
              >
                {m.classes_calendar_link()}
              </Link>
              <h2>{m.classes_students_title()}</h2>
              <Link
                to={classPortfoliosPath(loaderData.id)}
                className={styles["link"]}
              >
                {m.classes_portfolios_link()}
              </Link>
              {loaderData.overview.students.length > 0 && (
                <Students
                  classId={loaderData.id}
                  students={loaderData.overview.students}
                  axis={loaderData.axis}
                />
              )}
            </>
          }
        />
      );
    case "student":
      return (
        <HomePortfolio
          home={loaderData.home}
          classId={loaderData.id}
          reader={{ kind: "owner", classId: loaderData.id }}
          notice={
            <HomeSinceCard
              orders={loaderData.home.sinceOrders}
              now={loaderData.home.now}
              classId={loaderData.id}
            />
          }
        />
      );
  }
}

function Students({
  classId,
  axis,
  students,
}: {
  classId: ClassId;
  axis: ClassMapAxis;
  students: readonly Pick<
    ClassStudent,
    "id" | "name" | "username" | "joinedAt"
  >[];
}): ReactNode {
  return (
    <ul className={styles["list"]}>
      {students.map((student) => (
        <li
          key={student.id}
          id={classMapTargetId("administration", student.id)}
          className={styles["item"]}
        >
          <strong className={styles["name"]}>
            <NumberText verbatim>{student.name}</NumberText>
          </strong>
          <p className={styles["details"]}>
            <NumberText>
              {(textValue) =>
                m.classes_student_notice({
                  username: textValue(student.username),
                  time: formatMarketTime(student.joinedAt),
                })
              }
            </NumberText>
          </p>
          <Link
            to={pathReturningTo(
              resetStudentPasswordPath(classId, student.id),
              classMapPath(classId, axis, {
                section: "administration",
                studentId: student.id,
              }),
            )}
            className={styles["link"]}
          >
            <NumberText verbatim>
              {m.classes_reset_password_link({ name: student.name })}
            </NumberText>
          </Link>
        </li>
      ))}
    </ul>
  );
}
