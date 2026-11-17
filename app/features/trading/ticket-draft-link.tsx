import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import type { TicketDraft } from "./use-ticket-draft";
import { pathWithQuery } from "~/path-with-query";

export function TicketDraftLink({
  draft,
  name,
  value,
  label,
  symbol,
  className,
  selected,
}: {
  draft: TicketDraft;
  name: "lots" | "limit" | "priceKind";
  value: string;
  label: string;
  symbol?: string;
  className?: string | undefined;
  selected?: boolean;
}): ReactNode {
  const { values, action } = draft;
  const query = {
    lots: values.lots,
    price: values.limit,
    priceKind: values.priceKind,
    [name === "limit" ? "price" : name]: value,
  };
  return (
    <a
      href={pathWithQuery(action, query)}
      aria-label={symbol === undefined ? undefined : label}
      className={className}
      aria-current={selected ? "true" : undefined}
      onClick={(event) => {
        event.preventDefault();
        draft.change(name, value, event.currentTarget.closest("form"));
      }}
    >
      <NumberText>{symbol ?? label}</NumberText>
    </a>
  );
}
