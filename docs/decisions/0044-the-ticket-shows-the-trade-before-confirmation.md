# 0044. The ticket shows the trade before confirmation

- Status: Accepted
- Date: 2026-11-15

## Context

The stock page now follows Peta, but its buy and sell links still leave the stock for the order form. That form shows no cost estimate before submission. The approved ticket keeps the stock in view and shows the costs as the student chooses an order. Forms also work before JavaScript loads, when editing a field cannot update a cost estimate.

## Decision

- A student chooses a stock by opening its page. Its buy and sell links open the ticket at the addresses of [decision 0030](0030-each-class-is-one-workspace-with-its-own-addresses.md). The ticket docks beside the stock at the desktop width of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md), and opens over it as a sheet below that width. Closing it returns to the stock. The browser keeps the stock page mounted while the ticket is open. Opening and closing keep its chart range and scroll position, and its draft stays in memory until the reader leaves the stock or confirms that side of the order.
- The ticket uses the stock and side from its address. An invalid stock or side answers with status 404. A missing quote leaves the form unavailable with status 503, its source failure, and the event that brings a quote. A missed update stays visible beside the quote that the ticket still has.
- The stock page gives the company name and sector. The ticket repeats its tile, quote time, and, on a phone, its price. This replaces the separate stock chooser and the order section of the orders page.
- The ticket shows the value, broker fee, sales tax on a sale, total, and cash available after the trade. Its calculations call the same cost functions as fills. A limit order estimates its cost at its limit, which is also the price at which a purchase reserves cash. The fill rules of [decision 0016](0016-orders-last-one-trading-day-and-fill-as-the-order-book-would.md) still apply.
- Chips, lot steppers, price steppers, and corrections are links with the draft in the query. Before JavaScript loads they open that address. After it loads they update the draft in place and keep the reason. The reason never enters the address. A new address before JavaScript loads cannot keep a reason that has not been sent.
- The form submits the total that its preview showed. Within the placement transaction the server checks the order and compares that total with the current estimate. A missing or different total returns the updated preview with status 409 and saves no new order. The student confirms again after reading it. This also covers a field edited before JavaScript loads.
- Only the confirmation button submits the order form, so Enter sends the order. Corrections are links rather than submit buttons. This follows the form standard already adopted in `AGENTS.md` and resolves the incident behind candidate standard #124.
- An accepted order stays in the ticket as a short success state. It shows the side in its trade color, the fill when it has one, or the session start and expiry of the actual order. It links to Aktivitas at its address in decision 0030. Cancelling an order belongs to Aktivitas and returns there. The old orders address answers with status 404, as decision 0030 requires when a screen moves.
- The portfolio impact section comes with piece 20 of issue #127. It fits between the breakdown and reason without changing the submission or sheet.

## Alternatives

- Keep the form on the orders page. A student would still leave the stock and could submit without seeing the cost.
- Require a separate preview request for every order. It works before JavaScript loads but adds a confirmation step even when the displayed estimate is current.
- Update the estimate only in the browser. A form edited before JavaScript loads could place a different trade from the one its preview showed.

## Consequences

The server remains the authority for validation. The browser only estimates quantities and costs. Orders keep the optional reason and visibility of [decision 0033](0033-a-student-may-write-the-reason-of-an-order-which-the-lecturer-reads.md). The staged lesson fallback of decision 0030 still applies until piece 31 keeps lessons over the ticket.
