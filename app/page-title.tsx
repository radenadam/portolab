import type { ReactNode } from "react";
import { m } from "./paraglide/messages.js";

/** The title of a page in the browser, such as "Halaman tidak ditemukan | Portolab". */
export function pageTitle(text: string): string {
  return `${text} | ${m.app_name()}`;
}

/** Sets the title of a page whose title depends on something that route meta cannot see, such as the result of an action or an error. React places it in the head. */
export function PageTitle({ text }: { text: string }): ReactNode {
  return <title>{pageTitle(text)}</title>;
}
