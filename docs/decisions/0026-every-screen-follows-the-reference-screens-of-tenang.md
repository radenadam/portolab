# 0026. Every screen follows the reference screens of Tenang

- Status: Superseded. [Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) replaces each of its sections: the reference screens, the frame of the app, the header of a page, the headline, sections, tables and lists of rows, key measures, charts, forms and the order ticket, rejections and other failures, screens that the references do not show, and sizes. It also changes two of its consequences: which issue tracks the rebuild of the screens, and which references the product lens compares a screen with.
- Date: 2026-11-11

## Context

Decision 0012 records the choice of direction A, Tenang, from three mockups of the portfolio of a student and of an order that Portolab rejects, each on a desktop and on a phone. It recorded the fonts, the palette, and how gains and losses look, but not the layout, and the mockups stayed outside the repository. So every screen was built as one narrow column of headings, links, and lists of labels and values. On 11 November 2026 the maintainer saw the app and found it far from the screens that were chosen, as if it had no style at all. No review compared a screen with the mockups, because no file in the repository showed them.

## Decision

The frames of direction A are the reference screens of Portolab. They are images in [`docs/design/tenang/`](../design/tenang/), drawn in Bahasa Indonesia with the example portfolio of the mockups:

| Screen                                                                                                         | Light                                                    | Dark                                                   |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| The portfolio of a student on a desktop, with the order ticket beside it after Portolab rejected a purchase    | [light](../design/tenang/portfolio-desktop-light.png)    | [dark](../design/tenang/portfolio-desktop-dark.png)    |
| The portfolio of a student on a phone                                                                          | [light](../design/tenang/portfolio-phone-light.png)      | [dark](../design/tenang/portfolio-phone-dark.png)      |
| The order ticket on a phone, after Portolab rejected a purchase that the cash of the student could not pay for | [light](../design/tenang/rejected-order-phone-light.png) | [dark](../design/tenang/rejected-order-phone-dark.png) |

Every screen follows the layout of the references in both languages, and each of its parts looks like the same part in them. The references set the layout and the parts. They do not set the text or the data, which `AGENTS.md` and the other decision records set. So a screen keeps every text and every part that those require, such as the time at which each price was quoted or the table of the points of a chart, in the place where the references put the nearest part. Where a reference crowds its content, such as the heads of the columns of the holdings or the label at the end of a line of the chart, the screen gives the content the room that it needs and keeps the layout. Where a reference draws a control lower than the touch target that `AGENTS.md` sets, such as an item of the sidebar, a field, or a button, the control keeps its look and grows to that height.

### The frame of the app

- On a desktop, a sidebar at the left holds the mark Portolab in IBM Plex Mono, the navigation, and at its foot the mark "Simulasi" in a pill with an outline of ink, with the delay of prices and the time of the latest update under it. An item of the navigation is in muted text. The current page is in ink and semibold, after a dot of the signal color. A thin line separates the sidebar from the page.
- On a phone, a top bar holds the mark Portolab and the pill "Simulasi", and a line in small muted text under it gives the delay of prices and the time of the latest update. A page whose first part gives the delay, such as the order ticket, leaves that line out, as the phone reference of the order does. A tab bar at the bottom holds the navigation in equal parts. The current tab is in ink and semibold, with a line of the signal color along its top edge.
- The navigation holds the pages of the reader. Inside a class, a student has the four pages of the references: the portfolio, the prices, the orders, and the class. Inside a class, a lecturer has the classes, the page of the class, the ranking of its portfolios, and the prices. Outside a class, such as on the list of classes, a person who is signed in has the classes and the prices. A visitor who is not signed in has the prices, joining a class, and sign-in.
- Some pages are below another page. The measures of the portfolio are below the portfolio, and the measures of one stock are below the measures of the portfolio. The portfolio of a student that the lecturer opens is below the ranking, and the measures of that student are below that portfolio. The reset of the password of a student is below the page of the class. The current page in the navigation is the page itself, or the nearest page above it that the navigation holds. When the navigation holds neither, no page in it is current.
- On a phone, a page below another page shows a link back to the page above it in place of the mark. The page of the orders with a chosen stock shows a link back to the portfolio in the same way, as the order ticket of the phone references does, because a desktop shows the same ticket beside the portfolio. Every other page shows the mark.
- The link to the account and the language switch, which the references do not show, stand at the foot of the sidebar above the pill on a desktop. On a phone they stand in the top bar, in a row under the mark, or the link back that replaces the mark, and the pill, because a phone 360 pixels wide has no room for them between the two.
- The notice of the simulation in full ends the order ticket, as the references show. Every other page has the pill "Simulasi" of the frame as its label of a simulation.
- On a screen wider than the desktop reference, the columns keep the widths of the reference, and the frame stands in the middle of the screen. A page with nothing for the right column gives its width to the main column, such as for a wide table.
- A screen without room for the right column beside the sidebar and the main column places what the right column holds as a phone does, such as the order ticket on the page of the orders. A screen without room for the sidebar beside the main column takes the frame of the phone.

### The header of a page

- A page opens with a header line in small muted text. At the left it holds the path of the page, which is its class when it has one, the pages above it, and the page itself. The last part of the path is the heading of the page, and each earlier part links to its page. At the right it holds the date and the time of the prices that the page shows, and a page without prices leaves it empty.
- On a phone, the header line stands under the top bar, and under the line of the delay where the page shows that line. It holds the path alone, because the time stands in the line of the delay, or in the part of the page that gives the delay in its place. The phone references leave the header line out, but a phone shows it, because its heading names the page and the class to a reader who may have several classes.

### The headline

- A page about one value opens with that value as its headline, such as the value of a portfolio. A small muted label names the value, and the value follows in IBM Plex Sans, semibold and large, with figures of equal width. So the headline number keeps the font of the text, unlike the other numbers that stand on their own.
- A line under the headline gives the values that explain it, such as the return since the start, the return of the IHSG over the same time, and the cash. Each value stands with a muted label, in IBM Plex Mono and in ink, and a change carries its sign and its arrow.

### Sections

- A section opens with a small muted heading in semibold. Space alone separates the sections, without lines or boxes.

### Tables and lists of rows

- On a desktop, rows of one kind, such as the holdings, the orders, the prices, the students, or the ranking of a class, are a table across the main column. The heads of its columns are small and muted, above a thin line, and a thin line ends each row. The first column names the row, such as the code of a stock in semibold with the name of its company under it in small muted text. Numbers are in IBM Plex Mono and aligned at the right.
- On a phone, the same rows are a list between thin lines. Each row holds its name and a short muted line at the left, such as the lots and the average price, and its main numbers at the right, one under the other, such as the value and the change.

### Key measures

- A few values of equal weight, such as the measures of a portfolio, are a grid of four columns on a desktop and two on a phone. Each value has a small muted label above it and is in IBM Plex Mono, larger than the text.
- A chart that places them, such as the security market line, follows the grid, with a caption of one or two sentences that says what the chart shows about the portfolio of the reader.
- The portfolio shows its key measures and the chart of the security market line, as the references do, with a link to the page of the measures, which shows the formula and the inputs of each measure.

### Charts

- A chart of the value of a portfolio draws the portfolio in ink with a light fill under its line, and the IHSG in muted gray with a dashed line, as decision 0012 sets. Each line ends in a dot and a label with its last value. The lines of the grid are thin, and the labels of the axes are small and muted, in IBM Plex Mono.

### Forms and the order ticket

- On a desktop, the order ticket stands in a right column beside the portfolio, as the references show, and beside the list of orders. A form that acts on what a page lists, such as the form that creates a class beside the list of classes, takes the right column in the same way. On a phone, the ticket comes first on the page of the orders, under the header line, and the list of orders follows it. Another such form stands in the main column of its page.
- The ticket opens with the stock of the order, its code in semibold with the name of its company under it. The latest price follows in IBM Plex Mono with its change, and the delay under it. Before the student chooses a stock, the ticket holds the form that chooses one, as decision 0025 sets.
- A field has its label above it and its hint below it, both small and muted. Its value stands on a line of ink, without a box, in IBM Plex Mono when it is a number and in IBM Plex Sans otherwise.
- A choice between a few options, such as buying or selling, or a limit or a market order, is a row of equal options above a thin line. The current option is in ink and semibold, with a line of the signal color under it.
- A summary of amounts, such as the value, the fee, and the total of an order, lists muted labels at the left and amounts in IBM Plex Mono at the right. A thin line and semibold text set off its total.
- The button that sends a form spans the width of the form and is filled with the signal color, like the button of the next step in a rejection. The references draw the button that sends the rejected order in muted text on the surface color, which is how a button looks while it cannot act, such as while its form waits for an answer.

### Rejections and other failures

- A rejection, and every other failure on a form or a page, opens with a line of ink, 2 pixels thick, above its title. The title is in semibold, a little larger than the text. The text follows in paragraphs, in the order in which the section "Interface text" of `AGENTS.md` builds an error. When the next step is an action that Portolab can take, such as an order of the largest number of lots that the cash pays for, a button of the signal color offers it. A failure uses no red, no box, and no icon.
- A rejection stands where the section "Interface text" of `AGENTS.md` puts an error. So in the order ticket, an error about the whole order stands under the price and above the fields, and not under the summary, where the references draw it.

### Screens that the references do not show

- Every screen sits in the frame and opens with the header line. Its parts come from the references, so a list of rows is a table, a few values of equal weight are a grid of key measures, a form takes the parts of the ticket, and a failure looks like a rejection. A text that explains, such as the method of the measures or the privacy notice, runs in the main column, in lines no longer than the caption of a chart.
- The ranking of a class is a table with a row for each student. The name of the student is in semibold with the username under it in small muted text, and the numbers of the ranking follow in IBM Plex Mono. On a phone, each row holds the distance from the security market line at the right. An action on the whole table, such as the download of the workbook, is a link at the right end of the line of its heading.
- The page of a class shows the lecturer the code for joining as its headline, because students read it from a projector, with the addresses for joining in the line under it. The table of the students follows. A student sees the class as a grid of key values, such as the lecturer, the starting cash, and the day of joining.
- The portfolio and the measures of a student, which the lecturer opens from the ranking, take the layout of the portfolio and of the measures without the order ticket.
- Sign-in, the setup of an account, and joining a class are pages with one form. Each takes the parts of the ticket at the width of the right column, in the main column of the frame of its reader. A failure, such as a wrong password, looks like a rejection.

### Sizes

The references draw these sizes in CSS pixels. `app/theme.css` holds each of them as a token when a screen first uses it, and the images set every other detail.

| Part                                                                    | Desktop                               | Phone                            |
| ----------------------------------------------------------------------- | ------------------------------------- | -------------------------------- |
| Sidebar                                                                 | 184 wide, with 32 above and 24 beside | none                             |
| Right column                                                            | 344 wide, with 32 above and 28 beside | none                             |
| Space around the main column                                            | 32 above, 40 beside, and 48 below     | 8 above, 20 beside, and 24 below |
| Space between sections                                                  | 40                                    | 30                               |
| Headline number                                                         | 46                                    | 34                               |
| Value of a key measure                                                  | 22                                    | 19                               |
| Latest price in the ticket                                              | 22                                    | 22                               |
| Stock in the ticket                                                     | 20                                    | 20                               |
| Value of a field                                                        | 17                                    | 17                               |
| Mark Portolab and title of a rejection                                  | 15                                    | 15                               |
| Text of a page and items of the sidebar                                 | 14                                    | 14                               |
| Cells of a table, rows of a list, and text of a rejection               | 13.5                                  | 13.5                             |
| Header line, label of a headline, and headings of sections              | 12.5                                  | 12.5                             |
| Heads of columns, labels of fields and of key measures, hints, and tabs | 12                                    | 12                               |
| Corners of a button                                                     | 6                                     | 6                                |

## Alternatives

- **The layout in words alone, as decision 0012 recorded the look.** Words such as calm and typographic fit one narrow column of plain elements as well as the chosen screens, so they did not prevent screens that are far from the mockups.
- **The file of the mockups in the repository.** It also holds the two directions that were not chosen, and a script draws its frames with fonts from another server. A reviewer would need a browser to see a frame, while an agent reads an image directly.
- **Tests that compare screenshots with the references pixel by pixel.** The text and the data of a real screen differ from the example portfolio, so every screen would fail such a test. Whether a screen follows a layout needs judgment, which the product lens gives.

## Consequences

- Every existing screen is rebuilt on the references, as issue #118 tracks.
- The product lens compares a screenshot of each screen that a change touches with the references, as its definition in `.claude/agents/review-product.md` describes.
- The phone references are 380 pixels wide, and a screen that follows them still fits a phone 360 pixels wide, as `AGENTS.md` requires.
- A screen of a later release whose layout the parts of the references cannot compose starts with a new reference image and a decision record that adds it.
