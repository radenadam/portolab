# 0016. Orders last one trading day and fill as the order book would

- Status: Accepted
- Date: 2026-11-01

## Context

Decision 0002 says that orders fill at delayed prices during IDX trading sessions and wait outside them for the next session, and that a limit order fills when a later delayed price reaches its limit. It leaves open whether an order that did not fill in its session keeps waiting, which delayed price fills a waiting order and at what price, what an order holds back from other orders, and which fees a trade pays. Stockbit Virtual Trading is the bar for market realism, and every number must be one that a student can check by hand.

IDX keeps an order in its book for one trading day. Orders match continuously in session I and session II. The pre-opening, pre-closing, and post-closing sessions match orders in auctions or at the closing price, which a delayed quote does not show. An order that arrives at a price that reaches its limit trades at that price, and an order that waits in the book trades at its own limit when the price moves through it. Brokers in Indonesia charge about 0.15% on a purchase and 0.25% on a sale, and the 0.25% includes the final tax on sales of 0.1% of the value. They also collect a stamp duty of Rp10,000 on the trade confirmation of a day whose trades exceed Rp10 million in value.

## Decision

- **One trading day.** An order trades on the trading day of the session of continuous trading that is open when the student places it, or else of the next session to open. It expires when the delayed prices of that day are final. From that moment it sets aside no cash and no shares, even before a check marks it expired.
- **Prices that can fill an order.** Only a delayed price that was quoted in session I or session II of that day, from the start of the first session of the order, can fill it. So an order placed before the market opens never fills at the close of an earlier day, and an order placed in the break waits for session II.
- **Fill prices.** A market order fills at the first such price. A limit order fills at the first such price when that price reaches its limit, even when that is the latest delayed price at the moment the student places it, because the order would trade at once on the exchange too. Otherwise it rests at its limit, as an order in the book of IDX does, and a later price that reaches its limit fills it at its limit.
- **Checks when an order is placed.** The order is checked against the rules of IDX of its trading day: the largest number of lots in one order, and for a limit order the tick size of its price and the auto rejection limits around the reference price. The reference price is the stored close of the trading day before, which is final, so Portolab rejects a limit order placed after session II until the next update of the price history stores that close, and the text says so, and a quote that can still change never sets the limits. A market order is checked at the latest delayed price. A purchase needs its value and its broker fee within the cash that the other open orders leave, and it sets that amount aside. A sale needs the shares that the other open sell orders leave.
- **Rejection when a price rises.** A market purchase whose price rose while it waited, so that the cash it can use no longer pays for it, is rejected with the numbers. The text offers a limit order at the price at which the order was checked, which the cash pays for, and the largest order that the cash pays for at the new price.
- **Fees and tax.** A trade pays a broker fee of 0.15% of its value, and a sale also pays the final tax of 0.1%, which together make the 0.25% that Stockbit Sekuritas charges on a sale. Each amount is rounded to the nearest whole rupiah with halves up, as `ROUND` does in a spreadsheet. The stamp duty is left out, because it is a tax on the document of a whole day of trades, not a cost of an order.
- **Cost of a holding.** The cost of a holding includes the broker fee of each purchase. A sale takes out the average cost of the shares that it sells, rounded to the nearest whole rupiah with halves up, so the average cost of the remaining shares changes by less than a rupiah in total.
- **Boards.** Every stock follows the limits of the main, development, and new economy boards.

## Alternatives

- **Orders that wait until the student cancels them.** Some brokers keep such orders and send them again each day, but IDX itself keeps an order for one day, and the limits and the reference price change every day.
- **Filling a resting limit order at the delayed price.** Simpler, but a price that moves past the limit between two quotes would give a better price than the limit, which no exchange gives to an order that waits in its book.
- **Filling every limit order at its limit.** A limit above the market price would then fill above it.
- **Fees that the lecturer sets for a class.** StockTrak lets a lecturer set commissions, and issue #34 tracks it. It needs settings for a class, which do not exist yet, and a lecturer still needs a typical default.
- **The stamp duty as a cost of the first order of a day above Rp10 million.** More exact for a large trader, but it makes the cost of one order depend on the other orders of the day, which a student cannot check from one order.

## Consequences

- A student sees an order wait, rest at its limit, fill, or expire as in a broker's app, and every fill can be checked from its price, its lots, and the rates.
- The last minutes of session II reach Portolab after the session ends, and prices from them can still fill an order of that day until its prices are final.
- An order does not fill at the price of the closing auction, which only the pre-closing session sets.
- A stock that IDX moves to the special monitoring board trades there in call auctions with other limits, which Portolab does not model, as issue #33 tracks.
