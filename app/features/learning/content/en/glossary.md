# Glossary

## alpha-jensen | Jensen's alpha | 9

The difference between expected return and the return CAPM requires. Positive means above the security market line at the same beta, rather than a guarantee of the next gain.

{{formula:jensens-alpha}}

## ara | ARA (upper auto rejection) | 6

The upper order-price boundary relative to a reference price. Its size follows the rules in effect on the trading date.

{{table:trading-rules}}

## arb | ARB (lower auto rejection) | 6

The lower order-price boundary relative to a reference price. It limits order prices rather than every possible loss an investor can bear.

{{table:trading-rules}}

## beta | Beta | 9

The sensitivity of returns to market returns. Beta measures market exposure rather than all risk, so low beta need not mean low standard deviation.

{{formula:beta}}

## bi-rate | BI-Rate | 9

Bank Indonesia's policy rate. Portolab uses it as a proxy for the risk-free rate rather than interest paid on simulation cash.

{{formula:risk-free-rate}}

## biaya-broker | Broker fee | 6

The charge for trading through a securities firm. The rate and calculation affect the total cash paid for a purchase and received from a sale.

{{table:transaction-costs}}

## bobot | Weight | 10

One asset's share of the entire portfolio's value. Cash is part of the total, so stock weights alone need not cover the whole portfolio.

## capm | CAPM | 9

A model connecting required return to beta and the market risk premium. Its result depends on the model's assumptions and estimated inputs.

{{formula:required-return}}

## diversifikasi | Diversification | 2

Spreading money across assets with different sources of risk. Relationships between asset returns can reduce combined risk, but do not guarantee gains or remove market risk.

## forward | Forward | 11

A contract between two parties for a future transaction at an agreed price and terms. It creates obligations and the risk that the counterparty will not fulfil its promise.

## fraksi-harga | Tick size | 6

A permitted price step for an order. The step depends on the applicable price-band rules.

{{table:trading-rules}}

## futures | Futures | 11

A standardised exchange-traded contract for a future transaction. Gains and losses are settled daily, so price changes can require additional margin.

## harga-acuan | Reference price | 6

The base price for calculating order boundaries. Distinguish it from the latest quote, then read how it is determined in the trading rules.

{{table:trading-rules}}

## harga-rata-rata | Average cost | 6

The cost per share of stocks still held. In Portolab, purchase costs are included in the cost basis, while sale costs have not yet occurred.

## harga-tertunda | Delayed price | 6

A quote received after the exchange trade happened. Its timestamp shows its age, so the displayed price is not a promise of the current market price.

{{table:price-source}}

## ihsg | IHSG | 4

The IDX Composite index, which summarises stock-price performance within its index coverage on IDX. Portolab uses it as the market benchmark for return comparisons and beta.

## imbal-hasil | Return | 10

A change in value relative to starting value over a period. Total return can include income such as dividends, while price return counts only price changes.

## imbal-hasil-harapan | Expected return | 10

An estimate of return for a period. Portolab uses the average of historical returns, so the value is an estimate rather than a guaranteed result.

{{table:estimation-settings}}

## kas | Cash | 9

Portfolio money not held as stocks. Portolab cash earns no interest. Cash reduces stock exposure, but differs from an asset earning the risk-free rate.

## kedaluwarsa | Expired | 6

The state of an unfilled order whose validity has ended. An expired order differs from one rejected when checked.

## kontribusi-risiko | Risk contribution | 10

One stock's share of portfolio variance, from its weight and covariance with the portfolio. A contribution can be negative if the stock offsets portfolio movements. It is undefined when portfolio variance is zero.

{{formula:variance-share}}

## korelasi | Correlation | 2

The direction and strength of the linear relationship between two returns. Negative correlation means they tend to move in opposite directions. Correlation is undefined if either standard deviation is zero.

{{formula:correlation}}

## kovarians | Covariance | 10

A measure of how two returns move together relative to their means. Positive means deviations tend to share a direction. Its size also depends on scale, which distinguishes it from correlation.

{{formula:covariance}}

## laba-rugi | Unrealised profit or loss | 6

The difference between the market value of stocks still held and their purchase cost basis. It changes with prices and does not yet include the cost of a sale that has not happened.

## lot | Lot | 6

A unit of stock quantity in an order. Stock prices are quoted per share, so the rule for shares per lot is needed to calculate order value.

{{table:trading-rules}}

## lq45 | LQ45 | 4

An IDX stock index selected using criteria such as liquidity and market capitalisation. Membership can change and is not a statement that a stock is certain to gain.

## nilai-portofolio | Portfolio value | 10

Cash plus the market value of all stocks held. To judge how current the value is, check the time of the price used for each stock.

## obligasi | Bond | 14

Debt with terms for repayment of principal and, if any, coupons. Its market price can change, and the payment promise still carries default risk.

## opsi | Option | 13

A contract giving its buyer a right to buy or sell an asset at the strike price at the specified times. The buyer pays a premium, while the seller takes an obligation if the right is exercised.

## order-limit | Limit order | 6

An order with a price boundary. A purchase may fill only at the limit or below, and a sale at the limit or above. The order may end without filling.

## order-pasar | Market order | 6

An order without a limit price. In a real market the fill price can differ from the last price seen. Portolab approximates it with a delayed quote that meets the fill rules.

## pph-final | Final tax on stock sales | 6

A tax on stock sale value rather than only on profit. It reduces sale proceeds even when the stock is sold at a loss.

{{table:transaction-costs}}

## premi-risiko-pasar | Market risk premium | 9

The difference between the market's expected return and the risk-free rate. In CAPM, this premium determines the security market line's slope. Its historical estimate can be negative.

## rasio-sharpe | Sharpe ratio | 10

Return above the risk-free rate for each unit of standard deviation. Sharpe uses total risk and is undefined if standard deviation is zero.

{{formula:sharpe}}

## rasio-treynor | Treynor ratio | 10

Return above the risk-free rate for each unit of beta. Portolab shows it only for positive beta, because zero beta makes it undefined and negative beta makes its ranking misleading.

{{formula:treynor}}

## reksa-dana | Mutual fund | 12

A pool of money managed by an investment manager under an investment policy. Investors hold units whose value follows the portfolio's net assets, rather than a deposit with a guaranteed return.

## risiko-sistematis | Systematic risk | 9

Risk from market factors that remains in a diversified portfolio. In CAPM, beta measures exposure to this risk.

## risiko-tidak-sistematis | Unsystematic risk | 2

Risk related to a company or a particular group of assets. Spreading money across assets with different sources of risk can reduce it.

## sesi | Trading session | 6

A trading period within an exchange trading day. The applicable schedule determines when trading can take place, and exchange holidays also matter.

{{table:trading-sessions}}

## simpangan-baku | Standard deviation | 10

The square root of variance, measuring the spread of returns in return units. It is not a loss limit and does not promise that the next result lies within a particular range.

## sml | Security market line (SML) | 9

The line connecting beta to the return CAPM requires. The vertical distance of expected return from the line is Jensen's alpha.

{{formula:required-return}}

## varians | Variance | 10

A measure of spread from squared deviations of returns from their mean. Sample variance uses sample degrees of freedom in its divisor.

{{formula:variance}}

## volatilitas | Volatility | 10

A name for the size of fluctuations. In Portolab's measures, volatility is the standard deviation of returns. Compare values only at the same frequency and over the same data period.
