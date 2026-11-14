import { useId } from "react";
import type { ReactNode } from "react";
import { Form, useLocation } from "react-router";
import { m } from "~/paraglide/messages.js";
import { languageNames } from "~/language-names";
import { getLocale, locales } from "~/paraglide/runtime.js";
import styles from "./language-switch.module.css";

/** The switch of the language, which sends the chosen language and returns to the same page, also before JavaScript loads. A page can hold it more than once, such as in the menu of the profile and on the page of the language. */
export function LanguageSwitch(): ReactNode {
  const location = useLocation();
  const currentLocale = getLocale();
  const labelId = useId();
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
      <span id={labelId} className={styles["label"]}>
        {m.language_switch_label()}
      </span>
      <div role="group" aria-labelledby={labelId} className={styles["options"]}>
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
