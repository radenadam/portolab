import type { ReactNode } from "react";
import type { tradingHoursOn } from "~/features/market-data/idx-calendar";
import { formatMarketClock, formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { wibMoment } from "~/wib";
import styles from "./session-timeline.module.css";

export function SessionTimeline({
  hours,
  date,
}: {
  hours: Extract<ReturnType<typeof tradingHoursOn>, { ok: true }>["value"];
  date: string;
}): ReactNode {
  const rows = [
    { label: m.learning_weekdays_label(), sessions: hours.mondayToThursday },
    { label: m.learning_friday_label(), sessions: hours.friday },
  ];
  const duration = hours.sessionEndMinute - hours.sessionStartMinute;
  return (
    <div className={styles["timeline"]}>
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <div className={styles["track"]} aria-hidden="true">
            {[
              {
                startMinute: hours.sessionStartMinute,
                endMinute: row.sessions[0].startMinute,
              },
              {
                startMinute:
                  row.sessions.at(-1)?.endMinute ?? hours.sessionEndMinute,
                endMinute: hours.sessionEndMinute,
              },
            ].map((span) => (
              <div
                key={span.startMinute}
                className={styles["auction"]}
                style={{
                  left:
                    String(
                      ((span.startMinute - hours.sessionStartMinute) /
                        duration) *
                        100,
                    ) + "%",
                  width:
                    String(
                      ((span.endMinute - span.startMinute) / duration) * 100,
                    ) + "%",
                }}
              />
            ))}
            {row.sessions.map((session, index) => (
              <div
                key={session.startMinute}
                style={{
                  left: `${String(((session.startMinute - hours.sessionStartMinute) / duration) * 100)}%`,
                  width: `${String(((session.endMinute - session.startMinute) / duration) * 100)}%`,
                }}
              >
                {m.learning_session_number_label({
                  number: formatNumber(index + 1),
                })}
              </div>
            ))}
          </div>
          <div className={styles["sessionTimes"]}>
            {row.sessions.map((session, index) => (
              <span key={session.startMinute}>
                <NumberText whole>
                  {m.learning_session_hours_label({
                    session: formatNumber(index + 1),
                    start: formatMarketClock(
                      wibMoment(date, session.startMinute),
                    ),
                    end: formatMarketClock(wibMoment(date, session.endMinute)),
                  })}
                </NumberText>
              </span>
            ))}
          </div>
        </div>
      ))}
      <p>
        <NumberText>
          {m.learning_auction_hours_notice({
            start: formatMarketClock(wibMoment(date, hours.sessionStartMinute)),
            close: formatMarketClock(
              wibMoment(date, hours.closingAuctionStartMinute),
            ),
            end: formatMarketClock(wibMoment(date, hours.sessionEndMinute)),
          })}
        </NumberText>
      </p>
    </div>
  );
}
