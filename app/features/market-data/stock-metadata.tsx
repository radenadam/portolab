import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import { sectorName } from "./sector-name";
import { companyOf } from "./company-of";

export function StockMetadata({
  code,
  held,
  isLq45,
}: {
  code: string;
  held: boolean;
  isLq45: boolean;
}): ReactNode {
  const sector = sectorName(companyOf(code).sector);
  const text = held
    ? isLq45
      ? m.market_data_held_lq45_metadata_notice({ sector })
      : m.market_data_held_metadata_notice({ sector })
    : isLq45
      ? m.market_data_lq45_metadata_notice({ sector })
      : sector;
  return text;
}
