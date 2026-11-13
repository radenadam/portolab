import type { ReactNode } from "react";
import { Form } from "react-router";
import { SubmitButton } from "~/form";
import { m } from "~/paraglide/messages.js";

/** The button that ends the session on this device, with the look of a button of a page unless its place gives it another, such as an item of a menu. */
export function SignOutButton({
  className,
}: {
  className?: string | undefined;
}): ReactNode {
  return (
    <Form method="post" action="/sign-out">
      <SubmitButton label={m.accounts_sign_out_label()} className={className} />
    </Form>
  );
}
