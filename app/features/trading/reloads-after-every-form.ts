import type { ShouldRevalidateFunctionArgs } from "react-router";

/** Whether a page with an order ticket loads its data again: after every form, and whenever React Router would. The orders change while the page is open, such as by a fill of the price job or a cancel on another device, and after a form that Portolab refused, React Router keeps the data that the page loaded. */
export function reloadsAfterEveryForm({
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  return formMethod !== undefined || defaultShouldRevalidate;
}
