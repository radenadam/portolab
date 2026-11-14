# Learning content

[Decision 0036](decisions/0036-lessons-and-the-glossary-are-content-in-both-languages.md) explains why lesson and glossary prose is Markdown. This content has no page yet. The remaining work of piece 22 in issue #127 adds the pages.

## Reading content

`readLearningContent` in `app/features/learning/read-learning-content.server.ts` returns a `Result` with one entry for every language in Paraglide's `locales`. A caller handles a failure with its original source and reason. It selects the entry whose `locale` is active only after the entire collection passes validation. Each entry contains ordered sessions, tagged sections, and glossary terms. Session numbers use the calendar's `SessionNumber` type.

The module bundles `content/**/*.md` through Vite's raw imports. There is no content folder to locate at request time. `pnpm check` reads all shipped files through that entry in its unit tests. The parser also rejects unexpected Markdown files under the content folder, so a misspelled language or filename cannot disappear silently.

Concept cards name a glossary term id. The root loader reads the glossary through `readConceptLessons` and supplies its term-to-session metadata to `ConceptLesson`, so cards follow the session in the content. The browser receives this metadata without the lesson prose. A regression test changes a glossary session and checks the notice through the server data and the card.

## File format

Each language has `session-<number>.md` for each course session and one `glossary.md`. The filename carries the session number, so the title contains no duplicate number. A file begins with one `#` title. Only `##` headings follow it. Paragraphs are separated by blank lines, and wrapped lines become one space. Inline Markdown, HTML, links, code, and handwritten formula notation are outside this format. Pages render paragraph strings as React text.

Section headings in session files are stable ids. Their visible labels will be Paraglide messages on the lesson pages.

| Session kind                 | Sections in order                                                 |
| ---------------------------- | ----------------------------------------------------------------- |
| Short lesson                 | `summary`, `key-idea`, `body`, `terms`                            |
| Full lesson                  | `summary`, `key-idea`, `body`, `interactive`, `terms`, `practice` |
| Research review or exam card | `summary`                                                         |

The [`sessionKinds` table](../app/features/learning/content.ts) lists the format of each session, and `cannotPractiseSession` in that file selects the sessions that require `unavailable` before `terms`. [Decision 0036](decisions/0036-lessons-and-the-glossary-are-content-in-both-languages.md) records the source of the short and full lesson formats. [Decision 0032](decisions/0032-a-class-meets-weekly-from-the-date-of-its-first-session.md) supplies the topics and the roles of research reviews and exams.

Each summary, key idea, and unavailable notice is one plain paragraph. A body can mix paragraphs and references. `terms` contains at least two unique glossary ids, each on its own `- ` bullet line. A line without that bullet fails parsing. `interactive` and `practice` are empty reserved sections, so no prose claims that their future controls exist.

A glossary entry uses a heading such as `## beta | Beta | 9`, followed by paragraphs and optional references. Its three fields are the stable term id, its title in the file's language, and the session to open for more detail. The glossary title itself is source metadata. The page's heading remains an interface message.

Every configured language must have the same sessions, sections, term ids, lesson links, and references. The parser compares each translation with the first one in `locales`. Lesson term lists must also agree and resolve to glossary entries. Paragraph counts and wording can differ to suit each language.

## References

A reference occupies one paragraph, such as `{{formula:beta}}` or `{{table:trading-rules}}`. Unknown names and inline references fail parsing. These are typed requests for the later page renderer, so they carry no duplicated formula or number. A page provides the relevant data and renders the named component or table in place. Content does not supply numerical fallback values.

| Formula id           | Existing component in the measures feature                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| `weighted-return`    | `WeightedSumFormula` for `expectedReturn`                                    |
| `portfolio-variance` | `PortfolioVarianceFormula`                                                   |
| `variance`           | `VarianceFormula`                                                            |
| `covariance`         | `CovarianceFormula`                                                          |
| `correlation`        | `CorrelationFormula`                                                         |
| `beta`               | `BetaFormula`                                                                |
| `required-return`    | `RequiredReturnFormula` or `SecurityMarketLineFormula` for the subject shown |
| `jensens-alpha`      | `MarketLineFormula`                                                          |
| `sharpe`             | `SharpeRatioFormula` in `ratio-formulas.tsx`                                 |
| `treynor`            | `TreynorRatioFormula` in `ratio-formulas.tsx`                                |
| `risk-free-rate`     | `RiskFreeFormula`                                                            |
| `variance-share`     | `VarianceShareFormula`                                                       |

All components except the two ratio components live in `formulas.tsx`. They keep the notation of [decision 0020](decisions/0020-a-formula-shows-the-notation-of-the-textbooks.md) and the active language's number formats.

| Table id              | Source the later page uses                                                       |
| --------------------- | -------------------------------------------------------------------------------- |
| `trading-rules`       | The dated IDX rules for lots, tick sizes, price references, and order boundaries |
| `trading-sessions`    | The dated trading schedule and exchange calendar                                 |
| `transaction-costs`   | The transaction-cost calculation and its broker fee and tax inputs               |
| `price-source`        | The price source description and quote status                                    |
| `estimation-settings` | The measurement settings, shared months, and dated risk-free rate                |

The first four tables belong to the trading lesson and price guide in piece 30. The measurement table and formula rendering belong to the lessons in piece 23. They use the exported concepts of the features that own these facts. A statement that computes a student's result remains a Paraglide message beside the prose.

## Source notes

The wording is original. These primary sources were checked for the financial claims, rather than used as text to copy.

- [Investor.gov on allocation and diversification](https://www.investor.gov/introduction-investing/getting-started/asset-allocation) supports the distinction between goals, allocation, and diversification. Diversification does not guarantee a gain.
- [Damodaran on the components of risk](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/invfables/riskcomponents.htm) explains company-specific risk, market risk, and the effect of correlation on combined risk.
- [IDX's index descriptions](https://www.idx.id/en/products/index/) define the IHSG and the selection basis of LQ45. The content avoids treating index membership as advice.
- [KSEI's questions and answers](https://web.ksei.co.id/faqs?setLocale=id-ID) and [KPEI's company profile](https://www.idclear.co.id/id/tentang-kpei/profil-perusahaan) explain custody, settlement, clearing, and guarantees.
- [CME on futures and forwards](https://www.cmegroup.com/education/courses/introduction-to-base-metals/cash-flow-in-metals-futures-vs-forwards) explains standardisation, counterparty exposure, daily settlement, and margin. The [Federal Reserve's financial futures manual](https://www.federalreserve.gov/boarddocs/supmanual/trading/4000p2.pdf) explains why a hedge can retain basis risk.
- [OJK's capital market law text](https://www.ojk.go.id/en/kanal/pasar-modal/regulasi/undang-undang/Documents/959.pdf) describes pooled funds, managers, and custody. The [OJK circular on net asset value](https://www.ojk.go.id/id/regulasi/otoritas-jasa-keuangan/surat-edaran-ojk-dan-dewan-komisioner/Documents/SEOJK1ProsedurPenyelesaianKesalahanPenghitunganNABReksaDanaversinonBNRI_1423576956.pdf) supports the meaning of net asset value.
- [The SEC's introduction to options](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-63) explains buyer rights, seller obligations, and the difference between payoff and profit.
- [The SEC's corporate bond bulletin](https://www.sec.gov/files/ib_corporatebonds.pdf) explains coupons, market yield, interest-rate risk, and credit risk.

The app's measurement conventions are governed by [decision 0013](decisions/0013-measures-use-monthly-returns-and-the-bi-rate.md) and [decision 0031](decisions/0031-sharpe-treynor-and-jensens-alpha-are-measures-of-the-first-release.md). Trading statements follow [decision 0016](decisions/0016-orders-last-one-trading-day-and-fill-as-the-order-book-would.md). These records govern the simulation when a market convention has several valid alternatives.
