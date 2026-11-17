import { themeCookieName, themeLifetimeDays } from "~/features/theme/theme";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { lastClassLifetimeDays } from "~/features/classes/class-rules";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import {
  addressWindowMinutes,
  passwordLimits,
  sessionInactivityDays,
} from "./account-limits";
import styles from "./privacy-notice.module.css";

/** What Portolab stores about a person, who sees it, and the rights of the person, which a person agrees to before Portolab serves them. */
export function PrivacyNotice(): ReactNode {
  return (
    <>
      <p>{m.accounts_privacy_intro_body()}</p>
      <h2>{m.accounts_privacy_stored_title()}</h2>
      <ul className={styles["list"]}>
        <li>{m.accounts_privacy_username_body()}</li>
        <li>{m.accounts_privacy_name_body()}</li>
        <li>{m.accounts_privacy_password_body()}</li>
        <li>{m.accounts_privacy_classes_body()}</li>
        <li>{m.accounts_privacy_watchlist_body()}</li>
        <li>{m.accounts_privacy_consent_body()}</li>
        <li>
          <NumberText>
            {m.accounts_privacy_session_body({
              days: formatNumber(sessionInactivityDays),
            })}
          </NumberText>
        </li>
        <li>
          <NumberText>
            {m.accounts_privacy_attempts_body({
              minutes: formatNumber(passwordLimits.byUsername.windowMinutes),
            })}
          </NumberText>
        </li>
        <li>
          <NumberText>
            {m.accounts_privacy_address_body({
              minutes: formatNumber(addressWindowMinutes),
            })}
          </NumberText>
        </li>
        <li>{m.accounts_privacy_language_body()}</li>
        <li>
          <NumberText>
            {m.accounts_privacy_theme_body({
              cookie: themeCookieName,
              days: formatNumber(themeLifetimeDays),
            })}
          </NumberText>
        </li>
        <li>{m.accounts_privacy_ticket_draft_body()}</li>
        <li>
          <NumberText>
            {m.accounts_privacy_last_class_body({
              days: formatNumber(lastClassLifetimeDays),
            })}
          </NumberText>
        </li>
      </ul>
      <p>{m.accounts_privacy_not_stored_body()}</p>
      <h2>{m.accounts_privacy_access_title()}</h2>
      <p>{m.accounts_privacy_lecturer_body()}</p>
      <p>{m.accounts_privacy_server_body()}</p>
      <h2>{m.accounts_privacy_rights_title()}</h2>
      <p>
        <NumberText>{m.accounts_privacy_rights_body()}</NumberText>
      </p>
    </>
  );
}
