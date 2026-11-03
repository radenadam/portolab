import { nameMaximumLength } from "../app/features/accounts/account-limits.ts";
import { classNameMaximumLength } from "../app/features/classes/class-rules.ts";
import { wideWord } from "./wide-word.ts";

/** The names of a class, of its lecturer, and of a student, each as long as its field takes, so that each screen that shows them is checked with its widest content. */
export const widestClassNames = {
  className: wideWord("Kelas", classNameMaximumLength),
  lecturerName: wideWord("Dosen", nameMaximumLength),
  studentName: wideWord("Mahasiswa", nameMaximumLength),
};
