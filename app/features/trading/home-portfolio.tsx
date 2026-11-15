import { textForReader, portfolioStudentName } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { estimatedLabelWidth } from "~/charts/estimated-label-width";
import { homeTitle } from "./home-title";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  formatList,
  formatRupiah,
  formatCalendarDate,
  formatRupiahParts,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { countedText } from "~/counted-text";
import { m } from "~/paraglide/messages.js";
import { holdingQuoteFailureText } from "./holding-quote-failure-text";
import { homeHoldings } from "./home-holdings";
import { HomeHoldingsSection } from "./home-holdings-section";
import { ConceptHelp } from "~/concept-card";
import { HomeReturn } from "./home-return";
import { HomeRisk } from "./home-risk";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import { wibDateOf } from "~/wib";
import { dayChangeFailureText } from "./day-change-failure-text";
import styles from "./home-portfolio.module.css";
import { HomeMapPanel } from "./home-map-panel";

/** The summary stays together so the class map can join it as the other column. */
export function HomePortfolio({
  home,
  classId,
  reader,
}: {
  home: HomePortfolioData;
  classId: ClassId;
  reader: PortfolioReader;
}): ReactNode {
  const { report, now, delayMinutes } = home;
  const values = homeHoldings(report.valuation);
  const dayChange = home.dayChange;
  const changeLabel =
    dayChange.ok && dayChange.value.date !== wibDateOf(now)
      ? m.trading_home_change_date_label({
          date: formatCalendarDate(dayChange.value.date, "medium"),
        })
      : m.trading_home_today_label();
  const changeFailure = dayChange.ok
    ? undefined
    : dayChangeFailureText(dayChange.failure, reader);
  const failure = holdingQuoteFailureText([report], {
    now,
    delayMinutes,
  });
  return (
    <div className={styles["home"]} data-reader={reader.kind}>
      {reader.kind === "owner" && (
        <h1 className={styles["screenTitle"]}>{homeTitle()}</h1>
      )}
      <div className={styles["columns"]} data-layout="columns">
        <div className={styles["leftColumn"]}>
          <div className={styles["summary"]}>
            <section className={styles["hero"]}>
              <div className={styles["valueLabel"]}>
                <h2 className={styles["valueLabel"]}>
                  <NumberText verbatim>
                    {textForReader(reader, {
                      owner: m.trading_home_value_title,
                      lecturer: (name) =>
                        m.trading_home_student_value_title({ name }),
                    })}
                  </NumberText>
                </h2>
                <ConceptHelp title={m.trading_home_value_title()}>
                  <p>{m.trading_home_value_body()}</p>
                </ConceptHelp>
              </div>
              {report.valuation.total === undefined ? (
                <p>
                  <NumberText>
                    {countedText(
                      report.valuation.unpricedCodes.length,
                      {
                        one: m.trading_one_unpriced_holding_notice,
                        several: m.trading_several_unpriced_holdings_notice,
                      },
                      {
                        codes: formatList(
                          report.valuation.unpricedCodes,
                          "conjunction",
                        ),
                      },
                    )}
                  </NumberText>
                </p>
              ) : (
                <p
                  className={styles["value"]}
                  style={{
                    fontSize: `min(var(--text-headline), calc(100cqi / ${String(estimatedLabelWidth(formatRupiah(report.valuation.total.value)))}))`,
                  }}
                >
                  <NumberText whole>
                    {formatRupiahParts(report.valuation.total.value).map(
                      (part) =>
                        part.type === "currency" ? (
                          <small key={part.type}>{part.value}</small>
                        ) : (
                          part.value
                        ),
                    )}
                  </NumberText>
                </p>
              )}
              {dayChange.ok && (
                <div className={styles["today"]}>
                  <span className={styles["pill"]}>
                    <ChangeText
                      colored
                      change={formatSignedRupiah(dayChange.value.amount)}
                    />
                  </span>
                  <span className={styles["pill"]}>
                    <ChangeText
                      colored
                      change={formatSignedPercent(dayChange.value.return)}
                    />
                  </span>
                  <span className={styles["changeExplanation"]}>
                    <span>
                      <NumberText>{changeLabel}</NumberText>
                    </span>
                    <ConceptHelp title={m.trading_home_daily_title()}>
                      <p>
                        <NumberText>
                          {m.trading_home_today_body({
                            date: formatCalendarDate(
                              dayChange.value.referenceDate,
                            ),
                          })}
                        </NumberText>
                      </p>
                    </ConceptHelp>
                  </span>
                </div>
              )}
              {changeFailure !== undefined && (
                <p className={styles["note"]}>
                  <NumberText>{changeFailure}</NumberText>
                </p>
              )}
              {failure !== undefined && (
                <p className={styles["note"]}>
                  <NumberText>{failure}</NumberText>
                </p>
              )}
            </section>
          </div>
          <div className={styles["returnCard"]}>
            <HomeReturn history={report.history} reader={reader} />
          </div>
          <div className={styles["riskCard"]}>
            <HomeRisk
              report={home.measures}
              classId={classId}
              reader={reader}
            />
          </div>
        </div>
        <HomeMapPanel home={home} classId={classId} reader={reader} />
      </div>
      <HomeHoldingsSection
        home={home}
        values={values}
        classId={classId}
        studentName={portfolioStudentName(reader)}
      />
    </div>
  );
}
