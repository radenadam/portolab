import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { sectorNameOf } from "./stock-name";

export function StockMetadata({
  code,
  held,
  isLq45,
}: {
  code: string;
  held: boolean;
  isLq45: boolean;
}): ReactNode {
  return (
    <NumberText>
      {sectorNameOf(code)}
      {isLq45 ? m.market_data_lq45_part() : ""}
      {held ? m.market_data_held_notice() : ""}
    </NumberText>
  );
}
