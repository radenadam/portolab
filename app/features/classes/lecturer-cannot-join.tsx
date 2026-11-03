import type { ReactNode } from "react";
import { ErrorPage } from "~/error-page";
import { SignOutButton } from "~/features/accounts/sign-out-button";
import { m } from "~/paraglide/messages.js";

/** The page that tells a lecturer that only students join a class, with the button that signs out, after which the lecturer can join as a student. */
export function LecturerCannotJoin(): ReactNode {
  return (
    <ErrorPage
      title={m.classes_join_title()}
      body={m.classes_lecturer_join_error()}
      nextStep={<SignOutButton />}
    />
  );
}
