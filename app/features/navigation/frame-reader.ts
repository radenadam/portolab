import type { Role } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import type { Term } from "~/features/classes/course-calendar";

/** A class of a person, as the switcher of the class shows it. */
export interface WorkspaceClass {
  id: ClassId;
  name: string;
  /** The term of the class from the date of its first session, or undefined while its lecturer has not set the date. */
  term: Term | undefined;
  /** The people of the class that the switcher names: its lecturer to a student, and the number of its students to its lecturer. */
  people:
    { kind: "lecturer"; name: string } | { kind: "students"; count: number };
}

/** The class whose pages the navigation of a person leads to, with every class of the person in the order in which the person joined or created them. */
export interface Workspace {
  current: WorkspaceClass;
  classes: WorkspaceClass[];
}

/** Who reads a page, as the frame shows them: a visitor who is not signed in, a person who still has to finish the account, or a person who has, with the workspace of a class unless the person has no class. */
export type FrameReader =
  | { kind: "visitor" }
  | { kind: "settingUp" }
  | {
      kind: "user";
      role: Role;
      name: string;
      workspace: Workspace | undefined;
    };
