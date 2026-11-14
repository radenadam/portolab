import type { ReactNode } from "react";
import { Link } from "react-router";
import { AppIcon } from "./app-icon";
import chipStyles from "./chip.module.css";
import styles from "./frame.module.css";
import { formatMarketTime } from "./formatting";
import { Icon } from "./icon";
import type { IconName } from "./icon";
import { initialsOf } from "./initials-of";
import { m } from "./paraglide/messages.js";
import { Popover, PopoverButton } from "./popover";

/** An item of the navigation of the frame, with whether it is the current item: the item of the page, or of the nearest page above it. */
export interface FrameItem {
  path: string;
  label: string;
  icon: IconName;
  isCurrent: boolean;
}

/** The person who is signed in, whose name the frame shows and whose menu it opens. */
export interface FrameProfile {
  name: string;
  /** The items of the menu of the profile, which the frame shows in a popover beside each button that opens it. */
  menu: ReactNode;
}

interface FrameProps {
  items: readonly FrameItem[];
  /** The part at the start of the top bar, such as the switcher of the class of the workspace, or undefined outside a workspace, where a phone shows the app icon with the name of Portolab instead. */
  start: ReactNode | undefined;
  /** Undefined for a visitor and for a person who has not finished setting up the account. */
  profile: FrameProfile | undefined;
  /** The controls that the top bar shows before the badge of the simulation, such as the language of a visitor. */
  tools: ReactNode;
  /** The badge of the simulation, with the card that it opens. */
  badge: ReactNode;
  children: ReactNode;
}

// Each place that opens the menu of the profile has a popover of its own, so the menu opens beside the button that the reader chose.
const railProfileId = "rail-profile";
const topProfileId = "top-profile";

/** The frame of every page, as decision 0028 sets it: on a desktop, the rail with the app icon, the items, and the profile at its foot, beside the top bar. On a phone, the top bar and the tab bar with the items of the rail. The content stays in the middle of the screen beyond its largest width. */
export function Frame({
  items,
  start,
  profile,
  tools,
  badge,
  children,
}: FrameProps): ReactNode {
  const profileLabel =
    profile === undefined ? "" : m.app_profile_label({ name: profile.name });
  const initials = profile === undefined ? "" : initialsOf(profile.name);
  return (
    <>
      <a href="#main" className={styles["skip"]}>
        {m.app_skip_link()}
      </a>
      <div className={styles["shell"]}>
        <nav aria-label={m.app_navigation_label()} className={styles["rail"]}>
          <Link to="/" aria-label={m.app_name()} className={styles["railIcon"]}>
            <AppIcon />
          </Link>
          <ItemList items={items} placement="rail" />
          {profile !== undefined && (
            <div className={styles["railFoot"]}>
              <PopoverButton
                popover={railProfileId}
                label={profileLabel}
                className={styles["avatarButton"]}
              >
                <Avatar initials={initials} />
              </PopoverButton>
              <Popover
                id={railProfileId}
                label={m.app_profile_title()}
                placement="aboveStart"
              >
                {profile.menu}
              </Popover>
            </div>
          )}
        </nav>
        <div className={styles["body"]}>
          <header className={styles["topBar"]}>
            <div className={styles["topBarContent"]} data-layout="content">
              {start ?? (
                <Link to="/" className={styles["mark"]}>
                  <AppIcon />
                  {m.app_name()}
                </Link>
              )}
              <div className={styles["topBarEnd"]}>
                {tools}
                {profile !== undefined && (
                  <span className={styles["nameChip"]}>
                    <PopoverButton
                      popover={topProfileId}
                      label={profileLabel}
                      className={chipStyles["chip"]}
                    >
                      <span className={chipStyles["text"]}>{profile.name}</span>
                    </PopoverButton>
                  </span>
                )}
                {badge}
                {profile !== undefined && (
                  <>
                    <PopoverButton
                      popover={topProfileId}
                      label={profileLabel}
                      className={styles["topAvatarButton"]}
                    >
                      <Avatar initials={initials} />
                    </PopoverButton>
                    <Popover
                      id={topProfileId}
                      label={m.app_profile_title()}
                      placement="belowEnd"
                    >
                      {profile.menu}
                    </Popover>
                  </>
                )}
              </div>
            </div>
          </header>
          <main
            id="main"
            tabIndex={-1}
            className={classNames(
              styles["main"],
              items.length > 0 && styles["mainAboveTabBar"],
            )}
          >
            <div className={styles["page"]} data-layout="content">
              {children}
            </div>
          </main>
        </div>
        {items.length > 0 && (
          <nav
            aria-label={m.app_navigation_label()}
            className={styles["tabBar"]}
          >
            <ItemList items={items} placement="tabBar" />
          </nav>
        )}
      </div>
    </>
  );
}

/** The picture of the person who is signed in, a circle with the initials of the name. The name of its button says whose profile it opens, so the picture is drawn by its style and stays out of that name, as an image would. */
function Avatar({ initials }: { initials: string }): ReactNode {
  return <span className={styles["avatar"]} data-initials={initials} />;
}

/** The items of the navigation, which the rail of a desktop and the tab bar of a phone each show with the icon above the label. */
function ItemList({
  items,
  placement,
}: {
  items: readonly FrameItem[];
  placement: "rail" | "tabBar";
}): ReactNode {
  const listStyles = {
    rail: { list: styles["railItems"], item: styles["railItem"] },
    tabBar: { list: styles["tabItems"], item: styles["tabItem"] },
  }[placement];
  if (items.length === 0) {
    return undefined;
  }
  return (
    <ul className={listStyles.list}>
      {items.map((item) => (
        <li key={item.path}>
          <Link
            to={item.path}
            aria-current={item.isCurrent ? "page" : undefined}
            className={listStyles.item}
          >
            <Icon name={item.icon} className={styles["itemIcon"]} />
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
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
