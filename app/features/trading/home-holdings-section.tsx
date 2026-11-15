import { HomeHoldingTableRow } from "./home-holding-table-row";
import { CashName } from "./cash-name";
import { sharedQuoteTime } from "~/features/market-data/shared-quote-time";
import { SharedQuoteTimeNotice } from "~/features/market-data/shared-quote-time-notice";
import { HomeHoldingPrice } from "./home-holding-price";
import { NumberText } from "~/number-text";
import { homeHoldingsSectionId } from "./home-holdings-section-id";
import { homeSparklineMonths } from "./home-sparkline-months";
import { portfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import { lots } from "~/units/lots";
import { lotCount, shareCount } from "./count-parts";
import { WeightMark, GainMark } from "./home-holding-marks";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockName } from "~/features/market-data/stock-name";
import { StockPageLink } from "~/features/market-data/stock-page-link";
import {
  formatNumber,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { ConceptHelp } from "~/concept-card";
import type { homeHoldings } from "./home-holdings";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import styles from "./home-portfolio.module.css";

interface HoldingsProps {
  home: HomePortfolioData;
  values: ReturnType<typeof homeHoldings>;
  classId: ClassId;
  studentName?: string | undefined;
}

/** The widest amounts need the width of the whole page, so narrow screens use rows. */
export function HomeHoldingsSection({
  home,
  values,
  classId,
  studentName,
}: HoldingsProps): ReactNode {
  const sharedTime = sharedQuoteTime(
    home.report.valuation.holdings.map((holding) =>
      holding.kind === "priced" ? holding.quote : undefined,
    ),
  );
  const maximumWeight = portfolioWeight(
    Math.max(
      values.cashWeight ?? 0,
      ...values.holdings.map(({ weight }) => weight ?? 0),
      0.01,
    ),
  );
  const maximumGain = rupiah(
    Math.max(
      1,
      ...values.holdings.map(({ holding }) =>
        holding.kind === "priced" ? Math.abs(holding.gain) : 0,
      ),
    ),
  );
  const title = (textValue: (value: string) => string): string =>
    countedText(
      values.holdings.length,
      {
        one:
          studentName === undefined
            ? m.trading_home_one_holding_title
            : m.trading_home_student_one_holding_title,
        several:
          studentName === undefined
            ? m.trading_home_several_holdings_title
            : m.trading_home_student_several_holdings_title,
      },
      { name: studentName === undefined ? "" : textValue(studentName) },
    );
  const cashNote =
    home.setAside.orders === 0
      ? m.trading_home_no_order_cash_notice()
      : countedText(
          home.setAside.orders,
          {
            one: m.trading_home_one_order_cash_notice,
            several: m.trading_home_several_orders_cash_notice,
          },
          { amount: formatRupiah(home.setAside.amount) },
        );
  return (
    <section
      className={styles["holdings"]}
      aria-labelledby={homeHoldingsSectionId}
    >
      <h2 id={homeHoldingsSectionId} className={styles["holdingsTitle"]}>
        <NumberText>{title}</NumberText>
      </h2>
      {values.holdings.length === 0 && (
        <p className={styles["empty"]}>
          <NumberText verbatim>
            {studentName === undefined
              ? m.trading_no_holdings_body()
              : m.trading_home_student_no_holdings_body({ name: studentName })}
          </NumberText>
        </p>
      )}
      <div className={styles["desktopHoldings"]}>
        <table className={styles["table"]}>
          <thead>
            <tr>
              <th scope="col">{m.trading_stock_label()}</th>
              <th scope="col">{m.trading_home_weight_label()}</th>
              <th scope="col">
                {home.lotShares === undefined
                  ? m.trading_shares_label()
                  : m.trading_home_lots_label()}
              </th>
              <th scope="col">
                {m.trading_home_average_label()}
                <ConceptHelp title={m.trading_home_average_label()}>
                  <p>{m.trading_home_average_body()}</p>
                </ConceptHelp>
              </th>
              <th scope="col">{m.trading_delayed_price_label()}</th>
              <th scope="col">{m.trading_value_label()}</th>
              <th scope="col">
                {m.trading_home_gain_label()}
                <ConceptHelp title={m.trading_home_gain_label()}>
                  <p>{m.trading_home_gain_body()}</p>
                </ConceptHelp>
              </th>
              <th scope="col">
                <NumberText>
                  {m.trading_home_month_label({
                    months: formatNumber(homeSparklineMonths),
                  })}
                </NumberText>
              </th>
            </tr>
          </thead>
          <tbody>
            {values.holdings.map((row) => (
              <HomeHoldingTableRow
                key={row.holding.code}
                row={row}
                home={home}
                classId={classId}
                maximumWeight={maximumWeight}
                maximumGain={maximumGain}
                sharedTime={sharedTime}
                keepReturn={studentName !== undefined}
              />
            ))}
            <tr>
              <th scope="row">
                <CashName note={cashNote} cash={home.report.valuation.cash} />
              </th>
              <td>
                <WeightMark value={values.cashWeight} maximum={maximumWeight} />
              </td>
              <td />
              <td />
              <td />
              <td>
                <NumberText>
                  {formatRupiah(home.report.valuation.cash)}
                </NumberText>
              </td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <ul className={styles["phoneHoldings"]} data-layout="rows">
        {values.holdings.map((row) => (
          <li key={row.holding.code} className={styles["holdingRow"]}>
            <StockPageLink
              classId={classId}
              code={row.holding.code}
              id={`home-holding-phone-${row.holding.code}`}
              keepReturn={studentName !== undefined}
              className={styles["stockLink"]}
            >
              <StockName
                code={row.holding.code}
                withCompanyName={false}
                detail={
                  <span className={styles["rowPrice"]}>
                    <span>
                      <NumberText>
                        {home.lotShares === undefined
                          ? shareCount(row.holding.shares)
                          : lotCount(lots(row.holding.shares / home.lotShares))}
                      </NumberText>
                    </span>
                    <span aria-hidden>·</span>
                    <HomeHoldingPrice
                      holding={row.holding}
                      sharedTime={sharedTime}
                      failed={
                        home.report.quoteAttempt?.failedCodes.includes(
                          row.holding.code,
                        ) ?? false
                      }
                    />
                  </span>
                }
              />
            </StockPageLink>
            <div className={styles["rowValue"]}>
              {row.holding.kind === "priced" && (
                <>
                  <strong>
                    <NumberText>{formatRupiah(row.holding.value)}</NumberText>
                  </strong>
                  <ChangeText
                    colored
                    change={formatSignedRupiah(row.holding.gain)}
                  />
                </>
              )}
            </div>
            <div className={styles["rowWeight"]}>
              <WeightMark value={row.weight} maximum={maximumWeight} />
            </div>
            <div className={styles["rowGain"]}>
              {row.holding.kind === "priced" && (
                <>
                  <ChangeText
                    colored
                    change={formatSignedPercent(row.holding.gainReturn)}
                  />
                  <GainMark value={row.holding.gain} maximum={maximumGain} />
                </>
              )}
            </div>
          </li>
        ))}
        <li className={styles["holdingRow"]}>
          <CashName note={cashNote} cash={home.report.valuation.cash} />
          <strong className={styles["rowValue"]}>
            <NumberText>{formatRupiah(home.report.valuation.cash)}</NumberText>
          </strong>
          <div className={styles["rowWeight"]}>
            <WeightMark value={values.cashWeight} maximum={maximumWeight} />
          </div>
        </li>
      </ul>
      <div className={styles["tableNote"]}>
        {sharedTime !== undefined && (
          <SharedQuoteTimeNotice time={sharedTime} />
        )}
        <p>{m.trading_home_average_notice()}</p>
      </div>
    </section>
  );
}
