# 0013. Measures use five years of monthly returns and the BI-Rate

- Status: Accepted. [Decision 0015](0015-students-buy-only-stocks-that-the-measures-can-use.md) changes one of its consequences. Students cannot buy a stock with fewer returns than the minimum, so such a stock takes the measures away from a portfolio only when a holding loses returns after its purchase, such as after a suspension.
- Date: 2026-11-01

## Context

Every measure of the course comes from past returns: the expected return, the variance and standard deviation, the covariances and correlations, beta against the IHSG, the return that CAPM requires, and the distance from the security market line. The result depends on three choices that textbooks and data providers make differently: how often a return is taken, how many returns are used, and which rate counts as free of risk. A student must be able to reproduce each measure in a spreadsheet, so each choice must also be one that a student can follow.

What the sources do:

- Bodie, Kane, and Marcus estimate the index model from monthly returns. The industry version that they describe in [their slides on index models](https://leeds-faculty.colorado.edu/roca4364/MISC/FNCE4030_files/FNCE4030-Fall-2012-ch08-slides.pdf) uses the 60 most recent months, price returns that ignore dividends, and returns that are not in excess of the risk-free rate. Merrill Lynch, LSEG, and S&P Capital IQ also use five years of monthly returns. Bloomberg uses two years of weekly returns, and [Value Line](https://valueline.com/investment-education/understanding-value-line-research) uses five years of weekly returns with two years as its minimum.
- [Jogiyanto Hartono](https://journal.ugm.ac.id/jieb/article/view/39417) estimates beta from the market model with returns that are not in excess of the risk-free rate, and allows daily, weekly, or monthly periods. Tandelilin names the Sertifikat Bank Indonesia as an example of an asset without risk.
- Indonesian research on LQ45 stocks, such as [Wibowo and Darmanto](https://www.internationaljournalssrg.org/IJEMS/2020/Volume7-Issue5/IJEMS-V7I5P126.pdf), mostly uses monthly closing prices without dividends over 24 to 60 months, the IHSG as the market, and the BI-Rate as the rate without risk since Bank Indonesia stopped issuing short Sertifikat Bank Indonesia. Papers that turn the yearly rate into a monthly one divide it by 12.
- Thin trading pulls betas from daily IDX returns far below 1. Hartono and Surianto found an uncorrected mean beta of 0.07 from daily returns, as [Husein](https://ojs.uajy.ac.id/index.php/kinerja/article/download/896/805/1889) reports. [Course slides on estimating beta](https://www.slideshare.net/juditjnugroho/portofolio-investasibab21estimasibeta) report mean betas for 18 stocks of 0.33 from daily, 0.63 from weekly, and 0.99 from monthly returns.

## Decision

- **Frequency.** A return is taken each month, from the close on the last trading day of the previous month to the close on the last trading day of the month. A month counts once the IHSG has a close in a later month.
- **Window.** The measures use the latest 60 complete months, and they need at least 24 returns. A stock that listed later uses the months that it has, and a stock with fewer than 24 returns gets no measures, with the reason.
- **Returns.** Returns are changes of the closing price, adjusted for splits, without dividends. The IHSG is a price index, so a stock's return includes no dividends either, and beta compares like with like. Returns are not taken in excess of the risk-free rate.
- **Statistics.** The expected return is the mean of the past returns. Variances and covariances divide by the number of returns less one, as `VAR.S` and `COVARIANCE.S` do. Beta is the covariance with the IHSG divided by the variance of the IHSG, which equals `SLOPE`.
- **Risk-free rate.** The rate free of risk is the BI-Rate, the policy rate of Bank Indonesia, that was announced last on or before the end of the window. A month's rate is the yearly rate divided by 12. The rates are data with the dates of their announcement and the page of Bank Indonesia that states each one.
- **Shared periods.** The measures of a stock, or of a portfolio and all its holdings, use only the months in which the IHSG and every stock involved have a return. So every number comes from one table of returns, and the stocks of one portfolio lie on one security market line.
- **Units.** Every measure is per month, such as an expected return of 0.95% per month, and nothing is annualized, so a student sees the numbers of the table of monthly returns.

## Alternatives

- **Weekly returns over two years.** Bloomberg uses them. More observations and room for recent listings, but the betas of thinly traded stocks fall further, and few course materials use them.
- **Daily returns.** Plenty of data, but thin trading makes the betas meaningless without corrections such as those of Scholes and Williams or Dimson, which a student cannot reproduce easily.
- **Total returns with dividends.** Closer to what an investor earns, but Portolab has no total return series of the IHSG, and comparing total returns of stocks with price returns of the market raises every alpha by the dividend yield of the market.
- **Excess returns for beta.** The regression of the textbook uses them. With a stable rate the beta barely changes, and raw returns need one column fewer in a spreadsheet.
- **The yield of SPN with three months.** It was 6.25% at the auction of 13 October 2026. It is the closest match to the Treasury bill of the textbooks, but its yields come from auctions every two weeks that only news sites report in a form a reader can find.
- **The yield of SUN with ten years.** It was 7.63% on 30 October 2026. It is the usual rate for valuation, but its price moves with long-term rates, so it is not free of risk over one month.
- **Compounding the yearly rate into a monthly one.** Exact, but no course material or paper that was checked does it, and the difference is under 0.01 percentage points a month.

## Consequences

- A student can reproduce every measure from one table of month-end closes with `AVERAGE`, `VAR.S`, `STDEV.S`, `COVARIANCE.S`, `CORREL`, `SLOPE`, and `SUMPRODUCT`.
- The history must reach 62 months back, and the price job keeps it current after each close.
- Stocks that listed in the last two years, such as AADI in December 2024, get measures only once they have 24 monthly returns. A portfolio that holds such a stock gets no measures until then either, because all its holdings share one table of returns, and the failure names the stock.
- After each board meeting of Bank Indonesia that changes the BI-Rate, the new rate must be added to the data, or the measures keep the previous rate and show the date of its announcement. Issue #23 tracks a check that notices a missed change.
- A lecturer should be able to choose another frequency, window, and risk-free rate for a class later, because the textbooks of the course differ. The measures take the window and the minimum as settings already. Issue #22 tracks the rest: weekly returns, other rates, the class settings, and a screen for them.
