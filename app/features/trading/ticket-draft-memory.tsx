import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { OrderSide } from "./order";
import type { OrderFormFields } from "./order-form-fields";

export const TicketDraftContext = createContext<
  Map<OrderSide, OrderFormFields> | undefined
>(undefined);

/** The stock stays mounted behind its ticket, so a draft needs no persistent browser storage. */
export function TicketDraftMemory({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [memory] = useState(() => new Map<OrderSide, OrderFormFields>());
  return <TicketDraftContext value={memory}>{children}</TicketDraftContext>;
}
