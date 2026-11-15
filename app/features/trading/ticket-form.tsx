import { useIsInBrowser } from "~/use-is-in-browser";
import { TicketKind } from "./ticket-kind";
import { ChangeText } from "~/change-text";
import { quoteChange } from "~/features/market-data/quote-change";
import { TicketPrice } from "./ticket-price";
import { TicketLots } from "./ticket-lots";
import { TicketBreakdown } from "./ticket-breakdown";
import { useTicketDraft } from "./use-ticket-draft";
import type { TicketDraft } from "./use-ticket-draft";
import type { ReactNode } from "react";
import { Form, useNavigate } from "react-router";
import { pathWithQuery } from "~/path-with-query";
import { CompanyTile } from "~/features/market-data/stock-name";
import {
  formatMarketTime,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { SubmitButton } from "~/form";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { lotCount } from "./count-parts";
import type { OrderSide } from "./order";
import type { OrderRejection } from "./order-actions.server";
import { sideOptions, orderSideLabel } from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import { orderFailureText } from "./order-failure-text";
import type { readTicket } from "./read-ticket.server";
import styles from "./ticket.module.css";
import type { Rupiah } from "~/units/rupiah";

export function TicketForm({
  code,
  side: initialSide,
  path,
  search,
  ticket,
  fields,
  rejection,
  limitSteps,
  restoreDraft,
}: {
  code: string;
  side: OrderSide;
  path: string;
  search: string;
  ticket: ReturnType<typeof readTicket>;
  fields: OrderFormFields;
  rejection: OrderRejection | undefined;
  limitSteps: readonly Rupiah[] | undefined;
  restoreDraft: boolean;
}): ReactNode {
  const { day, quote } = ticket;
  if (!day.ok) return <p>{orderFailureText(day.failure)}</p>;
  if (quote === undefined)
    return (
      <div className={styles["done"]}>
        <p>{ticket.quoteNotice}</p>
        <p>{m.trading_no_price_order_notice({ code })}</p>
      </div>
    );
  return (
    <TicketFields
      code={code}
      side={initialSide}
      path={path}
      search={search}
      ticket={{ ...ticket, day, quote }}
      fields={fields}
      rejection={rejection}
      limitSteps={limitSteps}
      restoreDraft={restoreDraft}
    />
  );
}

function TicketFields(
  props: Parameters<typeof useTicketDraft>[0] & {
    code: string;
    rejection: OrderRejection | undefined;
    limitSteps: readonly Rupiah[] | undefined;
  },
): ReactNode {
  const isInBrowser = useIsInBrowser();
  const navigate = useNavigate();
  const { formRef, ...draft } = useTicketDraft(props);
  const { values, side, action, amounts, count, ticket } = draft;
  const { quote } = ticket;
  const failure = ticketFailures(draft, props.rejection);
  return (
    <Form
      ref={formRef}
      method="post"
      action={action}
      className={styles["form"]}
      data-side={side}
      data-ticket-ready={isInBrowser}
    >
      <input type="hidden" name="seenTotal" value={amounts?.total ?? ""} />
      <div className={styles["phoneQuote"]}>
        <CompanyTile code={props.code} small />
        <strong>
          <NumberText>{formatRupiah(quote.price)}</NumberText>
        </strong>
        <ChangeText colored change={formatSignedPercent(quoteChange(quote))} />
        <span className={styles["muted"]}>
          <NumberText whole>
            {m.trading_ticket_quote_notice({
              time: formatMarketTime(quote.quotedAt),
            })}
          </NumberText>
        </span>
      </div>
      {ticket.quoteNotice !== undefined && (
        <p className={styles["muted"]}>
          <NumberText>{ticket.quoteNotice}</NumberText>
        </p>
      )}
      {failure.general !== undefined && (
        <p role="alert" className={styles["issue"]}>
          <NumberText>{failure.general}</NumberText>
        </p>
      )}
      <nav className={styles["segments"]} aria-label={m.trading_side_label()}>
        {sideOptions().map(({ value, label }) => (
          <a
            key={value}
            href={pathWithQuery(`${props.path}/${value}${props.search}`, {
              lots: values.lots,
              price: values.limit,
              priceKind: values.priceKind,
            })}
            data-selected={side === value}
            data-side={value}
            onClick={(event) => {
              event.preventDefault();
              draft.chooseSide(value, event.currentTarget.closest("form"));
              void navigate(`${props.path}/${value}${props.search}`, {
                preventScrollReset: true,
              });
            }}
          >
            {label}
          </a>
        ))}
      </nav>
      <TicketKind draft={draft} />
      <TicketPrice
        draft={draft}
        steps={draft.unchanged ? props.limitSteps : undefined}
      />
      <TicketLots draft={draft} rejection={failure.lots} />
      <TicketBreakdown draft={draft} />
      <section className={styles["section"]}>
        <label className={styles["label"]} htmlFor="ticket-reason">
          {m.trading_reason_label()}
        </label>
        <textarea
          id="ticket-reason"
          name="reason"
          rows={3}
          placeholder={reasonPlaceholder(side, props.code)}
          value={values.reason}
          onChange={(event) => {
            draft.change(
              "reason",
              event.target.value,
              event.currentTarget.form,
            );
          }}
          aria-invalid={values.reasonFailure !== undefined}
          aria-describedby="ticket-reason-hint ticket-reason-failure"
        />
        <p id="ticket-reason-hint" className={styles["muted"]}>
          {m.trading_reason_hint()}
        </p>
        <p
          id="ticket-reason-failure"
          className={styles["issue"]}
          hidden={values.reasonFailure === undefined}
        >
          {values.reasonFailure}
        </p>
      </section>
      <footer className={styles["confirm"]} data-side={side}>
        <SubmitButton
          className={styles["submit"]}
          label={
            amounts !== undefined && count !== undefined
              ? m.trading_ticket_confirm_label({
                  side: orderSideLabel(side),
                  lots: lotCount(count),
                  total: formatRupiah(amounts.total),
                })
              : m.trading_place_label()
          }
        />
      </footer>
    </Form>
  );
}

function ticketFailures(
  draft: TicketDraft,
  rejection: OrderRejection | undefined,
) {
  const submitted = draft.unchanged ? rejection : undefined;
  const lots = submitted?.field === "lots" ? submitted : undefined;
  let general = lots === undefined ? submitted?.text : undefined;
  if (
    general === undefined &&
    draft.values.priceKind === "limit" &&
    draft.ticket.range?.ok === false
  )
    general = orderFailureText(draft.ticket.range.failure);
  return { lots, general };
}

function reasonPlaceholder(side: OrderSide, code: string): string {
  switch (side) {
    case "buy":
      return m.trading_ticket_buy_reason_hint({ code });
    case "sell":
      return m.trading_ticket_sell_reason_hint({ code });
  }
}
