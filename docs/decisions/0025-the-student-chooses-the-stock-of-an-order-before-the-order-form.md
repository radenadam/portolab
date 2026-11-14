# 0025. The student chooses the stock of an order before the order form

- Status: Accepted. [Decision 0030](0030-each-class-is-one-workspace-with-its-own-addresses.md) changes one of its rules: which address names the stock of an order, once the change of issue #127 that builds the order ticket lands.
- Date: 2026-11-11

## Context

A student who places an order needs the latest delayed price of its stock to choose the lots and the limit price, as a broker's app shows it beside the order form, and issue #69 asks for it. The order screen offered every field of an order in one form, with a link to the prices page, so a student on a phone switched between two pages to place one order. Every form of Portolab works before JavaScript loads, so the server must know the stock before the page can show its price. Every screen that shows a price says when it was quoted and whether the latest update missed it, which takes more room than a line of text.

## Decision

- The section for a new order first offers a form that chooses a stock. It sends the stock in the address of the orders, such as `?code=BBCA`, so the page shows the latest delayed price of the stock with its change from the previous close, the time of its quote, and the notice when the latest update missed it, also before JavaScript loads.
- With a stock in its address, the section shows the stock and its price in place of the form that chooses one, a link that chooses another stock, and the order form. The order form sends its order to the address of the page, and the action takes the stock from that address. So an order is always of the stock whose price the page shows, and a refused order keeps the stock and its price.
- Portolab refuses every order of a stock without a delayed price, so the order form waits for one. In its place, the section says why Portolab has no price of the stock and that an order becomes possible once an update of prices brings one.
- An address with an empty stock or with a stock that Portolab does not trade shows the form that chooses a stock, with the reason at its field and the status 400.

## Alternatives

- **The price of each stock in the list of the field.** It works before JavaScript loads, but an option of a list holds a price alone, without its change, the time of its quote, or the notice of an update that missed it.
- **The field that chooses a stock beside the order form, with a button that shows the price of the stock that the field holds.** A student could change the field without showing the price of the new stock and then send the order form, so the order and the price on the page would be of different stocks.
- **A price that the page fetches with JavaScript when the field changes.** Before JavaScript loads, the form would show no price. A field that loads a price on each change also fetches the price of every stock that a reader passes with the arrow keys of a keyboard.

## Consequences

- Another stock takes one more step: the link that chooses another stock, and then the form that chooses one.
- An address with a stock opens the order form of that stock directly, so a student can keep it as a bookmark.
- After Portolab accepts or cancels an order, the page opens without a stock, so the next order starts with the choice of its stock.
