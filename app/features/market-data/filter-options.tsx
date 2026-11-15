import type { ReactNode } from "react";
import type { FieldOption } from "~/form";
import { marketChoiceLabel } from "./market-filters";

/** A refused choice stays visible so the reader can compare it with its error. */
export function FilterOptions({
  options,
  value,
}: {
  options: readonly FieldOption[];
  value: string;
}): ReactNode {
  return (
    <>
      {!options.some((option) => option.value === value) && (
        <option value={value}>{marketChoiceLabel(value)}</option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  );
}
