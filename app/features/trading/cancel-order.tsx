import type { ReactNode } from "react";
import { Form } from "react-router";
import { Popover, PopoverButton } from "~/popover";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { lotCount } from "./count-parts";
import type { StoredOrder } from "./order-rows";
import styles from "./activity.module.css";

export function CancelOrder({
  order,
  side,
}: {
  order: StoredOrder;
  side: string;
}): ReactNode {
  const id = `cancel-order-${String(order.id)}`;
  return (
    <>
      <PopoverButton popover={id} className={styles["button"]}>
        {m.trading_activity_cancel_label()}
      </PopoverButton>
      <Popover
        id={id}
        label={m.trading_activity_cancel_label()}
        placement="aboveStart"
      >
        <div className={styles["confirmation"]}>
          <p>
            <Message
              text={m.trading_activity_cancel_body}
              values={{
                side,
                lots: <NumberText>{lotCount(order.lots)}</NumberText>,
                code: order.code,
              }}
            />
          </p>
          <Form method="post">
            <input type="hidden" name="cancel" value={order.id} />
            <button className={styles["button"]} type="submit">
              {m.trading_activity_confirm_label()}
            </button>
          </Form>
          <button
            className={styles["button"]}
            type="button"
            popoverTarget={id}
            popoverTargetAction="hide"
          >
            {m.trading_activity_keep_label()}
          </button>
        </div>
      </Popover>
    </>
  );
}
