import type { ReactNode } from "react";
import { Form } from "react-router";
import { SubmitButton } from "~/form";
import { m } from "~/paraglide/messages.js";

/** The button that ends the session on this device. */
export function SignOutButton(): ReactNode {
  return (
    <Form method="post" action="/sign-out">
      <SubmitButton label={m.accounts_sign_out_label()} />
    </Form>
  );
}
