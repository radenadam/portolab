import type { ReactNode } from "react";
import { Link } from "react-router";
import { NumberText } from "~/number-text";
import { ChangeText } from "~/change-text";
import { Sparkline } from "~/charts/sparkline";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockName } from "~/features/market-data/stock-name";
import { stockPath } from "~/features/market-data/stock-path";
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
}: {
  row: HomeHolding;
  home: HomePortfolioData;
  classId: ClassId;
  maximumWeight: PortfolioWeight;
  maximumGain: Rupiah;
}): ReactNode {
  const { holding } = row;
  const history = home.histories.find(({ code }) => code === holding.code);
  return (
    <tr>
      <th scope="row">
        <Link
          className={styles["stockLink"]}
          to={stockPath(classId, holding.code)}
        >
          <StockName code={holding.code} />
        </Link>
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
        <NumberText>{formatRupiah(row.averageCost)}</NumberText>
      </td>
      <td>
        <HomeHoldingPrice
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
      <td>
        {history !== undefined && (
          <Sparkline closes={history.closes.map(({ close }) => close)} />
        )}
      </td>
    </tr>
  );
}
