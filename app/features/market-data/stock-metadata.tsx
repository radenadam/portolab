import type { ReactNode } from "react";
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
  const sector = sectorNameOf(code);
  const text = held
    ? isLq45
      ? m.market_data_held_lq45_metadata_notice({ sector })
      : m.market_data_held_metadata_notice({ sector })
    : isLq45
      ? m.market_data_lq45_metadata_notice({ sector })
      : sector;
  return text;
}
