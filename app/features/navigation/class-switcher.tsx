import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { countedText } from "~/counted-text";
import type { Role } from "~/features/accounts/accounts.schema";
import { calendarPath, createClassPath } from "~/features/classes/class-path";
import { termText } from "~/features/classes/term-text";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
import popoverStyles from "~/popover.module.css";
import styles from "./class-switcher.module.css";
import { workspaceHomePath } from "./frame-navigation";
import type { Workspace, WorkspaceClass } from "./frame-reader";

const switcherId = "class-switcher";

// A student finds the next class by joining it, and a lecturer by creating it.
const nextClassLinks: Record<Role, { path: string; label: () => string }> = {
  student: { path: "/join", label: m.navigation_join_link },
  lecturer: { path: createClassPath, label: m.navigation_create_class_link },
};

const classListTitles: Record<Role, () => string> = {
  student: m.navigation_joined_classes_title,
  lecturer: m.navigation_taught_classes_title,
};

/** The switcher at the start of the top bar, which names the class of the workspace with its term and opens a menu of every class of the person, each leading to the home of its class, as decision 0030 sets it. The menu is a list of links, so it works before JavaScript loads. */
export function ClassSwitcher({
  readerRole,
  workspace,
}: {
  readerRole: Role;
  workspace: Workspace;
}): ReactNode {
  const { current } = workspace;
  const nextClass = nextClassLinks[readerRole];
  return (
    <>
      <PopoverButton popover={switcherId} className={styles["button"]}>
        <span className={styles["current"]}>
          <span className={styles["name"]}>
            <NumberText verbatim>{current.name}</NumberText>
          </span>
          {current.term !== undefined && (
            <span className={styles["term"]}>
              <NumberText>{termText(current.term, "alone")}</NumberText>
            </span>
          )}
        </span>
        <Icon name="chevronDown" className={styles["chevron"]} />
      </PopoverButton>
      <Popover
        id={switcherId}
        label={m.navigation_class_switcher_label()}
        placement="belowStart"
      >
        <p className={popoverStyles["heading"]}>
          <NumberText>{classListTitles[readerRole]()}</NumberText>
        </p>
        <ul className={styles["classes"]}>
          {workspace.classes.map((workspaceClass) => (
            <li key={workspaceClass.id}>
              <ClassLink
                readerRole={readerRole}
                workspaceClass={workspaceClass}
                isCurrent={workspaceClass.id === current.id}
              />
            </li>
          ))}
        </ul>
        <hr className={popoverStyles["separator"]} />
        {readerRole === "lecturer" && (
          <Link to={calendarPath(current.id)} className={popoverStyles["item"]}>
            {m.navigation_calendar_link()}
          </Link>
        )}
        <Link to={nextClass.path} className={popoverStyles["item"]}>
          <NumberText>{nextClass.label()}</NumberText>
        </Link>
      </Popover>
    </>
  );
}

function ClassLink({
  readerRole,
  workspaceClass,
  isCurrent,
}: {
  readerRole: Role;
  workspaceClass: WorkspaceClass;
  isCurrent: boolean;
}): ReactNode {
  return (
    <Link
      to={workspaceHomePath(readerRole, workspaceClass.id)}
      aria-current={isCurrent ? "true" : undefined}
      className={popoverStyles["item"]}
    >
      <span className={styles["classText"]}>
        <span>
          <NumberText verbatim>{workspaceClass.name}</NumberText>
        </span>
        <span className={styles["details"]}>
          <NumberText>
            {(textValue) => classDetailsText(workspaceClass, textValue)}
          </NumberText>
        </span>
      </span>
      {isCurrent && <Icon name="check" className={styles["check"]} />}
    </Link>
  );
}

/** The line under the name of a class in the switcher: its lecturer or the number of its students, with its term once its lecturer set the date of its first session. */
function classDetailsText(
  workspaceClass: WorkspaceClass,
  textValue: (value: string) => string,
): string {
  const people = peopleText(workspaceClass.people, textValue);
  return workspaceClass.term === undefined
    ? people
    : m.navigation_class_details_notice({
        people,
        term: termText(workspaceClass.term, "alone"),
      });
}

function peopleText(
  people: WorkspaceClass["people"],
  textValue: (value: string) => string,
): string {
  switch (people.kind) {
    case "lecturer":
      return textValue(people.name);
    case "students":
      return countedText(
        people.count,
        {
          one: m.navigation_one_student_part,
          several: m.navigation_several_students_part,
        },
        {},
      );
  }
}
