# The mechanism of trading

## summary

Quantity, price, timing, and costs together define an order.

## key-idea

A price per share does not yet tell you the cash needed to buy, because share quantity and costs also count.

## body

Start with the unit of quantity. Stock orders use lots, while prices are quoted per share. The lot rule connects the two. Tick sizes define valid price steps, and ARA and ARB bound order prices relative to their reference price.

{{table:trading-rules}}

A limit order states your price boundary. A purchase may fill only at the limit or below, while a sale may fill only at the limit or above. A price limit does not guarantee a fill. A market order has no such boundary, so a real trade price can differ from the price you just saw.

Portolab uses delayed quotes as an approximation of trading, rather than an actual exchange order queue. Read the quote time before judging a result. The price information explains the source and its delay.

{{table:price-source}}

The time you send an order differs from the time it can be checked for a fill. Consider trading sessions, trading days, and order validity. Read the trading schedule from the rules that apply on its date.

{{table:trading-sessions}}

Purchase costs add to the cash paid. Sale costs and sales tax reduce the cash received. Sales tax is based on sale value, so it still applies when a sale makes a loss.

{{table:transaction-costs}}

Before sending an order, check buy or sell, lots, order type, price, and the total after costs. Unrealised profit or loss does not yet include the cost of a sale that has not happened.

## interactive

## terms

- lot
- fraksi-harga
- ara
- arb
- order-limit
- order-pasar

## practice
