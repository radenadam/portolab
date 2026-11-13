# 0028. Every screen follows the reference screens of Peta

- Status: Accepted
- Date: 2026-11-14

## Context

On 12 November 2026 the maintainer used Portolab on a rehearsal server and found it hard to navigate, hard to read, and hard to understand. The app was a set of pages, one for each feature: a list of classes, a page of the class with links, a table of prices, the portfolio, the orders, and the measures. A student had to leave the class to see prices and walk back through three pages to trade. Pages explained themselves in paragraphs, so the portfolio read like a textbook. The stock of an order was chosen from a native list that was hard to read in the dark theme, and a student chose how much to buy without seeing the price history of the stock. So the app was neither a trading app nor a learning app. Its screens followed Tenang, the design of decisions 0012 and 0026, and the version that the maintainer used already held the first part of their rebuild on Tenang (#123), which put every page in the frame of Tenang. So the flaw lay in the design itself, and not only in how far the screens followed it.

A redesign followed as clickable mocks. On 13 November 2026 the maintainer chose the direction "Peta", alternative A of the redesign, in which one map of risk against return is the home of every screen. A clickable prototype was reworked to that direction with the maintainer's refinements, and the maintainer approved it on 13 November 2026.

## Decision

### The reference screens

The reference screens of Portolab are images in [`docs/design/peta/`](../design/peta/), drawn in Bahasa Indonesia with the seeded sample data of the prototype. Each image shows the whole height of a screen of the prototype at 1440 pixels on a desktop or at 360 pixels on a phone, in the light theme unless its link says dark. Kamus and a sheet on a phone show only the first screen, because the other terms of Kamus repeat the same part and a sheet scrolls inside the screen. The prototype shows a monogram tile for each stock, because the repository carries no logos of other companies.

| Screen                                                                                                                   | Desktop                                                                                                      | Phone                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Beranda of a student with five holdings                                                                                  | [light](../design/peta/home-desktop-light.png), [dark](../design/peta/home-desktop-dark.png)                 | [light](../design/peta/home-phone-light.png)                                                            |
| Beranda of a new student without holdings                                                                                | [light](../design/peta/home-empty-desktop-light.png)                                                         | [light](../design/peta/home-empty-phone-light.png)                                                      |
| Pasar as a list, with the watchlist above it                                                                             | [light](../design/peta/market-desktop-light.png)                                                             | [light](../design/peta/market-phone-light.png)                                                          |
| Pasar as a map                                                                                                           | [light](../design/peta/market-map-desktop-light.png)                                                         | [light](../design/peta/market-map-phone-light.png)                                                      |
| A stock with the order ticket, which docks beside it on a desktop and opens as a sheet on a phone                        | [light](../design/peta/stock-ticket-desktop-light.png), [dark](../design/peta/stock-ticket-desktop-dark.png) | [stock](../design/peta/stock-phone-light.png), [ticket](../design/peta/ticket-phone-light.png)          |
| Aktivitas, with the orders and the journal                                                                               | [light](../design/peta/activity-desktop-light.png)                                                           | [light](../design/peta/activity-phone-light.png)                                                        |
| Analisis                                                                                                                 | [light](../design/peta/analysis-desktop-light.png)                                                           | [light](../design/peta/analysis-phone-light.png)                                                        |
| Belajar, with the sessions of the course                                                                                 | [light](../design/peta/learn-desktop-light.png)                                                              | [light](../design/peta/learn-phone-light.png)                                                           |
| The lesson of session 9, a page of reading                                                                               | [light](../design/peta/lesson-9-desktop-light.png)                                                           | [light](../design/peta/lesson-9-phone-light.png)                                                        |
| Kamus                                                                                                                    | [light](../design/peta/glossary-desktop-light.png)                                                           | [light](../design/peta/glossary-phone-light.png)                                                        |
| Kelas of the lecturer                                                                                                    | [light](../design/peta/class-desktop-light.png), [dark](../design/peta/class-desktop-dark.png)               | [light](../design/peta/class-phone-light.png)                                                           |
| Mahasiswa with the panel of a selected student, which docks beside the list on a desktop and opens as a sheet on a phone | [light](../design/peta/students-panel-desktop-light.png)                                                     | [list](../design/peta/students-phone-light.png), [panel](../design/peta/students-panel-phone-light.png) |
| The portfolio of a student, which the lecturer opens                                                                     | [light](../design/peta/student-desktop-light.png)                                                            | [light](../design/peta/student-phone-light.png)                                                         |
| Portofolio, the demonstration portfolio of the lecturer                                                                  | [light](../design/peta/portfolio-desktop-light.png)                                                          | [light](../design/peta/portfolio-phone-light.png)                                                       |

The maintainer's own frames of the direction, which a reference page drew before the prototype, are references too: [Beranda in the dark theme](../design/peta/direction-home-dark.png), Kelas in the [light](../design/peta/direction-class-light.png) and the [dark](../design/peta/direction-class-dark.png) theme, and Mahasiswa in the [light](../design/peta/direction-students-light.png) and the [dark](../design/peta/direction-students-dark.png) theme. Where a frame and the prototype differ, the prototype wins, because the maintainer approved it last. [`app-icon.png`](../design/peta/app-icon.png) is the reference of the shape of the app icon.

The prototype itself, with its specification, its checks, the list of every control that navigates or opens something, and the reference page of the direction, is on the branch `design/peta-prototype` at [commit 83171b2](https://github.com/radenadam/portolab/tree/83171b2b5ad1f7a8a6af05c2127df0750885035c).

### The principles

Every screen follows the 14 principles of the specification on that branch, which these lines shorten:

1. **One workspace for each class.** A reader lands in the workspace of their last class, and navigation never leaves it. A switcher in the top bar changes the class.
2. **Every screen answers one question.** Beranda asks how the portfolio is doing, Pasar what a student can buy, a stock whether it fits the portfolio, the ticket what a trade does to the portfolio, Aktivitas what the student did and why, Analisis how risky the portfolio is and whether the risk is paid, and Belajar what a concept means.
3. **Visual first.** Charts, bars, and large numbers carry the information, and a sentence appears only where a number needs meaning.
4. **Theory in context, depth on demand.** A "?" beside a concept opens a short card with one sentence of meaning, the reader's own number, and the lesson. A formula with the reader's numbers stands behind "Lihat perhitungan".
5. **The trade is the lesson.** Before a student confirms an order, the ticket shows what the trade does to the portfolio.
6. **Think like a professional.** An order has an optional reason, which the journal keeps and the lecturer reads.
7. **Real mechanics, explained when they bite.** The ticket applies each rule of IDX and explains it in one sentence when it applies, with the fix as a button, such as "Ubah ke 18 lot".
8. **Simulation and delay, said once.** A badge in the top bar says both, with a "?" that explains them.
9. **No recommendations.** A nudge is about a concept, never about a stock.
10. **Gains and losses look like a trading app.** Green rises and red falls, always with a sign and an arrow. Beli is green and Jual is red wherever a trade starts or is confirmed.
11. **One map is the home of every screen.** It plots risk across, as beta or as the standard deviation per month, against return up, with the IHSG as a diamond at beta 1. Each screen places its own subjects on it, such as the students of a class, the holdings of a student, the stocks of the market, or the portfolio before and after a trade. Tables draw their numbers on shared scales, as bars and dots with the IHSG as a reference tick.
12. **The layout holds at every width and zoom.**
13. **No zig-zag.** What a reader asks for while doing something opens in place.
14. **Companies are recognizable.** A tile beside the code of a stock shows its company where stocks are listed or headlined. Maps and running text show the code alone.

`AGENTS.md` states principles 3, 8, 9, 10, 12, and 13 as standards.

### The look

The colors are tokens of `app/theme.css`, which defines each one when a screen first uses it:

| Role                                               | Token                   | Light                     | Dark                        |
| -------------------------------------------------- | ----------------------- | ------------------------- | --------------------------- |
| Ground of the page                                 | `--color-background`    | `#f1f4f7`                 | `#0f1317`                   |
| Panel                                              | `--color-panel`         | `#ffffff`                 | `#151b21`                   |
| Raised part, such as a choice of options or a note | `--color-raised`        | `#eef2f5`                 | `#1d252d`                   |
| Line                                               | `--color-line`          | `#dfe5ea`                 | `#25303a`                   |
| Strong line, such as an axis                       | `--color-line-strong`   | `#b9c4cf`                 | `#3b4956`                   |
| Ink                                                | `--color-ink`           | `#0f1820`                 | `#e9eef2`                   |
| Second ink, such as a legend                       | `--color-ink-secondary` | `#374552`                 | `#b9c4ce`                   |
| Muted text                                         | `--color-muted`         | `#5d6b78`                 | `#8695a3`                   |
| Data, such as the points of a map and the bars     | `--color-data`          | `#1f6fd6`                 | `#3987e5`                   |
| The reader's own point, or the selected one        | `--color-own`           | `#c97800`                 | `#c98500`                   |
| Gain                                               | `--color-gain`          | `#0b7a53`                 | `#3dcb8c`                   |
| Loss                                               | `--color-loss`          | `#c73a28`                 | `#ff7f6e`                   |
| Warning, and the badge of the simulation           | `--color-warning`       | `#8a5a00`                 | `#e9b44c`                   |
| Button                                             | `--color-button`        | `#0f1820`                 | `#e9eef2`                   |
| Text on a button                                   | `--color-on-button`     | `#ffffff`                 | `#0f1317`                   |
| Link                                               | `--color-link`          | `#1a5fba`                 | `#7db3f5`                   |
| Beli                                               | `--color-buy`           | `#0b7a53`                 | `#3dcb8c`                   |
| Text on Beli                                       | `--color-on-buy`        | `#ffffff`                 | `#0f1317`                   |
| Jual                                               | `--color-sell`          | `#c73a28`                 | `#ff7f6e`                   |
| Text on Jual                                       | `--color-on-sell`       | `#ffffff`                 | `#0f1317`                   |
| Tint of data, such as the current item of the rail | `--color-data-soft`     | `rgba(31, 111, 214, 0.1)` | `rgba(57, 135, 229, 0.18)`  |
| Tint of the reader's own point                     | `--color-own-soft`      | `rgba(201, 120, 0, 0.14)` | `rgba(201, 133, 0, 0.2)`    |
| Tint of a gain                                     | `--color-gain-soft`     | `#e1f3eb`                 | `rgba(61, 203, 140, 0.14)`  |
| Tint of a loss                                     | `--color-loss-soft`     | `#fbe8e4`                 | `rgba(255, 127, 110, 0.15)` |
| Tint of a warning                                  | `--color-warning-soft`  | `#fbf0d9`                 | `rgba(233, 180, 76, 0.14)`  |

The file `src/styles.css` of the prototype holds every other detail of the look, such as the dim ground behind a sheet, the shadow of a popover, and the darker gain and loss on a highlighted row.

- Instrument Sans sets the text, with figures of equal width for every number, so digits line up in columns. DM Mono sets the labels of charts, the codes of stocks, the student numbers, and the code for joining a class.
- Portolab serves both fonts itself from the Fontsource packages, for the reason of decision 0012: a page loads nothing from another server, so it works on a local network without internet and tells no other server who reads Portolab.
- A gain is green with ▲ and a plus sign, and a loss is red with ▼ and a minus sign. The sign and the arrow carry the meaning for a reader who cannot tell red from green, and on a projector that washes colors out.
- A light and a dark theme follow the setting of the device, and the profile menu offers the choice of the system, light, or dark, which overrides the setting.
- Panels have corners of 14 pixels and a thin line around them, and they separate the parts of a screen.
- The app icon is a flask, for the lab in Portolab, with a rising zigzag line inside it. The flask takes the ink of the theme and the line takes the green of gains. The icon has no ground of its own, unlike the dark tile of its reference image, so it sits on the rail like the other icons.

### Sizes

| Part                                                                                                                                        | Size in CSS pixels                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Rail on a desktop, with the app icon at its top, an icon and a label for each item, and the profile at its foot                             | 76 wide                                                      |
| Top bar, with the switcher of the class, the name or the code for joining, and the badge of the simulation                                  | 56 high on a phone, 58 on a desktop                          |
| Tab bar on a phone, with the items of the rail                                                                                              | 62 high                                                      |
| Content, with the token `--width-content`                                                                                                   | at most 1360 wide, and in the middle of the screen beyond it |
| Space beside the content                                                                                                                    | 16 on a phone, 28 on a desktop                               |
| Corners of a panel                                                                                                                          | 14                                                           |
| Touch target, also where a reference draws a smaller control, such as a chip, which keeps a box of 44 and draws its smaller shape inside it | 44 high                                                      |

| Width of the screen | Layout                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------- |
| Below 960           | the top bar, one column, and the tab bar                                               |
| From 960            | the rail and the top bar                                                               |
| From 1180           | two columns, and the order ticket docks beside the stock instead of opening as a sheet |
| From 1320           | the panel of a selected student docks beside the list instead of opening as a sheet    |

### Screens that the references do not show

A screen that the references do not show sits in the frame of the references and takes its parts from them. A list of rows is a table on a desktop and a list of rows on a phone, as the holdings of Beranda are. A few values of equal weight are a grid of statistics, as on a stock. A form takes the parts of the order ticket, and a failure on a form offers its fix as a button, as a rejection in the ticket does. A page of reading, such as the privacy notice or the guide for the lecturer, takes the centered column of a lesson. A page outside a class that holds one form, such as sign-in or joining a class, puts the form in a panel as wide as the docked order ticket, in the middle of the content.

### Where the app departs from the references

- Each stock shows the monogram tile that the references draw until the person who runs the server adds logos, because the repository carries no logos of other companies.
- The price chart of a stock offers the ranges 1M, 3B, 1T, and 5T. The references also draw 1H, which needs prices within a day that Portolab does not keep.
- The control "Demo" of the prototype, which switches the reader and the clock, is not part of the app.
- Where a reference shows a part that an accepted record rules otherwise, such as the labels of the chart of the security market line that decision 0023 sets, the order of the ranking that decision 0021 sets, or the form that chooses a stock before the order form that decision 0025 sets, the record holds until the change that builds the part replaces its rule with a record of its own.

### What the design brings into the first release

The approved design brings these into the first release, which [`docs/product.md`](../product.md) lists:

- Sharpe, Treynor, and Jensen's alpha, beside the measures that the first release already has.
- Belajar, with a card for each of the 16 sessions of the course, a lesson for each session that teaches a topic, and a glossary. A lesson of a topic that the simulation cannot practice yet says so.
- A watchlist of stocks.
- The reason of an order, which the student may write and the lecturer reads.
- A demonstration portfolio, in which the lecturer trades in front of the class and which no statistic of the class counts.

## Alternatives

- **Rebuilding every screen on Tenang, as issue #118 planned.** Its first part already put every page in the frame of Tenang, and the app still read as separate pages that explain themselves. Following the layout of Tenang more closely keeps a page for each feature.
- **The other directions of the redesign.** The maintainer compared them with Peta and chose Peta on 13 November 2026.
- **The prototype in the repository as the reference, instead of images.** The prototype loads React, its fonts, and its parts from public CDNs, and a reviewer would need a browser to see a screen, while an agent reads an image directly. Its source also follows none of the standards of the code of the app. So the branch keeps it, and the images in `docs/design/peta/` are the references.
- **Tests that compare screenshots with the references pixel by pixel.** The text and the data of a real screen differ from the sample data of the prototype, so every screen would fail such a test. Whether a screen follows a layout needs judgment, which the product lens gives. The rules of the layout that a program can measure, such as content that stays in the middle of a wide screen, are checked on every page at many widths instead.

## Consequences

- Decision 0026 is replaced as a whole, and decision 0012 is replaced except for its reason to serve the fonts from Fontsource. Their status lines name each rule that changes.
- Every screen is rebuilt to the references in the changes that issue #127 tracks. That issue lists the screens that are not yet rebuilt, and `AGENTS.md` says how such a screen is judged until its change.
- The product lens compares a screenshot of each screen that a change touches with the references, at 360 pixels with touch and at 1440 and 1920 pixels, in both themes, as its definition in `.claude/agents/review-product.md` describes.
- `e2e/expect-layout.ts` checks the rules of the layout that a program can measure, on the parts that a screen marks with `data-layout`, and `e2e/layout.test.ts` runs it on every page of the app at widths from 360 to 2560 pixels.
- Green and red now carry meaning beside the sign and the arrow, so a reader who sees the colors reads a change faster, and a reader who does not still reads the sign and the arrow.
- Instrument Sans and DM Mono replace IBM Plex, which changes the widths of text and digits, so the layout check runs again on every screen when the fonts change.
