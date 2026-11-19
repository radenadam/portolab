import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { AppIcon } from "./app-icon";
import { Avatar } from "./avatar";
import type { AvatarLook } from "./avatar";
import chipStyles from "./chip.module.css";
import styles from "./frame.module.css";
import { Icon } from "./icon";
import type { IconName } from "./icon";
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
  /** How the avatar in the name is drawn, the same as in the menu. */
  look: AvatarLook;
  /** The items of the menu of the profile, which the frame shows in a popover beside the button that opens it. */
  menu: ReactNode;
}

interface FrameProps {
  sampleClassLabel?: string | undefined;
  items: readonly FrameItem[];
  /** The part at the start of the top bar, such as the switcher of the class of the workspace, or undefined outside a workspace, where a phone shows the app icon with the name of Portolab instead. */
  start: ReactNode | undefined;
  /** Undefined for a visitor and for a person who has not finished setting up the account. */
  profile: FrameProfile | undefined;
  /** The controls that the top bar shows before the badge of the simulation, such as the language of a visitor. */
  tools: ReactNode;
  /** The badge of the simulation, with the card that it opens. */
  badge: ReactNode;
  workspaceTools?: ReactNode;
  children: ReactNode;
}

// The name of a desktop and the avatar of a phone open one popover. Only one of them shows on a screen, so the menu opens beside the one that shows.
const profileId = "top-profile";

/** The frame of every page, as decision 0028 sets it with the changes of decision 0068: on a desktop, the rail with the app icon and the items, beside the top bar, where the name of the reader opens the profile. On a phone, the top bar, where the avatar of the reader opens the profile, and the tab bar with the items of the rail. The content stays in the middle of the screen beyond its largest width. */
export function Frame({
  sampleClassLabel,
  items,
  start,
  profile,
  tools,
  badge,
  workspaceTools,
  children,
}: FrameProps): ReactNode {
  const profileLabel =
    profile === undefined ? "" : m.app_profile_label({ name: profile.name });
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
        </nav>
        <div className={styles["body"]}>
          <header className={styles["topBar"]}>
            <div className={styles["topBarContent"]} data-layout="content">
              {start ?? (
                <Link
                  to="/"
                  aria-label={m.app_name()}
                  className={styles["mark"]}
                >
                  <AppIcon />
                  <span className={styles["markName"]}>{m.app_name()}</span>
                </Link>
              )}
              <div className={styles["topBarEnd"]}>
                {tools}
                {workspaceTools !== undefined && (
                  <span className={styles["workspaceToolsWide"]}>
                    {workspaceTools}
                  </span>
                )}
                {profile !== undefined && (
                  <span className={styles["nameChip"]}>
                    <PopoverButton
                      popover={profileId}
                      label={profileLabel}
                      className={chipStyles["chip"]}
                    >
                      <Avatar
                        name={profile.name}
                        look={profile.look}
                        className={styles["chipAvatar"]}
                      />
                      <span
                        className={classNames(
                          chipStyles["text"],
                          styles["nameText"],
                        )}
                      >
                        <NumberText verbatim>{profile.name}</NumberText>
                      </span>
                    </PopoverButton>
                  </span>
                )}
                {badge}
                {profile !== undefined && (
                  <>
                    <PopoverButton
                      popover={profileId}
                      label={profileLabel}
                      className={styles["avatarButton"]}
                    >
                      <Avatar name={profile.name} look="plain" />
                    </PopoverButton>
                    <Popover
                      id={profileId}
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
          <aside
            className={styles["sampleClass"]}
            aria-label={sampleClassLabel}
            hidden={sampleClassLabel === undefined}
          >
            {sampleClassLabel}
          </aside>
          {workspaceTools !== undefined && (
            <div className={styles["workspaceToolsPhone"]}>
              {workspaceTools}
            </div>
          )}
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

/** The classes of a CSS module that apply, leaving out those whose condition does not hold. */
function classNames(...names: (string | false | undefined)[]): string {
  return names.filter((name) => typeof name === "string").join(" ");
}
