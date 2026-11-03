import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { formatMarketTime, formatRupiah } from "~/formatting";
import { addressesForOthers } from "~/local-network.server";
import type { AddressesForOthers } from "~/local-network.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Rupiah } from "~/units/rupiah";
import { parseRecordId } from "~/value-parsers";
import { ordersPath } from "~/features/trading/orders-path";
import type { Route } from "./+types/class-page";
import {
  findJoinedClass,
  findTaughtClass,
  listStudents,
} from "./class-store.server";
import type { ClassStudent, JoinedClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import { classPath } from "./class-path";
import styles from "./classes.module.css";
import { formatJoinCode, joinPath } from "./join-code";
import { JoinDetails } from "./join-details";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [{ title: pageTitle(loaderData.name) }];
}

export function loader({ context, params, url }: Route.LoaderArgs):
  | {
      role: "lecturer";
      id: ClassId;
      name: string;
      startingCash: Rupiah;
      joinCode: string;
      joinAddresses: AddressesForOthers;
      students: ClassStudent[];
    }
  | ({ role: "student" } & JoinedClass) {
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
      const joinCode = formatJoinCode(taught.joinCode);
      return {
        role: user.role,
        id: taught.id,
        name: taught.name,
        startingCash: taught.startingCash,
        joinCode,
        // The host comes from the request, so a forged Host header shows the addresses of the server on its networks only to the lecturer of the class, who reaches the server already.
        joinAddresses: addressesForOthers(new URL(joinPath(joinCode), url)),
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
          <JoinDetails
            joinCode={loaderData.joinCode}
            joinAddresses={loaderData.joinAddresses}
            startingCash={loaderData.startingCash}
          />
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
          <Link to={ordersPath(loaderData.id)} className={styles["link"]}>
            {m.classes_orders_link()}
          </Link>
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
            to={`${classPath(classId)}/students/${String(student.id)}/password`}
            className={styles["link"]}
          >
            {m.classes_reset_password_link({ name: student.name })}
          </Link>
        </li>
      ))}
    </ul>
  );
}
