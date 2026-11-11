import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./frame.module.css";
import { formatMarketTime, formatNumber } from "./formatting";
import { m } from "./paraglide/messages.js";

/** A page in the navigation of the frame, with whether it is the current page or the nearest page above it. */
export interface FrameLink {
  path: string;
  label: string;
  isCurrent: boolean;
}

/** The link that a phone shows in place of the mark on a page below another page, to that page. */
export interface BackLink {
  path: string;
  /** The name of the page above, which the link shows. */
  label: string;
  /** The name of the link, which says that it leads back. */
  name: string;
}

interface FrameProps {
  navigation: readonly FrameLink[];
  backLink: BackLink | undefined;
  /** The link to the account and the language switch. */
  tools: ReactNode;
  /** The delay of prices and when the latest price was quoted, or undefined while the frame has no data of the root, such as on an error page whose error came first. */
  delayNotice: string | undefined;
  /** Whether a phone shows the delay under the top bar, which a page whose first part gives the delay leaves out. */
  showsDelayOnPhone: boolean;
  children: ReactNode;
}

/** The frame of every page, as decision 0026 sets it: on a desktop, the sidebar with the mark, the navigation, the account, the language, the mark of a simulation, and the delay of prices. On a phone, the top bar with the same parts and the navigation in a tab bar at the bottom. */
export function Frame({
  navigation,
  backLink,
  tools,
  delayNotice,
  showsDelayOnPhone,
  children,
}: FrameProps): ReactNode {
  return (
    <div className={styles["frame"]}>
      <header className={styles["bar"]}>
        <Link
          to="/"
          className={classNames(
            styles["mark"],
            backLink !== undefined && styles["markBesideBack"],
          )}
        >
          {m.app_name()}
        </Link>
        {backLink !== undefined && (
          <Link
            to={backLink.path}
            aria-label={backLink.name}
            className={styles["back"]}
          >
            <span aria-hidden="true">←</span>
            {backLink.label}
          </Link>
        )}
        <nav aria-label={m.app_navigation_label()} className={styles["tabs"]}>
          <ul className={styles["tabList"]}>
            {navigation.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  aria-current={link.isCurrent ? "page" : undefined}
                  className={styles["tabLink"]}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles["foot"]}>
          <div className={styles["tools"]}>{tools}</div>
          <p className={styles["pill"]}>{m.app_simulation_label()}</p>
          {delayNotice !== undefined && (
            <p
              className={classNames(
                styles["delay"],
                !showsDelayOnPhone && styles["delayOnDesktop"],
              )}
            >
              {delayNotice}
            </p>
          )}
        </div>
      </header>
      <main className={styles["main"]}>{children}</main>
    </div>
  );
}

/** The text that gives the delay of prices and when the latest price that Portolab stores was quoted. */
export function delayNoticeText(
  delayMinutes: number,
  latestQuotedAt: Date | undefined,
): string {
  const minutes = formatNumber(delayMinutes);
  return latestQuotedAt === undefined
    ? m.app_delay_without_prices_notice({ minutes })
    : m.app_delay_notice({
        minutes,
        time: formatMarketTime(latestQuotedAt),
      });
}

/** A page above the page in the header line, with the address of its page. */
export interface PathPart {
  label: string;
  path: string;
}

/** The header line that opens a page: the path of the page, which ends in its heading, and the time of the prices that it shows, which a phone leaves to the line of the delay. */
export function PageHeader({
  path,
  title,
  pricesAt,
}: {
  /** The pages above the page, starting with its class, each linking to its page. */
  path: readonly PathPart[];
  title: string;
  /** When the newest price that the page shows was quoted, or undefined for a page without prices. */
  pricesAt: Date | undefined;
}): ReactNode {
  return (
    <div className={styles["header"]}>
      <div className={styles["path"]}>
        {path.map((part) => (
          <span key={part.path} className={styles["pathPart"]}>
            <Link to={part.path} className={styles["pathLink"]}>
              {part.label}
            </Link>
            <span aria-hidden="true">/</span>
          </span>
        ))}
        <h1 className={styles["title"]}>{title}</h1>
      </div>
      {pricesAt !== undefined && (
        <p className={styles["time"]}>
          {m.app_prices_time_label({ time: formatMarketTime(pricesAt) })}
        </p>
      )}
    </div>
  );
}

/** A page with a right column beside its main column, as the order ticket stands beside the portfolio. The header line opens the main column. */
export function PageColumns({
  header,
  main,
  aside,
  narrowPlacement,
}: {
  /** The PageHeader of the page. */
  header: ReactNode;
  main: ReactNode;
  aside: ReactNode;
  /** Where a screen without room for the right column places it, as a phone does: under the header line, such as the order ticket on the page of the orders, or nowhere, such as the order ticket of the portfolio, which a phone shows on the page of the orders. */
  narrowPlacement: "first" | "hidden";
}): ReactNode {
  const asideColumn = (
    <div
      className={classNames(
        styles["aside"],
        narrowPlacement === "hidden" && styles["asideOnWide"],
      )}
    >
      {aside}
    </div>
  );
  return (
    <div className={styles["columns"]}>
      {header}
      {narrowPlacement === "first" && asideColumn}
      <div className={styles["content"]}>{main}</div>
      {narrowPlacement === "hidden" && asideColumn}
    </div>
  );
}

/** A part that a phone shows in another form than a desktop, such as rows of one kind, which are a list on a phone and a table on a desktop. Each form shows only on its screen, so a screen reader reads one of them. */
export function PhoneAndDesktop({
  phone,
  desktop,
}: {
  phone: ReactNode;
  desktop: ReactNode;
}): ReactNode {
  return (
    <>
      <div className={styles["onPhone"]}>{phone}</div>
      <div className={styles["onDesktop"]}>{desktop}</div>
    </>
  );
}

/** The classes of a CSS module that apply, leaving out those whose condition does not hold. */
function classNames(...names: (string | false | undefined)[]): string {
  return names.filter((name) => typeof name === "string").join(" ");
}
