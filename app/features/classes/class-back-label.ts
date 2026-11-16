import { m } from "~/paraglide/messages.js";

export function classBackLabel(className: string): string {
  return m.classes_back_link({ class: className });
}
