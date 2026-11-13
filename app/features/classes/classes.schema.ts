import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
// drizzle-kit and the browser tests load the schemas without the aliases of the app, so every import is a relative path.
import { users } from "../accounts/accounts.schema.ts";
import type { UserId } from "../accounts/accounts.schema.ts";
import type { Rupiah } from "../../units/rupiah.ts";
import type { JoinCode } from "./join-code.ts";

/** The number that identifies a class. */
export type ClassId = number & { readonly brand: "ClassId" };

/** The number that identifies the place of a student in a class. */
export type MembershipId = number & { readonly brand: "MembershipId" };

/** Each class, which its lecturer teaches, with the cash that each of its students starts with, the code with which they join, and the date when its first session meets, from which its later sessions follow one a week, as decision 0032 explains. A class that Portolab created before it stored that date has none until its lecturer sets it. A class lives until the person who runs the server deletes it, as the privacy notice states. */
export const classes = sqliteTable(
  "classes",
  {
    id: integer("id").$type<ClassId>().primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    lecturerId: integer("lecturer_id")
      .$type<UserId>()
      .notNull()
      .references(() => users.id),
    startingCash: integer("starting_cash").$type<Rupiah>().notNull(),
    joinCode: text("join_code").$type<JoinCode>().notNull().unique(),
    /** The calendar date of session 1, such as 2026-09-07. */
    firstSessionDate: text("first_session_date"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("classes_lecturer_id_index").on(table.lecturerId)],
);

/** Each student in each class that the student joined. A membership lives as long as its class and its student, as the privacy notice states. */
export const memberships = sqliteTable(
  "memberships",
  {
    id: integer("id").$type<MembershipId>().primaryKey({ autoIncrement: true }),
    classId: integer("class_id")
      .$type<ClassId>()
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("memberships_class_id_student_id_unique").on(
      table.classId,
      table.studentId,
    ),
    index("memberships_student_id_index").on(table.studentId),
  ],
);
