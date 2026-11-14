# 0040. The lecturer chooses the measure that ranks the class

- Status: Accepted
- Date: 2026-11-14

## Context

Decision 0021 chose the distance from the security market line because Portolab did not compute Sharpe or Treynor. Decision 0031 added them and named the distance Jensen's alpha. The approved Mahasiswa screen compares the students by any of these measures, and issue #93 asks for that choice in the workbook too.

## Decision

- Mahasiswa ranks by Jensen's alpha unless the lecturer chooses Sharpe or Treynor. Values descend, and ties keep the order of joining. Every student without the chosen measure follows in joining order, with the reason. A missing Sharpe or Treynor does not hide the other measures.
- The ranking measure, filter, search, and selected student belong to the query parameters `measure`, `filter`, `q`, and `student` of the students address of decision 0030. Search matches the name or username because NIM is outside this cut of the rebuild. Counts on filters cover the whole class, and the count below the list gives the number shown out of the whole class.
- The last activity is the placement of the latest order. The filter of inactivity uses the current calendar week in WIB, starting on Monday, so it answers the same question as the weekly class view.
- The table compares return since the student could trade, beta, monthly standard deviation, the chosen measure, and the latest order. Its shared return scale marks the return of the IHSG over each student's own period, and its beta scale marks the beta of the market. The portfolio of each student gives the quote times and failed updates behind these values.
- Selecting a student opens their panel. It docks at the width that decision 0028 sets and becomes a modal sheet below it once JavaScript loads. Before JavaScript loads, the selected panel is part of the page, and its address lands at its heading. Closing it keeps the list controls and returns focus to its row when the current list includes it. The panel shows the selected point on the class map, the values, the allocation, the latest reason of a filled order, and links to the portfolio, analysis, reason journal, and password reset. The map compares each student's return since they could trade, with the IHSG over the selected student's period.
- The workbook always contains the whole class in the chosen ranking order, including when a search or filter narrows the screen. It adds Sharpe as a decimal and Treynor as a percentage to the columns of decision 0022, without rounding their values. Separate columns give the reason for an unavailable Sharpe or Treynor. Its notice names the chosen ranking measure.

## Alternatives

- **Keep Jensen's alpha as the only order.** It leaves a lecturer who grades by another measure to sort every download, while the approved design offers the choice beside the class.
- **Rank in the browser.** It saves a request but adds browser code and leaves the control unusable before JavaScript loads. Links and a GET search form keep the server responsible for the order.
- **Export only the filtered students.** It would make a search silently omit students from grading. The filters narrow the screen, while the workbook remains a class record.
- **Use the raw field bound for a return address.** Encoding expands a full search, so this would discard a valid return address. The shared return parser gives it room while still bounding it.
- **Treat the previous seven days as this week.** A rolling interval changes the group during the week, while the class meets on a weekly calendar.

## Consequences

- Jensen, Sharpe, and Treynor use the monthly inputs of decision 0031. Choosing one changes the comparison, without changing how a measure is computed.
- A link from Kelas can select a student even when a search or filter leaves that student outside the visible rows.
- The panel links to the existing portfolio, analysis, and reason section until piece 32 rebuilds those pages. It gives the reason journal its exact fragment so the link already reaches what it names. These pages and password reset keep the originating student selection and list controls in their return address. That address returns only to Mahasiswa of the same class, and the shared return parser allows the encoded search within its bound, including through sign-in.
