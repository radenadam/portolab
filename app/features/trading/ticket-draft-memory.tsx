import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { OrderSide } from "./order";
import type { OrderFormFields } from "./order-form-fields";
import {
  readStoredTicketDraft,
  writeStoredTicketDraft,
} from "./stored-ticket-draft";

interface TicketDraftStore {
  get: (side: OrderSide) => OrderFormFields | undefined;
  set: (side: OrderSide, fields: OrderFormFields) => void;
  delete: (side: OrderSide) => void;
}

export const TicketDraftContext = createContext<TicketDraftStore | undefined>(
  undefined,
);

/** Session storage keeps a draft across a full lesson visit in this tab. Memory still works when browser storage is unavailable. */
export function TicketDraftMemory({
  children,
  storageKey,
}: {
  children: ReactNode;
  storageKey: string;
}): ReactNode {
  const [memory] = useState<TicketDraftStore>(() => {
    const drafts = new Map<OrderSide, OrderFormFields>();
    const keyOf = (side: OrderSide) => `portolab:ticket:${storageKey}:${side}`;
    return {
      get(side) {
        const remembered = drafts.get(side);
        if (remembered !== undefined) return remembered;
        let stored;
        try {
          stored = readStoredTicketDraft(sessionStorage, keyOf(side));
        } catch {
          // A browser can refuse storage, so a draft must still work in memory.
        }
        if (stored === undefined) return undefined;
        if (!stored.ok) throw new Error(stored.failure);
        return stored.value;
      },
      set(side, fields) {
        drafts.set(side, fields);
        try {
          writeStoredTicketDraft(sessionStorage, keyOf(side), fields);
        } catch {
          // A browser can refuse storage, so a draft must still work in memory.
        }
      },
      delete(side) {
        drafts.delete(side);
        try {
          sessionStorage.removeItem(keyOf(side));
        } catch {
          // A browser can refuse storage, so a draft must still work in memory.
        }
      },
    };
  });
  return <TicketDraftContext value={memory}>{children}</TicketDraftContext>;
}
