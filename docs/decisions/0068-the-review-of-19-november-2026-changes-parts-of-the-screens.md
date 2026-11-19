# 0068. The review of 19 November 2026 changes parts of the screens

- Status: Accepted
- Date: 2026-11-19

## Context

[Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) makes the images in [`docs/design/peta/`](../design/peta/) the references of every screen. On 19 November 2026 the maintainer used the rebuilt app and asked for changes to parts of it. Some parts were hard to find or to reach, such as Beli and Jual below the chart of a stock and the way back from a stock as a lone arrow. Some parts repeated what another page already shows, such as the side panel of Mahasiswa beside the pages of each student and the table of students below the class map. Some parts looked or behaved unlike other apps, such as links that underline on hover inside buttons and rows, and a choice of a view that made the page jump. This record follows what the maintainer asked for, so it departs from the references and from some rules of earlier records.

## Decision

### Shared parts

- Every control turns the pointer into a hand, and each kind of control reacts to the pointer in its own way, in the shape that it shows and never in the touch box around that shape. Nothing moves or changes its size under the pointer. A chosen option, filter, or row keeps its look, and a row that a tint marks, such as the student whom the lecturer came back from, deepens that tint.
  - A filled button, such as a primary button or Beli, takes a deeper fill of its own color.
  - An outlined button, a pill, and a chip, such as a filter or the name of the reader, fill their own shape with the token `--color-control-hover`, which shows on the ground of the page as well as on a panel.
  - An icon or a "?" changes its color.
  - A link that stands alone and the label of a part that opens, such as a `summary`, underline. A link in a sentence draws its underline thicker.
  - A row that opens something composes the global class `.row-link` of `app/theme.css`, or a link that covers it, and takes the light ground of the token `--color-hover` across the whole row. A row has no rounded corners, so the lines between rows stay straight.
  - An item of the navigation or of a menu takes a light ground.
  - An option of a segmented choice shows a faint version of the chosen pill in its place.
  - A card, such as the card of a session or a key term, takes a light ground and a stronger edge.
  - A field draws a stronger edge, and a checkbox a stronger edge or a deeper fill.
  - A point of a map shows one ring centered on it. The mark of the reader turns its own ring into that ring.
- A link that stands alone reaches its touch target of 44 pixels over the space around it, so it takes only the height of its line in the layout.
- A checkbox is an element of 44 pixels that draws a box of 18 pixels in its middle, with the color of data when it is checked.
- The app icon in the rail is 28 pixels, smaller than the 36 pixels of the references.
- On a desktop, the name of the reader in the top bar is a pill that holds the avatar and opens the menu of the profile beside it. A lecturer sees it beside the code for joining, and a desktop narrower than 1200 pixels shows only the avatar in the pill of a lecturer, so the name of the class keeps its room. The rail has no profile at its foot, so the screen draws the reader once, and nothing else in the top bar looks like a button without being one. A phone keeps the avatar in the top bar, which opens the same menu.
- An open `details` that holds a table shows about six rows and scrolls inside its own box, and the head of its table stays in view.
- A box that scrolls inside a page, such as an open table of values, the lists of the cards of Analisis, the list of Beranda since the last visit, and the reasons of Kelas, composes the global class `.scroll-box` of `app/theme.css`. It keeps a gap of `--space-2` between its content and its scroll bar on each side, and it reaches as far past its content, so a box that does not scroll keeps the edges of the text around it and a row whose ground reaches past its text never makes it scroll sideways.
- A field with an icon or a button beside its text, such as a search or the count of a ticket, draws its focus ring around its whole shape, never around the input inside it.
- An icon button, such as a star, never draws a box. While its form waits for the answer, its icon turns muted and the pointer shows the wait. A button that sends a form waits only after it sent its own form, so a link that changes the page restyles no other control.
- A screen changes the size of an avatar through `--avatar-size` and `--avatar-text`, so the avatar in the pill of the name stays inside the pill in every build.
- A popover stays beside its button. It takes the side with the most room, scrolls inside that room when it is taller, and never scrolls sideways. It no longer moves to the middle of the screen when neither side has room. A popover that holds no control, such as a table of values, is a stop of the Tab key, so a keyboard reaches it to scroll it. A "?" card that holds a table is wider than one without.
- A choice of a view, such as the axis of a map, the allocation of Analisis, a choice of Dampak, or the measure and the filter of Mahasiswa, uses `ViewLink` of `app/view-link.tsx`. Before JavaScript loads, the fragment of its address, where it has one, brings the reader back to the part that changed. Once the app runs, it changes the part in place, keeps the scroll position, and replaces the current entry of the history, so Back leaves the screen instead of stepping through earlier views.
- The label of a part that opens a table starts with "Tabel" in Bahasa Indonesia and "Table of" in English, such as "Tabel harga penutupan".

### Stocks and holdings

- The tile of a stock has no border, and it stands in the middle of the code and the name beside it, so a row shares one center.
- The row of Kas has no tile. It keeps empty room where a tile would be, so its name lines up with the codes above it.
- A weight fills its share of a track from 0 to 100%, so the weights of a portfolio and its cash add up to one full track. Cash fills from the other end in the color of a strong line. This holds for the holdings of Beranda, the portfolio of a student for the lecturer, and the allocation of Analisis.
- On the page of a stock, the way back is a small link "‹ Kembali ke …" above the name. The tile stands beside one column that holds the code with the star right after it, the name of the company, and the sector with the place of the stock in the portfolio, so the identity of the stock reads as one block. Beli and Jual stand at the end of the row of the name. On a phone they are a bar fixed above the tab bar, and the page keeps room for it.
- The price chart has a visible title in a row with its choice of range. The choice is a segmented choice like every other choice of a view, and its labels read "1 bln, 3 bln, 1 thn, 5 thn" in Bahasa Indonesia and "1 mo, 3 mo, 1 yr, 5 yr" in English.
- The four numbers of a position share one row on a wide screen.
- In Dampak, the choice of the size of the example purchase has a visible label under the title. "Buka tiket" ends the row of the sentence that the size changes, and the choice of the axis shares a row with the legend of the map.
- The docked order ticket is a panel only as tall as its form, so no empty panel runs down beside the page. It stays in view while the page scrolls and moves along its whole column, and it keeps the gap of the page above and below it, also while the note of a sample class stands above the page, so the standard of `AGENTS.md` that columns side by side end on one line excepts such a panel, and `e2e/expect-layout.ts` measures its column to the end of its track.
- The list of Beranda since the last visit scrolls inside its card after about four rows. It holds no control, so like such a popover it is a stop of the Tab key.

### Kelas

- The class map has no bars of the spread of the class at its edges. The median return of the class is a light dotted line across the whole plot, and the map keeps the padding of its panel.
- Kelas has no table of the students and no part for the calendar and the students. The help of the map says that Mahasiswa lists every student with their numbers, and that the portfolio of each student gives the times of its prices. The notice that replaces a map without data points to Mahasiswa too.
- Kelas no longer names the semester, the session of the week, or session 1 and 16 with their days. The class switcher names the term of each class, as [decision 0030](0030-each-class-is-one-workspace-with-its-own-addresses.md) sets. Belajar marks the session of the week. The card of discussion names the session of the week and asks for a missing date of session 1.
- The menu of the class switcher of a lecturer offers the calendar of the current class before creating a class. Its item takes the title of the page that it opens, "Jadwal kuliah" in Bahasa Indonesia and "Course calendar" in English, and the notice of the card of discussion about a missing date of session 1 names that page.
- The icon of a flag stands without a tinted tile, and a flag and a reason are rows that open something.

### Mahasiswa and the pages of a student

- Mahasiswa has no side panel. The whole row of a student is the link to the Ringkasan of that student, with the address of the list as the way back.
- The query parameter `student` of the address of Mahasiswa marks the row of that student, and the fragment of the address leads to that row. The back link of the pages of a student sets it, so the lecturer comes back to the same place in the list. A flag of Kelas that names one student sets it too. No row is marked otherwise.
- The "?" of the measure that ranks the class uses the marked student as its example, or else the first student that the list shows.
- The columns of the ranking share the spare width in proportion, and the heads of the columns of numbers stand at their right edge.
- The reason why a student has no measure stands inside the row of that student, right under the name, so it reads as part of the row.
- The pages of a student for the lecturer show the way back as a small link above the header. "Atur ulang kata sandi" is a button at the end of the header. The tabs are a compact choice, and the note that the view only reads stands beside them in muted text. The reset of the password that a page of a student opens leads back to that page, and its link reads "Kembali ke" with the name of the student.

### Aktivitas

- Aktivitas is one list of orders. It has no column of the journal and no choice of Order or Jurnal on a phone, and its address has no parameter `view`. Each order shows its reason. A filled order also shows the change of its price since the trade, and a sale shows its realised gain or loss from the average purchase cost.
- The bars of the changes share one scale, and the note of the time of the prices serves only the filled orders that the filter shows.
- A reason of Kelas leads to the row of its order on "Jurnal dan order", the tab of the student for the lecturer, which shows the same list.

### Analisis

- Each measure is one row. Its name keeps its "?", and one button holds its value, the value of the IHSG under it, and its scale, and opens its calculation. The text "Lihat perhitungan" no longer shows there, and only assistive technology reads it as the name of the button.
- The reference under a value reads "IHSG" and the value, such as "IHSG 0,05%", also for Jensen's alpha.
- Every list of measures, such as "Data dan metode", the calculations of a stock, and the IHSG with the risk-free rate, shows each measure as a block of the same parts in the same order: its name with its value beside it, a sentence that says what it computes, and its formula with its numbers. The blocks stand side by side where the screen has room, and the parts of the blocks of one line start at the same height. A calculation that opens in place shows the same parts, and a second measure that it needs, such as the return that CAPM requires of an alpha, as a part of its own. The formulas under a table, such as those of the stocks of a portfolio, follow a sentence that says that the columns of the table come from them, and each has its own sentence.

### The rules of earlier records

This record replaces these rules:

- In decision 0028, the labels of the ranges of the price chart, the panel of a selected student and the width at which it docks, the journal beside the orders of Aktivitas, "Lihat perhitungan" as what opens a calculation in Analisis, the profile at the foot of the rail, and the name or the code for joining in the top bar.
- In decision 0030, the student whom Mahasiswa shows in its panel as a view in the address, the panel of a selected student among what opens in place, the end of the menu of the class switcher, and Back that returns to an earlier view of the same screen.
- In decision 0032, what the page of the class names about the week of the course.
- In decision 0035, the bars of the spread of a class, the short line of its median, the table that keeps every student below the class map, and the return to a row of that table or to the administration.
- In decision 0040, the semester, the session, and the notice about a missing date of session 1 on Kelas.
- In decision 0041, the selected student in the address of Mahasiswa, the panel that selecting a student opens with what it shows and links, and a link from Kelas that selects a student outside the visible rows.

## Alternatives

- **Keep the references as they are.** The maintainer used them on the running app and found these parts hard to find, repeated, or unlike other apps, so they would stay as the review found them.
- **Keep the side panel of Mahasiswa and drop only its map.** The pages of each student already show the same values, the reason, and the reset of the password, so the panel would repeat them at the cost of a second place to keep in step.
- **Keep the table of students on Kelas behind its label.** Mahasiswa lists every student with the same numbers and the reason of a missing measure, and the portfolio of each student gives the times of its prices.
- **Keep a choice of a view in the history.** Back would step through every axis and filter that the reader tried before it leaves the screen, which the maintainer found slower than other apps.

## Consequences

- The references in `docs/design/peta/` still hold for every part that this record does not name.
- The images of Aktivitas and of Mahasiswa with its panel no longer show those screens as they are, so this record is the reference for what differs on them.
- A lecturer reaches the calendar of a class from the class switcher, the reset of a password from the page of the student, and every student from Mahasiswa, because Kelas no longer holds these parts.
- The guide for the lecturer and [the product brief](../product.md) describe the screens as this record sets them.
