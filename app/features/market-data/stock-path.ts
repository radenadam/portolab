import type { OrderSide } from "~/features/trading/order";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** Stock and ticket links share the class workspace required by decision 0030. */
export function stockPath(
  classId: ClassId,
  code: string,
  side?: OrderSide,
): string {
  const stock = `${classPath(classId)}/stocks/${code}`;
  return side === undefined ? stock : `${stock}/${side}`;
}
