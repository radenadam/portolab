import type { ReactNode } from "react";
import { companyOf } from "./company-of";
import { sectorNames } from "./sector-names";
import styles from "./stock-name.module.css";

/** A stock as decision 0028 shows it where stocks are listed or headlined: the tile of its company beside its code, with the name of the company under the code, and the sector of the company under the name when the screen shows the sector. */
export function StockName({
  code,
  withSector = false,
  heading = false,
}: {
  code: string;
  withSector?: boolean;
  heading?: boolean;
}): ReactNode {
  const company = companyOf(code);
  return (
    <div
      className={[styles["stock"], heading ? styles["headline"] : undefined]
        .filter(Boolean)
        .join(" ")}
    >
      <CompanyTile code={code} />
      <div className={styles["names"]}>
        {heading ? (
          <h1 className={styles["code"]}>{code}</h1>
        ) : (
          <span className={styles["code"]}>{code}</span>
        )}
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
