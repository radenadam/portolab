import type { ReactNode } from "react";
import chipStyles from "~/chip.module.css";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
import { LanguageSwitch } from "./language-switch";
import styles from "./language-switch.module.css";

const languageMenuId = "language-menu";

/** The chip that opens the switch of the language in the top bar of a person without the menu of a profile, such as a visitor who is not signed in. */
export function LanguageMenu(): ReactNode {
  return (
    <>
      <PopoverButton popover={languageMenuId} className={chipStyles["chip"]}>
        <Icon name="globe" className={styles["menuIcon"]} />
        {m.language_switch_label()}
      </PopoverButton>
      <Popover
        id={languageMenuId}
        label={m.language_switch_label()}
        placement="belowEnd"
      >
        <div className={styles["menu"]}>
          <LanguageSwitch />
        </div>
      </Popover>
    </>
  );
}
