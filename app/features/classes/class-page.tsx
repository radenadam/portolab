import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { formatMarketTime, formatRupiah } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { parseRecordId } from "~/value-parsers";
import type { Route } from "./+types/class-page";
import {
  findJoinedClass,
  findTaughtClass,
  listStudents,
} from "./class-store.server";
import type { ClassStudent, JoinedClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import styles from "./classes.module.css";
import { formatJoinCode, joinPath } from "./join-code";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: pageTitle(loaderData.name) }];
}

export function loader({ context, params, request }: Route.LoaderArgs):
  | {
      role: "lecturer";
      id: ClassId;
      name: string;
      startingCash: JoinedClass["startingCash"];
      joinCode: string;
      joinAddress: string;
      students: ClassStudent[];
    }
  | ({ role: "student" } & JoinedClass) {
  const user = requireUser(context, request);
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
      return {
        role: user.role,
        id: taught.id,
        name: taught.name,
        startingCash: taught.startingCash,
        joinCode: formatJoinCode(taught.joinCode),
        joinAddress: new URL(joinPath(taught.joinCode), request.url).href,
        students: listStudents(database, taught.id),
      };
    }
    case "student": {
      const joined = findJoinedClass(database, classId.value, user.id);
      if (joined === undefined) {
        throw notFound;
      }
      return { role: user.role, ...joined };
    }
  }
}

export default function ClassPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  switch (loaderData.role) {
    case "lecturer":
      return (
        <>
          <h1>{loaderData.name}</h1>
          <p>
            {m.classes_share_notice({
              cash: formatRupiah(loaderData.startingCash),
            })}
          </p>
          <dl className={styles["share"]}>
            <dt>{m.classes_join_code_label()}</dt>
            <dd className={styles["code"]}>{loaderData.joinCode}</dd>
            <dt>{m.classes_join_address_label()}</dt>
            <dd className={styles["address"]}>{loaderData.joinAddress}</dd>
          </dl>
          <h2>{m.classes_students_title()}</h2>
          <Students classId={loaderData.id} students={loaderData.students} />
        </>
      );
    case "student":
      return (
        <>
          <h1>{loaderData.name}</h1>
          <p>{m.classes_taught_by_notice({ name: loaderData.lecturerName })}</p>
          <p>
            {m.classes_starting_cash_notice({
              cash: formatRupiah(loaderData.startingCash),
            })}
          </p>
          <p>
            {m.classes_joined_notice({
              time: formatMarketTime(loaderData.joinedAt),
            })}
          </p>
        </>
      );
  }
}

function Students({
  classId,
  students,
}: {
  classId: ClassId;
  students: readonly ClassStudent[];
}): ReactNode {
  if (students.length === 0) {
    return <p>{m.classes_no_students_body()}</p>;
  }
  return (
    <ul className={styles["list"]}>
      {students.map((student) => (
        <li key={student.id} className={styles["item"]}>
          <strong className={styles["name"]}>{student.name}</strong>
          <p className={styles["details"]}>
            {m.classes_student_notice({
              username: student.username,
              time: formatMarketTime(student.joinedAt),
            })}
          </p>
          <Link
            to={`/classes/${String(classId)}/students/${String(student.id)}/password`}
            className={styles["link"]}
          >
            {m.classes_reset_password_link({ name: student.name })}
          </Link>
        </li>
      ))}
    </ul>
  );
}
