import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Role } from "~/features/accounts/accounts.schema";
import { m } from "~/paraglide/messages.js";
import { classPath } from "./class-path";
import type { ClassId } from "./classes.schema";
import styles from "./classes.module.css";

/** A class in a list of classes, with the line of details that the reader of the list sees under its name. */
export interface ListedClass {
  id: ClassId;
  name: string;
  details: string;
}

/** The classes that a lecturer teaches or that a student joined, each with a link to its page, or what a person without a class can do. */
export function ClassList({
  role,
  classes,
}: {
  role: Role;
  classes: readonly ListedClass[];
}): ReactNode {
  if (classes.length === 0) {
    return <p>{noClassText(role)}</p>;
  }
  return (
    <ul className={styles["list"]}>
      {classes.map((listed) => (
        <li key={listed.id} className={styles["item"]}>
          <Link to={classPath(listed.id)} className={styles["link"]}>
            {listed.name}
          </Link>
          <p className={styles["details"]}>{listed.details}</p>
        </li>
      ))}
    </ul>
  );
}

// A student account exists only through joining a class, but the person who runs the server can delete a class by hand, which leaves its students without one.
function noClassText(role: Role): string {
  switch (role) {
    case "lecturer":
      return m.classes_no_taught_classes_body();
    case "student":
      return m.classes_no_joined_classes_body();
  }
}
