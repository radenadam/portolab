import type { ReactNode } from "react";
import { useState } from "react";
import { useRouteLoaderData } from "react-router";
import { companyOf } from "./company-of";
import { sectorName } from "./sector-name";
import styles from "./stock-name.module.css";
import { companyLogoPath } from "./company-logo-paths";

/** A stock as decision 0028 shows it where stocks are listed or headlined: the tile of its company beside its code, with the name of the company under the code, and the sector of the company under the name when the screen shows the sector. */
export function StockName({
  code,
  withSector = false,
  heading = false,
  withCompanyName = true,
  detail,
  codeDetail,
  smallTile = false,
}: {
  code: string;
  withSector?: boolean;
  heading?: boolean;
  withCompanyName?: boolean;
  detail?: ReactNode;
  codeDetail?: ReactNode;
  smallTile?: boolean;
}): ReactNode {
  const company = companyOf(code);
  const codeLabel = <CodeName code={code} heading={heading} />;
  return (
    <div
      className={[
        styles["stock"],
        heading ? styles["headline"] : undefined,
        withCompanyName || withSector ? undefined : styles["compact"],
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CompanyTile code={code} small={smallTile} />
      <div className={styles["names"]}>
        {codeDetail === undefined ? (
          codeLabel
        ) : (
          <div className={styles["codeLine"]}>
            {codeLabel}
            <span className={styles["codeDetail"]}>{codeDetail}</span>
          </div>
        )}
        {withCompanyName && (
          <span className={styles["detail"]}>{company.name}</span>
        )}
        {detail !== undefined && (
          <span className={styles["detail"]}>{detail}</span>
        )}
        {withSector && (
          <span className={styles["detail"]}>{sectorName(company.sector)}</span>
        )}
      </div>
    </div>
  );
}

function CodeName({
  code,
  heading,
}: {
  code: string;
  heading: boolean;
}): ReactNode {
  return heading ? (
    <h1 className={styles["code"]}>{code}</h1>
  ) : (
    <span className={styles["code"]}>{code}</span>
  );
}

// The code stands beside the tile, so a screen reader skips this decorative image and its fallback.
export function CompanyTile({
  code,
  small,
}: {
  code: string;
  small: boolean;
}): ReactNode {
  const data = useRouteLoaderData<{ companyLogos: readonly string[] }>("root");
  const [failedCode, setFailedCode] = useState<string>();
  const withLogo =
    data?.companyLogos.includes(code) === true && failedCode !== code;
  return (
    <span
      className={[styles["tile"], small ? styles["smallTile"] : undefined]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {code.slice(0, 2)}
      {withLogo && (
        <img
          src={companyLogoPath(code)}
          alt=""
          ref={(image) => {
            // A failed native request can finish before hydration installs the error handler.
            if (image?.complete && image.naturalWidth === 0)
              setFailedCode(code);
          }}
          onError={() => {
            setFailedCode(code);
          }}
        />
      )}
    </span>
  );
}
