import type { ClassId } from "~/features/classes/classes.schema";
import { stockPath } from "~/features/market-data/stock-path";
import type { OrderSide } from "./order";

export function stockTicketPath(
  classId: ClassId,
  code: string,
  side: OrderSide,
): string {
  return `${stockPath(classId, code)}/${side}`;
}
