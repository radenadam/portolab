import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { ChangeText } from "~/change-text";
import { Sparkline } from "~/charts/sparkline";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockName } from "~/features/market-data/stock-name";
import { StockPageLink } from "~/features/market-data/stock-page-link";
import {
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import { HomeHoldingPrice } from "./home-holding-price";
import { WeightMark, GainMark } from "./home-holding-marks";
import type { HomeHolding } from "./home-holdings";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import styles from "./home-portfolio.module.css";

export function HomeHoldingTableRow({
  row,
  home,
  classId,
  maximumWeight,
  maximumGain,
  sharedTime,
  keepReturn,
}: {
  row: HomeHolding;
  home: HomePortfolioData;
  classId: ClassId;
  maximumWeight: PortfolioWeight;
  maximumGain: Rupiah;
  sharedTime: Date | undefined;
  keepReturn: boolean;
}): ReactNode {
  const { holding } = row;
  const history = home.histories.find(({ code }) => code === holding.code);
  return (
    <tr>
      <th scope="row">
        <StockPageLink
          classId={classId}
          code={holding.code}
          id={`home-holding-desktop-${holding.code}`}
          keepReturn={keepReturn}
          className={styles["stockLink"]}
        >
          <StockName code={holding.code} />
        </StockPageLink>
      </th>
      <td>
        <WeightMark value={row.weight} maximum={maximumWeight} />
      </td>
      <td>
        <NumberText>
          {home.lotShares === undefined
            ? formatNumber(holding.shares)
            : formatNumber(holding.shares / home.lotShares)}
        </NumberText>
      </td>
      <td>
        <NumberText>{formatNumber(row.averageCost)}</NumberText>
      </td>
      <td>
        <HomeHoldingPrice
          sharedTime={sharedTime}
          holding={row.holding}
          failed={
            home.report.quoteAttempt?.failedCodes.includes(row.holding.code) ??
            false
          }
        />
      </td>
      <td>
        {holding.kind === "priced" && (
          <NumberText>{formatRupiah(holding.value)}</NumberText>
        )}
      </td>
      <td>
        {holding.kind === "priced" && (
          <div className={styles["profit"]}>
            <GainMark value={holding.gain} maximum={maximumGain} />
            <span>
              <ChangeText colored change={formatSignedRupiah(holding.gain)} />
              <small>
                <ChangeText
                  colored
                  change={formatSignedPercent(holding.gainReturn)}
                />
              </small>
            </span>
          </div>
        )}
      </td>
      <td>{history !== undefined && <Sparkline closes={history.closes} />}</td>
    </tr>
  );
}
