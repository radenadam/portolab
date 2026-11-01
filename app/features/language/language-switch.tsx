import type { ReactNode } from "react";
import { Form, useLocation } from "react-router";
import { m } from "~/paraglide/messages.js";
import { languageNames } from "~/language-names";
import { getLocale, locales } from "~/paraglide/runtime.js";
import styles from "./language-switch.module.css";

export function LanguageSwitch(): ReactNode {
  const location = useLocation();
  const currentLocale = getLocale();
  return (
    <Form
      method="post"
      action="/language"
      reloadDocument
      className={styles["switch"]}
    >
      <input
        type="hidden"
        name="returnTo"
        value={location.pathname + location.search}
      />
      <span id="language-switch-label">{m.language_switch_label()}</span>
      <div
        role="group"
        aria-labelledby="language-switch-label"
        className={styles["options"]}
      >
        {locales.map((locale) => (
          <button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            lang={locale}
            aria-pressed={locale === currentLocale}
            className={styles["option"]}
          >
            {languageNames[locale]}
          </button>
        ))}
      </div>
    </Form>
  );
}
