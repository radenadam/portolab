import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import { companyOf } from "./company-of";
import type { Sector } from "./company-of";
import styles from "./stock-name.module.css";

const sectorNames: Record<Sector, () => string> = {
  energy: () => m.market_data_energy_sector_name(),
  basicMaterials: () => m.market_data_basic_materials_sector_name(),
  industrials: () => m.market_data_industrials_sector_name(),
  consumerNonCyclicals: () =>
    m.market_data_consumer_non_cyclicals_sector_name(),
  consumerCyclicals: () => m.market_data_consumer_cyclicals_sector_name(),
  healthcare: () => m.market_data_healthcare_sector_name(),
  financials: () => m.market_data_financials_sector_name(),
  technology: () => m.market_data_technology_sector_name(),
  infrastructures: () => m.market_data_infrastructures_sector_name(),
};

/** A stock as decision 0028 shows it where stocks are listed or headlined: the tile of its company beside its code, with the name of the company under the code, and the sector of the company under the name when the screen shows the sector. */
export function StockName({
  code,
  withSector = false,
}: {
  code: string;
  withSector?: boolean;
}): ReactNode {
  const company = companyOf(code);
  return (
    <div className={styles["stock"]}>
      <CompanyTile code={code} />
      <div className={styles["names"]}>
        <span className={styles["code"]}>{code}</span>
        <span className={styles["detail"]}>{company.name}</span>
        {withSector && (
          <span className={styles["detail"]}>
            {sectorNames[company.sector]()}
          </span>
        )}
      </div>
    </div>
  );
}

// The repository carries no logos of other companies, so the tile shows the first two letters of the code, as decision 0034 explains. The code stands beside it, so a screen reader skips the tile.
function CompanyTile({ code }: { code: string }): ReactNode {
  return (
    <span className={styles["tile"]} aria-hidden="true">
      {code.slice(0, 2)}
    </span>
  );
}
