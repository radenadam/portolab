import { smallestOrderLots } from "~/units/lots";
import { CompanyTile } from "~/features/market-data/stock-name";
import { NumberText } from "~/number-text";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { data, Link, useNavigate } from "react-router";
import { databaseContext } from "~/database/database.server";
import { stockPath } from "~/features/market-data/stock-path";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { formatMarketTime, formatNumber } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { parseRecordId } from "~/value-parsers";
import {
  blankOrderForm,
  parseOrderSide,
  parseStockCode,
  readOrderForm,
  typedOrderForm,
} from "./order-form-fields";
import type { OrdersAnswer } from "./order-actions.server";
import { placeFromForm } from "./order-actions.server";
import { findStudentPlace } from "./find-student-place.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { readTicket } from "./read-ticket.server";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";
import { TicketForm } from "./ticket-form";
import { TicketDone } from "./ticket-done";
import type { OrderId } from "./trading.schema";
import type { Route } from "./+types/ticket-page";
import styles from "./ticket.module.css";
import { ticketContextSearch } from "./ticket-context-search";
import { readImpactSelection } from "./read-impact-selection.server";
import { TradeImpactSelectionForm } from "./trade-impact-selection-form";

function ticketAddress(params: { code: string; side: string }) {
  const code = parseStockCode(params.code, "code", trackedStockCodes);
  const side = parseOrderSide(params.side, "side");
  if (!code.ok || !side.ok) throw data(null, { status: 404 });
  return { code: code.value, side: side.value };
}

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const { code, side } = ticketAddress(params);
  const { place, portfolio, source } = readStudentPortfolio(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
  const selection = readImpactSelection(url);
  const ticket = readTicket(context.get(databaseContext), portfolio, {
    code,
    now,
    delayMinutes: source.delayMinutes,
  });
  const form = new FormData();
  for (const name of ["lots", "limit", "priceKind"]) {
    form.set(
      name,
      url.searchParams.get(name === "limit" ? "price" : name) ??
        {
          lots: formatNumber(smallestOrderLots),
          limit:
            ticket.quote === undefined ? "" : formatNumber(ticket.quote.price),
          priceKind: "market",
        }[name] ??
        "",
    );
  }
  const parsed = ticket.day.ok
    ? readOrderForm(form, {
        code,
        side,
        maximumLots: ticket.day.value.rules.maximumLots,
        placedAt: now,
        unknownPriceKind: m.trading_activity_unknown_choice_error,
      })
    : undefined;
  const fields =
    parsed?.ok === false
      ? parsed.failure
      : { ...blankOrderForm, ...typedOrderForm(form) };
  const placed = parseRecordId<OrderId>(
    url.searchParams.get("placed"),
    "placed",
  );
  const order = placed.ok
    ? portfolio.orders.find(
        (candidate) =>
          candidate.id === placed.value &&
          candidate.code === code &&
          candidate.side === side,
      )
    : undefined;
  return data(
    {
      classId: place.classId,
      code,
      side,
      ticket,
      selection,
      fields,
      order,
      now,
      restoreDraft: !["lots", "price", "priceKind"].some((name) =>
        url.searchParams.has(name),
      ),
      search: ticketContextSearch(url.searchParams),
    },
    {
      status:
        selection.fields !== undefined
          ? 400
          : ticketStatus(ticket, {
              invalid: parsed?.ok === false,
              isLimit: fields.priceKind === "limit",
            }),
    },
  );
}

function ticketStatus(
  ticket: ReturnType<typeof readTicket>,
  { invalid, isLimit }: { invalid: boolean; isLimit: boolean },
): number {
  if (!ticket.day.ok || ticket.quote === undefined) return 503;
  if (isLimit && ticket.range?.ok === false) return 503;
  return invalid ? 400 : 200;
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    { title: pageTitle(m.trading_ticket_title({ code: loaderData.code })) },
  ];
}

export async function action({
  context,
  request,
  params,
  url,
}: Route.ActionArgs): Promise<
  Response | ReturnType<typeof data<OrdersAnswer>>
> {
  const now = new Date();
  const place = findStudentPlace(context, url, params.classId);
  const { code, side } = ticketAddress(params);
  const form = await request.formData();
  return placeFromForm(context, {
    form,
    place,
    now,
    code,
    side,
    ticketPath: `${stockPath(place.classId, code)}/${side}${ticketContextSearch(url.searchParams)}`,
  });
}

export const shouldRevalidate = reloadsAfterEveryForm;

export default function TicketPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, code, side, ticket, order, now } = loaderData;
  const stockPagePath = stockPath(classId, code);
  const closePath = `${stockPagePath}${loaderData.search}`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sideRef = useRef(side);
  const navigate = useNavigate();
  useEffect(() => {
    sideRef.current = side;
  }, [side]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const narrow = window.matchMedia("(width < 73.75rem)");
    const resize = () => {
      if (narrow.matches) {
        if (!dialog.matches(":modal")) {
          dialog.close();
          dialog.showModal();
        }
      } else if (dialog.matches(":modal") || !dialog.open) {
        dialog.close();
        dialog.show();
      }
    };
    resize();
    narrow.addEventListener("change", resize);
    return () => {
      narrow.removeEventListener("change", resize);
      dialog.close();
      queueMicrotask(() => {
        document
          .querySelector<HTMLElement>(`[data-stock-trade="${sideRef.current}"]`)
          ?.focus({ preventScroll: true });
      });
    };
  }, []);
  if (loaderData.selection.fields !== undefined)
    return <TradeImpactSelectionForm fields={loaderData.selection.fields} />;
  return (
    <div className={styles["column"]}>
      <dialog
        open
        ref={dialogRef}
        className={styles["ticket"]}
        aria-labelledby="ticket-title"
        data-side={side}
        onCancel={(event) => {
          event.preventDefault();
          void navigate(closePath, { preventScrollReset: true });
        }}
      >
        <header className={styles["head"]}>
          <CompanyTile code={code} small />
          <h2 id="ticket-title">
            <span className={styles["desktopTitle"]}>
              {m.trading_ticket_title({ code })}
            </span>
            <span className={styles["buyTitle"]}>
              {m.trading_ticket_side_title({
                side: m.trading_buy_label(),
                code,
              })}
            </span>
            <span className={styles["sellTitle"]}>
              {m.trading_ticket_side_title({
                side: m.trading_sell_label(),
                code,
              })}
            </span>
          </h2>
          {ticket.quote !== undefined && (
            <span className={styles["desktopTime"]}>
              <NumberText whole>
                {m.trading_ticket_quote_notice({
                  time: formatMarketTime(ticket.quote.quotedAt),
                })}
              </NumberText>
            </span>
          )}
          <Link
            to={closePath}
            preventScrollReset
            aria-label={m.trading_ticket_close_link()}
            className={styles["close"]}
          >
            ×
          </Link>
        </header>
        {order === undefined ? (
          <TicketForm
            key={`${side}:${JSON.stringify(actionData?.fields ?? loaderData.fields)}`}
            code={code}
            side={side}
            path={stockPagePath}
            search={loaderData.search}
            ticket={ticket}
            fields={actionData?.fields ?? loaderData.fields}
            rejection={actionData?.rejection}
            limitSteps={actionData?.limitSteps}
            restoreDraft={actionData === undefined && loaderData.restoreDraft}
            impactAxis={loaderData.selection.axis}
          />
        ) : (
          <TicketDone
            order={order}
            classId={classId}
            now={now}
            closePath={closePath}
          />
        )}
      </dialog>
      <span className={styles["backdrop"]} aria-hidden="true" />
    </div>
  );
}
