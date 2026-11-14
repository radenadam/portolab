# 0034. A stock carries the name and the sector that IDX publishes

- Status: Accepted
- Date: 2026-11-14

## Context

Students choose the stocks of their portfolios, and many of them have never traded, so a code such as AADI or HRTA tells them little about the company or about its industry, which they need in order to diversify. The approved design "Peta" shows each stock with a tile of its company beside its code and the name of the company under it, wherever stocks are listed or headlined, and it groups stocks by sector, as [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) describes. Portolab tracks the stocks of every recorded period of the LQ45, as [decision 0014](0014-students-trade-the-stocks-of-the-lq45.md) explains, and each period is data with the announcement of IDX behind it, as [decision 0002](0002-orders-fill-at-delayed-prices-during-sessions.md) asks for the rules of IDX.

Two classifications of sectors are common. IDX introduced IDX-IC on 25 January 2021 for every company that it lists, and its sector indices follow it. MSCI and S&P define GICS for markets around the world. The logo of a company is a trademark of that company, and the repository is public under the license of [decision 0011](0011-the-repository-is-public-under-mit.md).

## Decision

- Each code of every recorded period of the universe has a record of its company in [`app/features/market-data/company-of.ts`](../../app/features/market-data/company-of.ts): the name that IDX gives the company, its sector of IDX-IC, and where both were read and when. The table is typed over the codes of the periods, so a period that a review of IDX adds does not compile until each of its new stocks has a company.
- The name is the one that IDX publishes, such as "Bank Central Asia Tbk", without the period after "Tbk" that IDX writes for some companies and not for others, so all names read alike.
- The sector takes the names that IDX gives it in Bahasa Indonesia and in English, such as "Barang Konsumen Primer" and "Consumer Non-Cyclicals". The type of the sectors holds only the sectors of the stocks of the universe, so a period that brings a stock of another sector adds that sector with its names.
- The person who adds a period reads the profile of each new company on the website of IDX and records it as the source. The website refuses automated reads, so the records of 14 November 2026 come from copies of what IDX publishes. The names come from the list of stocks of IDX that the project NeaByteLab/IDX-API saved on GitHub on 20 February 2026, which cuts a name at 30 characters, so a cut name was completed from lembarsaham.com. The names of lembarsaham.com on 14 November 2026 match them, apart from "(Persero)" in the names of ANTM and PTBA, which the list of IDX leaves out, so no company changed its name in between. The sectors come from the profiles on lembarsaham.com on 14 November 2026, and they agree with the copy of the profiles of IDX in the list of listed companies of the Indonesian Wikipedia for each of the 38 stocks that its page showed.
- The repository carries no logos of other companies. So the tile of a company shows the first two letters of the code of its stock, and a later change lets the person who runs the server add logos in a folder outside the repository, as issue #127 tracks. `StockName` in [`app/features/market-data/stock-name.tsx`](../../app/features/market-data/stock-name.tsx) draws the tile, the code, the name, and the sector when a screen shows it, so every screen shows a stock alike, and a logo needs a change in that one place.
- Running text and maps name a stock by its code alone, as decision 0028 says.

## Alternatives

- **GICS.** Students who read international reports know it. But IDX does not publish it for its companies, the classification of each company is licensed data of MSCI and S&P, and the sector indices of IDX follow IDX-IC, so a student who compares a portfolio with a sector index of IDX needs IDX-IC.
- **The name from the price source.** The answer of Yahoo Finance with the daily closes of a stock holds the name of its company, such as "PT Bank Central Asia Tbk", but no sector, so the sectors would still need a table. A name read with each update would also make every screen that names a stock depend on the price source, while a company changes its name a few times in years at most.
- **The logos of the prototype in the repository.** They make the companies easiest to recognize, but the repository would publish the trademarks of other companies under a license that those companies never gave.

## Consequences

- The table of prices, the holdings of a portfolio on its page and on the page of its orders, and the order ticket show the name of each company under the code of its stock, beside the tile of the company. The table of prices and the order ticket show its sector too.
- A review of the LQ45 that adds a stock now also needs the company of that stock, which the type check demands.
- A company that changes its name or its sector keeps its old record until someone updates it, because Portolab does not watch IDX for such changes.
