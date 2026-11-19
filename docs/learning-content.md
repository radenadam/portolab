# Learning content

[Decision 0036](decisions/0036-lessons-and-the-glossary-are-content-in-both-languages.md) explains why lesson and glossary prose is Markdown. Both roles open the learning pages at the addresses in [decision 0030](decisions/0030-each-class-is-one-workspace-with-its-own-addresses.md). The calendar and review cards follow [decision 0032](decisions/0032-a-class-meets-weekly-from-the-date-of-its-first-session.md).

## Reading content

`readLearningContent` in `app/features/learning/read-learning-content.server.ts` returns a `Result` with one entry for every language in Paraglide's `locales`. A caller handles a failure with its original source and reason. It selects the entry whose `locale` is active only after the entire collection passes validation. Each entry contains ordered sessions, tagged sections, and glossary terms. Session numbers use the calendar's `SessionNumber` type.

The module bundles `content/**/*.md` through Vite's raw imports. There is no content folder to locate at request time. `pnpm check` reads all shipped files through that entry in its unit tests. The parser also rejects unexpected Markdown files under the content folder, so a misspelled language or filename cannot disappear silently.

Concept cards name a glossary term id. The root loader reads the glossary through `readConceptLessons` and supplies its term-to-session metadata to `ConceptLesson`, so a card in a class links to the session in the content and carries a path back to the page that opened it. Outside a class, the card names the session. The browser receives this metadata without the lesson prose. A regression test changes a glossary session and checks the lesson label through the server data and the card.

Glossary search validates a POST before redirecting to its search address, so oversized text is refused before it becomes part of an address. The action and loader both use `parseGlossaryQuery`, whose limit comes from [`glossaryQueryMaximumLength`](../app/features/learning/glossary-query-maximum-length.ts).

Sessions 2, 6, 9, and 10 fill their interactive and practice sections with server data. Their prose and formula references open in the lesson's question card. [Decision 0048](decisions/0048-lesson-practice-keeps-estimates-fixed-while-weights-change.md) sets the defaults, shared estimates, responsive covariance calculation, missing-data states, and task flow of sessions 9 and 10. Session 2 uses the same allocation engine with a hypothetical correlation between two stocks. Its practice lists the student's observed pairs. Session 6 uses the ticket's dated rules, costs, reference price, and schedule. Its task opens a Limit ticket. Tasks use `lessonTask` in their address and return to `#practice` in the same lesson. The market, stock, ticket, and activity keep that task while the reader follows the flow.

## File format

Each language has `session-<number>.md` for each course session and one `glossary.md`. The filename carries the session number, so the title contains no duplicate number. A file begins with one `#` title. Only `##` headings follow it. Paragraphs are separated by blank lines, and wrapped lines become one space. Inline Markdown, HTML, links, code, and handwritten formula notation are outside this format. Pages render paragraph strings as React text.

Section headings in session files are stable ids. A visible section label on a page is a Paraglide message.

| Session kind                 | Sections in order                                                 |
| ---------------------------- | ----------------------------------------------------------------- |
| Short lesson                 | `summary`, `key-idea`, `body`, `terms`                            |
| Full lesson                  | `summary`, `key-idea`, `body`, `interactive`, `terms`, `practice` |
| Research review or exam card | `summary`                                                         |

The [`sessionKinds` table](../app/features/learning/content.ts) lists the format of each session, and `cannotPractiseSession` in that file selects the sessions that require `unavailable` before `terms`. [Decision 0036](decisions/0036-lessons-and-the-glossary-are-content-in-both-languages.md) records the source of the short and full lesson formats. [Decision 0032](decisions/0032-a-class-meets-weekly-from-the-date-of-its-first-session.md) supplies the topics and the roles of research reviews and exams.

Each summary, key idea, and unavailable notice is one plain paragraph. A body can mix paragraphs and references. `terms` contains at least two unique glossary ids, each on its own `- ` bullet line. A line without that bullet fails parsing. `interactive` and `practice` stay empty in Markdown, because components provide their data. Every full lesson implements them.

A glossary entry uses a heading such as `## beta | Beta | 9`, followed by paragraphs and optional references. Its three fields are the stable term id, its title in the file's language, and the short or full lesson to open for more detail. The parser rejects a link to a research review or exam, because those sessions have cards without lesson pages. The glossary title itself is source metadata. The page's heading remains an interface message.

Every configured language must have the same sessions, sections, term ids, lesson links, and references. The parser compares each translation with the first one in `locales`. Lesson term lists must also agree and resolve to glossary entries. Paragraph counts and wording can differ to suit each language.

## References

A reference occupies one paragraph, such as `{{formula:beta}}` or `{{table:trading-rules}}`. Unknown names and inline references fail parsing. These are typed requests for the lesson renderer, so they carry no duplicated formula or number. The pages render paragraphs and key terms. Full lessons render their formula and table references in the question card. The trading schedule remains visible above the price exercise. Content supplies no numerical fallback values.

| Formula id           | Existing component in the measures feature                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `weighted-return`    | `WeightedSumFormula` for `expectedReturn` in `portfolio-formulas.tsx`                               |
| `portfolio-variance` | `PortfolioVarianceFormula` in `portfolio-formulas.tsx`                                              |
| `variance`           | `VarianceFormula` in `formulas.tsx`                                                                 |
| `covariance`         | `CovarianceFormula` in `formulas.tsx`                                                               |
| `correlation`        | `CorrelationFormula` in `formulas.tsx`                                                              |
| `beta`               | `BetaFormula` in `formulas.tsx`                                                                     |
| `required-return`    | `RequiredReturnFormula` or `SecurityMarketLineFormula` in `capm-formulas.tsx` for the subject shown |
| `jensens-alpha`      | `MarketLineFormula` in `capm-formulas.tsx`                                                          |
| `sharpe`             | `SharpeRatioFormula` in `ratio-formulas.tsx`                                                        |
| `treynor`            | `TreynorRatioFormula` in `ratio-formulas.tsx`                                                       |
| `risk-free-rate`     | `RiskFreeFormula` in `capm-formulas.tsx`                                                            |
| `variance-share`     | `VarianceShareFormula` in `portfolio-formulas.tsx`                                                  |

Each component composes the building blocks of [`app/math-notation.tsx`](../app/math-notation.tsx) into MathML, as [decision 0070](decisions/0070-a-formula-is-mathml-that-the-browser-typesets.md) sets. They keep the notation of [decision 0020](decisions/0020-a-formula-shows-the-notation-of-the-textbooks.md) and the number formats of the active language.

| Table id              | Source the later page uses                                                       |
| --------------------- | -------------------------------------------------------------------------------- |
| `trading-rules`       | The dated IDX rules for lots, tick sizes, price references, and order boundaries |
| `trading-sessions`    | The dated trading schedule and exchange calendar                                 |
| `transaction-costs`   | The transaction-cost calculation and its broker fee and tax inputs               |
| `price-source`        | The price source description and quote status                                    |
| `estimation-settings` | The measurement settings, shared months, and dated risk-free rate                |

The trading lesson renders the first four tables. Sessions 9 and 10 render the measurement settings and their formula references. They use the exported concepts of the features that own these facts. A statement that computes a student's result remains a Paraglide message beside the prose.

## Price guide

The price guide opens at the address in decision 0030 and uses the same sheet as a lesson. Belajar links it beside the glossary. Each language has `price-guide/<locale>.md` with a title and one plain paragraph in each section of `parse-price-guide.ts`. The parser requires both languages and the same sections. The example quote, source delay, lot cost, and tick size come from trading data and Paraglide messages. Its task opens Pasar and returns through `lessonTask=prices` to the guide's practice section.

## Lecturer guide

[Decision 0052](decisions/0052-the-guide-for-lecturers-lives-in-the-repository-and-in-the-app.md) places the lecturer guide in the same feature as lessons. Each language has `guide/<locale>.md`. `readGuideContent` bundles all of them through raw Vite imports and passes the collection to `parseGuideContent`. It reuses `parseMarkdown` for the title and sections. The guide has a title followed by headings such as `## sample | Mulai dari kelas contoh`. The stable ids and order come from `guideSectionIds` in `guide-section-ids.ts`.

Prose paragraphs may contain these inline references. Their identifiers and order agree in both languages, while their surrounding prose may differ.

| Reference                                              | Source                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `{{label:navigation_class_link}}`                      | A label, link, or title in the language's messages, with no placeholders. The page quotes it. |
| `{{value:starting-cash}}`                              | The default class cash, formatted as rupiah.                                                  |
| `{{value:sessions}}`                                   | The course session count.                                                                     |
| `{{value:minimum-returns}}`, `{{value:return-window}}` | The estimation settings for monthly returns.                                                  |

A link such as `{{link:privacy|Pemberitahuan privasi}}` occupies a paragraph of its own. It takes its address from `guideLinks` and its visible text from the translation. The parser rejects a link beside text, another link, or another kind of reference, so its touch target never changes the line spacing of prose. The page reuses the lesson link style.

`parseGuideLabels` validates the imported message catalogues before their labels enter the guide. `guideReferences` reads the owning constants and formats quantities with the active language's `Intl` formats. Guide prose rejects raw quantities, quoted labels, addresses, HTML, and other Markdown. An identifier such as LQ45 remains text. The shipped-content tests check every rendered label against its message, every value against its constant, every application link against `app/routes.ts`, and each deployment link against its section. Parser tests cover missing languages, malformed files, unknown references, and translation mismatches.

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
