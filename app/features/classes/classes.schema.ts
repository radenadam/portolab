import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
// drizzle-kit loads the schemas without the aliases of the app, so a table that another schema holds comes through a relative path.
import { users } from "../accounts/accounts.schema";
import type { UserId } from "../accounts/accounts.schema";
import type { Rupiah } from "~/units/rupiah";
import type { JoinCode } from "./join-code";

/** The number that identifies a class. */
export type ClassId = number & { readonly brand: "ClassId" };

/** The number that identifies a student in a class, against which the portfolio of the student in that class is kept. */
export type MembershipId = number & { readonly brand: "MembershipId" };

/** Each class, which its lecturer teaches, with the cash that each of its students starts with and the code with which they join. */
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
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("classes_lecturer_id_index").on(table.lecturerId)],
);

/** Each student in each class that the student joined. */
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
