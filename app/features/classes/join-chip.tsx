import { useId, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import chipStyles from "~/chip.module.css";
import { m } from "~/paraglide/messages.js";
import { Popover } from "~/popover";
import { useIsInBrowser } from "~/charts/use-is-in-browser";
import { JoinDetails } from "./join-details";
import styles from "./join-chip.module.css";

/** The address must stay available without JavaScript or the clipboard, so copying only enhances the native popover. */
export function JoinChip({
  details,
}: {
  details: ComponentProps<typeof JoinDetails>;
}): ReactNode {
  const popoverId = `class-join-${useId().replaceAll(/[^a-zA-Z0-9_-]/g, "")}`;
  const [notice, setNotice] = useState("");
  const isInBrowser = useIsInBrowser();
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(details.joinCode);
      setNotice(m.classes_join_copied_notice({ code: details.joinCode }));
    } catch {
      setNotice(m.classes_join_copy_failed_notice());
    }
  };
  return (
    <>
      <button
        type="button"
        className={chipStyles["chip"]}
        popoverTarget={popoverId}
        style={{ anchorName: `--${popoverId}` }}
        data-join-code={details.joinCode}
        aria-label={
          isInBrowser
            ? m.classes_join_chip_label({ code: details.joinCode })
            : m.classes_join_view_label({ code: details.joinCode })
        }
        onClick={() => {
          void copy();
        }}
      >
        {m.classes_join_chip_title()}{" "}
        <b className={styles["code"]}>{details.joinCode}</b>
        {isInBrowser && (
          <svg
            className={styles["copyIcon"]}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden
          >
            <path d="M8 8h12v13H8ZM4 16H3V3h13v1" />
          </svg>
        )}
      </button>
      <Popover
        id={popoverId}
        label={m.classes_join_chip_title()}
        placement="belowEnd"
      >
        <div className={styles["details"]} data-class-join-details>
          <JoinDetails {...details} />
          {isInBrowser && (
            <button
              type="button"
              className={styles["copy"]}
              onClick={() => {
                void copy();
              }}
            >
              {m.classes_join_copy_label()}
            </button>
          )}
          <p role="status">{notice}</p>
        </div>
      </Popover>
    </>
  );
}
