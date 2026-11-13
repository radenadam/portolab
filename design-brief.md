# Portolab: design brief for the mock app

## What failed, so the mock never repeats it

The built app was a set of pages, one per feature: a list of classes, a class page of links, a prices table, a portfolio page, an orders page, a measures page. A student had to leave the class to see prices and walk back through three pages to trade. Pages explained themselves in paragraphs, so the portfolio read like a textbook. The stock picker was a native list that was unreadable in the dark theme. A student chose how much to buy without seeing the price history of the stock. The maintainer called it neither a trading app nor a learning app.

## What Portolab is

A trading simulator for a university course on portfolio management, where students practice managing a real-world portfolio of IDX stocks all semester, with virtual cash and real delayed prices, and with the theory of the course beside every decision. It must feel like a real broker app (Stockbit, Ajaib, IPOT are the reference for trading, Investopedia Simulator and StockTrak for classroom simulators), and teach like a good learning app (short, visual, in context, with depth on demand, like Duolingo's tips or Khan Academy's hints). Practice comes first. Material supports practice and never replaces it.

The course (16 sessions): 1 basic concepts of portfolio management, 2 portfolio theory, 3 time value of money, 4 the capital market, 5 instruments of the capital market, 6 the mechanism of trading, 8 midterm, 9 CAPM, 10 portfolio return and risk, 11 forward and futures, 12 mutual funds, 13 options, 14 bonds, 16 final. Students practice with stocks of the LQ45. Topics that the simulator cannot practice yet (derivatives, mutual funds, bonds) appear as learning material that says so plainly.

## Principles

1. **One workspace per class.** After sign-in, a student lands in the workspace of their class. Navigation never leaves it. A student in two classes switches with a class switcher in the header.
2. **Every screen answers one question.** Home: how is my portfolio doing? Market: what can I buy? Stock: is this stock right for my portfolio? Ticket: what does this trade do to my portfolio? Activity: what did I do and why? Analysis: how risky is my portfolio, and is the risk paid? Learn: what does this concept mean?
3. **Visual first.** Charts, bars, and big numbers carry the information. A sentence appears only where a number needs meaning. Above a chart sit at most a headline and one sentence of summary, both computed from the data, such as "Kelas unggul 2,16 poin dari IHSG".
4. **Theory in context, depth on demand.** Every concept label has a small "?" that opens a short card: one sentence of meaning, the student's own number as the example, and "Pelajari lebih lanjut", which opens its lesson in a sheet over the current screen. Formulas with the student's numbers sit behind "Lihat perhitungan".
5. **The trade is the lesson.** Before a student confirms an order, the ticket shows what the trade does to the portfolio: beta, expected return, volatility, the weight of the stock and of its sector, cash left, and the move relative to the security market line. This is where portfolio theory and CAPM become something a student feels.
6. **Think like a professional.** A portfolio manager writes why they trade. The ticket has an optional field "Alasan" (investment thesis), the activity log keeps it, and the lecturer reads it.
7. **Real mechanics, explained when they bite.** Lots of 100 shares, tick sizes, auto rejection limits (ARA and ARB), broker fees and the tax on sales, sessions of IDX, delayed prices. The ticket enforces each rule and explains it in one sentence at the moment it applies, with the fix as a button, such as "Ubah ke 18 lot".
8. **Simulation and delay, said once.** A small badge in the header says "Simulasi · harga tertunda ±10 mnt", with a "?" that explains it. Each price shows its time on hover or in small muted text. No screen repeats this in prose.
9. **No recommendations.** Portolab never suggests a stock. Nudges are about concepts only, such as "62% portofolio Anda di sektor Keuangan. Apa artinya untuk risiko?", linking to the lesson on diversification.
10. **Gains and losses look like a trading app.** Green for up, red for down, as IDX apps show them, always with a sign and an arrow too, in tints that stay distinguishable for color-blind readers. In the same way, Beli is green and Jual is red wherever a trade starts or is confirmed.
11. **One map is the home of every screen** (the direction "Peta", which the maintainer chose on 13 Nov 2026 with the reference `portolab-peta-reference.html`). The map plots risk across (beta, or the standard deviation per month) against return up, with the IHSG as a diamond at beta 1. The maps of the class, of the market, and of the analysis also draw the return of the IHSG as a dashed line. The maps of the class and of the market put plain labels in their four corners, and the map of the class marks "Modal awal" at 0% and the median of the class. The student's map on Beranda leaves those out, because the labels of its own points need the room. Each screen places its own subjects on it: the students of a class, the stocks and the portfolio of a student, the stocks of the market, the portfolio before and after a trade. Tables draw their numbers on shared scales, as inline bars and dots with the IHSG as a reference tick, so rows compare at a glance.
12. **The layout holds at every width and zoom.** The content keeps a maximum width and stays centered beyond it, so a wide screen or a zoomed-out browser adds margins instead of stretching. Columns keep their proportions, so no column stays small while its neighbor grows. Cards that sit side by side share one height, and side-by-side columns end on the same line, so no column or row leaves an empty gap at its foot. A table gives its spare width to one column instead of spreading every column apart. Tables with the same columns on one screen, such as the watchlist above the list of the market, put each column at the same position. A page of reading, such as a lesson, centers its column, and a side panel appears only when it carries something useful.
13. **No zig-zag.** Information that a person asks for while doing something opens in place, as a popover, an inline expansion, or a sheet over the current screen, and closing it returns them exactly where they were, with their input kept, such as an order in progress. This covers "?" cards, key terms, formulas, and lessons opened from another screen. A link that navigates lands on the exact thing it names, says in one line why the person is there when they came from a lesson, and leads back to the exact place they came from. Something that looks clickable does what its label says, and something that only informs does not look clickable.
14. **Companies are recognizable.** Each stock shows the logo of its company beside its code where stocks are listed or headlined: the market list, the holdings, the stock header, the ticket, the activity, and the search. A logo fills its tile enough to read at the size of the tile, so a wide wordmark is scaled to the tile's width. Maps and running text show the code alone.

## Screen map (student)

Desktop: a rail of 76 pixels with the logo on top, one icon with its label under it for each item, and the profile at the bottom, and a top bar with the class switcher (course · class, term, chevron), the name of the student, and the simulation badge. Phone: the same top bar, shortened, and a bottom tab bar with the same 5 items.

1. **Beranda (Home):** the reference screen "Mahasiswa / Beranda".
   - Left column: the value of the portfolio large, with today's change in rupiah and in percent. A card "Sejak 14 Okt" with the headline "Unggul (or Tertinggal) X poin dari IHSG", its keys, and a line chart of the portfolio against the IHSG with a crosshair. A card "Risiko dibanding pasar" with beta, risk per month, and Sharpe, each drawn as a dot on a scale with the IHSG as a tick, a one-line meaning, and a link to Analisis.
   - Right column: the panel "Posisi Anda di peta" with a toggle Peta or Grafik waktu. The map shows the portfolio (saffron, with a ring), each holding sized by its weight and labelled with its result, the IHSG, and classmates as faint unnamed dots. Grafik waktu shows the portfolio against the IHSG large, with the sessions of the course marked along the top. Under it, one insight row: the session badge (such as "Sesi 9 · Beta"), one sentence computed from the portfolio, and "Pelajari".
   - Full width: the holdings with weight bars, lots, average price, price with today's change, value, profit or loss as a diverging bar with rupiah and percent, and a one-month sparkline, then a row for cash with the amount set aside for open orders. A tap opens the stock.
   - "Sejak kunjungan terakhir" stays above the columns when something happened. Sector allocation moves to Analisis, and the concept nudges become the insight row.
   - Empty state: the map with only the IHSG and the classmates, a welcome card that explains the Rp100 juta of virtual cash in one sentence, a button "Cari saham pertama Anda", and the lesson "Cara membaca harga saham".
2. **Pasar (Market):**
   - An IHSG card with its chart and change.
   - Search by code or name, chips by sector, sort by change, price, beta, or volatility.
   - A watchlist (star a stock) on top.
   - A toggle Daftar or Peta. Daftar lists each stock with code, name, sector, sparkline, price, and change in color. Peta places every stock by beta and return over the chosen range, with the IHSG and the student's portfolio. A tap on a row or a point opens the stock.
3. **Saham (Stock detail):**
   - Header: code, name, sector, price, change, time of the quote.
   - A large price chart with ranges (1M, 3B, 1T, 5T) and a crosshair that shows the date and the close.
   - Key statistics in a grid: day range, 52-week range, beta, volatility per month, expected return per month, correlation with the student's portfolio. Each with "?".
   - "Posisi Anda" when held: lots, average cost, value, P/L.
   - "Dampak ke portofolio" preview: if you put 10% of your portfolio here, beta goes from 0,55 to 0,68 and volatility from 4,2% to 4,9%, and a small map draws the portfolio moving from now to after. This teaches diversification before the student even opens the ticket.
   - Buttons Beli and Jual: sticky at the bottom on a phone, and a docked ticket panel on the right on a desktop.
4. **Tiket order (Order ticket):** a bottom sheet on a phone, a side panel on a desktop.
   - Buy or sell, market or limit.
   - Lots with a stepper and quick chips (25%, 50%, Maks).
   - The limit price with tick steppers that move by the tick size, and the ARA and ARB band shown.
   - The cost breakdown: value, broker fee 0,15%, tax 0,1% on a sale, total, cash after.
   - "Dampak ke portofolio": before and after for beta, expected return, volatility, the weight of the stock, and the weight of its sector, with arrows, and the same small map as on the stock.
   - "Alasan (opsional)", with a placeholder such as "Mengapa Anda membeli saham ini?".
   - A confirm button with the total. Validation inline with the fix as a button.
   - After confirming: a short success state that tells when the order fills (now during a session, or at the next session), then the activity.
5. **Aktivitas (Activity):**
   - Orders with status chips: menunggu, terisi, ditolak, kedaluwarsa, dibatalkan. Cancel on open orders.
   - The trade journal: each filled trade with its reason, the price, and how it has done since.
   - Filter by status.
6. **Analisis (Analysis):** the course in practice, sessions 2, 9, and 10.
   - It opens with the map, with the toggle Beta or Simpangan baku. On beta, the security market line runs from the risk-free rate at beta 0 through the IHSG, and the alpha of the portfolio and of each holding is drawn as its distance from the line. On standard deviation, the map shows total risk, which is where diversification shows.
   - Summary cards: expected return, standard deviation, beta, Sharpe, Treynor, Jensen's alpha, each with "?" and "Lihat perhitungan".
   - Sector allocation, which moved here from Beranda.
   - Risk against return of the holdings and of the portfolio as a scatter, showing that the portfolio has less risk than the average of its stocks (diversification made visible).
   - A heatmap of the correlations between holdings.
   - Contribution of each holding to the risk of the portfolio, as bars.
   - Performance against the IHSG over time.
   - Every number has its formula with the student's numbers behind "Lihat perhitungan", ready to redo in a spreadsheet.
7. **Belajar (Learn):**
   - Lessons by session, 1 to 16, as cards with the session number, the title, a one-line summary, and "Praktikkan" where the simulator can practice it. Each lesson is short and visual: key idea, a diagram or a small interactive (such as a slider of beta that moves a point on the SML, or the effect of correlation on two-stock risk), the student's own numbers, and two or three key terms that expand in place. The practice of a lesson shows the student's own data in the lesson itself, such as the risk contribution of each of their holdings, and gives one concrete task. When the task needs another screen, it opens that exact control with the task in one line and a way back to the same place in the lesson. A lesson without a meaningful practice has none.
   - Lessons the simulator cannot practice (forward and futures, mutual funds, options, bonds) say "Materi ini belum dapat dipraktikkan di simulasi" and keep the key ideas.
   - A glossary (Kamus) with search, which the "?" cards and key terms also open in place.

## Lecturer

A lecturer switches to the classes they teach. Their workspace has:

The top bar holds the join code as a chip that copies it and opens the join address.

1. **Kelas:** the reference screen "Dosen / Kelas".
   - The date and time, the headline "Kelas unggul (or tertinggal) X poin dari IHSG", and one sentence: the median return against the IHSG, how many students are above the market, and how many portfolios are calmer than the market.
   - The map of the class, with the toggle Beta or Simpangan baku. Students who traded this week are filled dots, the others are hollow, and the notable ones are named. Bars on the top and right edges show the spread of the class, which replaces the two histograms. A line marks the median of the class. A stat strip under it: students, active this week, orders this week, median beta.
   - Right column: "Perlu perhatian", the students that the data flags (the largest loss, the most volatile, no stocks yet, inactive this week), each opening the student. "Bahan diskusi" for the current session: two questions computed from the class, and a link to the lesson. "Alasan terbaru": the latest reasons, with "Semua".
2. **Mahasiswa:** the reference screen "Dosen / Mahasiswa".
   - A table ranked by Jensen's alpha by default, with a toggle for Sharpe or Treynor, a search by name or NIM, filter chips with counts (Semua, Di bawah IHSG, Belum aktif minggu ini, Beta di atas 1), and "Unduh workbook".
   - Columns: rank, student with NIM, return as a diverging bar with the IHSG tick, beta as a dot with the tick at 1, risk per month, the measure, and the last activity.
   - The selected student shows in a panel on the right: their point on the class map, the key numbers, one sentence computed from their numbers, their allocation, their latest reason, "Buka portofolio" (the read-only dashboard and analysis), and "Jurnal alasan". On a phone, the panel opens as a sheet.
3. **Portofolio:** the lecturer's own demonstration portfolio in the class, so they can trade in front of the class. It has the same Beranda, ticket, Aktivitas, and Analisis as a student, as tabs Ringkasan, Aktivitas, and Analisis. It counts in no statistic, map, or ranking of the class, and students do not see it.
4. **Pasar** and **Belajar** as for students, with Beli and Jual into the lecturer's own portfolio.

The lecturer's navigation is Kelas, Mahasiswa, Portofolio, Pasar, and Belajar.

## Mock data

About 15 stocks of the LQ45 with real names, sectors, and plausible prices for November 2026, each with about 5 years of daily closes from a seeded random walk whose beta and volatility differ by stock: banks low beta, miners high. Also the IHSG series, a BI-Rate of 4,75% per year, and a student portfolio of 5 holdings across sectors with a history since mid-October, orders in every status, and a journal with reasons. Also a lecturer class of about 30 students with spread-out results. Every measure in the mock is computed from these series with the real formulas, so the numbers agree everywhere.

## Interaction

- Routing works with the back button. Each screen has its own address in the hash.
- The ticket really changes the state: a market order during a session fills at once and updates cash, holdings, the dashboard, and the analysis, and a limit order rests as open.
- Validation reproduces the real rules with real numbers: not enough cash, a price outside ARA or ARB, a price off the tick, more lots than held.
- The "?" cards and "Lihat perhitungan" work everywhere.
- A toggle for light and dark themes, which follows the system by default.
- A small demo control to switch between the student and the lecturer view. It belongs to the mock only.

## Look

The tokens, fonts, and parts of the reference `portolab-peta-reference.html` (the `.dA[data-mode]` and `.m` rules). Cool charcoal surfaces, blue for data, saffron for the student's own or the selected point, green and red with triangles for gains and losses, amber for the simulation badge and for warnings, and ink for the primary button. Instrument Sans for text, with tabular figures for numbers, and DM Mono for chart labels, stock codes, NIM, and the join code. The app icon is a flask, for the lab in Portolab, with a rising zigzag line inside it, drawn in code from the reference `20-app-icon-reference.png` on no background, so it sits on the rail like the other icons. The flask takes the ink of the theme and the line the green of gains. Panels with a radius of 14 pixels. Touch targets of at least 44 pixels, polished hover and focus states, smooth sheet transitions, and charts with hover tooltips and crosshairs. It must hold up next to Stockbit on a phone and next to a good dashboard on a laptop.
