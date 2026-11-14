# 0035. The map names its points in words and keeps the name of the reader

- Status: Accepted
- Date: 2026-11-14

## Context

[Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) makes one map of risk against return the home of every screen. The map of the class places its students, the home of a student places the portfolio among unnamed classmates, the market places every stock, the analysis places the portfolio and its stocks against the security market line, and a trade moves the portfolio from before to after. The approved prototype names each point beside it in the font of the text, as the references draw it, and its approval set the rules of these names: a name sits next to its own point and nearer to it than to any other point, with a gap from every other name, and the reader's own points never lose their name.

The first map replaces the chart of the security market line on the measures of a portfolio, which [decision 0023](0023-the-chart-of-the-security-market-line-draws-the-months-of-the-portfolio.md) set. That chart names the risk-free rate, the IHSG, and the portfolio with the symbols of [decision 0020](0020-a-formula-shows-the-notation-of-the-textbooks.md), R with the subscript f, M, and p, its axes with β and E(R), and only the stocks of the portfolio by their codes. It is hidden from assistive technology, and the browser measures its frame and lays it out again at that size.

[Decision 0029](0029-the-server-draws-every-chart-as-svg.md) has the server draw every chart at fractions of its plot, because the server does not know the width of the screen, and it sets the texts of the marks in DM Mono, whose equal characters let the server count the room of a text. The font of the text draws each letter at its own width, so the server can only estimate the width of a name, and a name that fits beside its point on a wide screen can cover another point on a phone.

## Decision

- The map places each point by its risk across, which is its beta on the measures of a portfolio, and its return up, which is its expected return per month there. The IHSG is a diamond on a strong line through its risk, with a dashed line at its return that its label names, such as "IHSG 0,05%". The security market line runs from the risk-free rate at a beta of 0 through the IHSG to the right edge, and its label and the legend call it SML. The axis of returns always shows zero.
- The point that the map is about, which is the reader's own portfolio or the one that the reader opened, takes the color of the reader's own point with a ring around it. A stock that the portfolio holds is a filled dot whose area grows with its weight, and any other stock is a hollow dot.
- The map names each point in words: the portfolio by its name, and a stock or the IHSG by its code. It marks no point at the risk-free rate, where the line starts on the axis of returns. The table of the points and the formula of the line keep the symbols of decision 0020, because their numbers use them.
- A name sits next to its own point, nearer to it than to any other point, clear of every other mark, inside the plot, and with a gap from every other name and label. The reader's names take their places first, then the labels of the lines, then the names of the stocks of the portfolio, the IHSG, and the other stocks. A name of the reader keeps the place that breaks the fewest of these rules when no place follows them all, and any other name or label without such a place is left out. So a stock that the portfolio does not hold has its name wherever the plot has room, and the table of the points stays the one place that names every point.
- Names use the font of the text in semibold, and only the marks of the axes use DM Mono. The server estimates the width of each name from the average widths of the letters of the font and places the names in the plot of a phone 360 pixels wide, the narrowest, in which the marks lie closest together. Once JavaScript runs, the browser measures each name and the plot after the fonts load, and it places the names again whenever the plot changes its size.
- The table of the points stays below the map, behind a label that opens it. Once JavaScript runs, the map is a slider over its points in the order of their risk, as decision 0029 makes a chart over time a slider over its dates. A pointer, a finger, or the arrow keys, Home, and End mark a point, and a tooltip shows its values. Until a reader marks a point, the slider reads the point that the map is about, or the IHSG when there is none.
- Each other screen places its own points on the same map. The parts that only those screens draw, such as the bars of the spread of a class at the edges, the median of the class, the labels of the four corners, unnamed points of classmates, and a value beside a name, come with the first screen that shows them, as issue #127 tracks.

## Alternatives

- **Names in DM Mono, counted in characters, as decision 0029 sets for the texts of marks.** The server would place them without an estimate, but the approved design sets the names in the font of the text, and a name in DM Mono reads like a mark of an axis.
- **Names that only the browser places.** A map would show no names until JavaScript loads, and none at all where JavaScript never runs.
- **The symbols R with the subscript f, M, and p beside the points.** The design names the points in words, which a student reads at a glance on every screen of the map, and the symbols stay where their numbers are, in the table and the formula.
- **Every name of a point placed, also over other marks or names.** On a phone, the names of the stocks of the market would cover each other and the points, so neither would read.

## Consequences

- Decision 0023 keeps its rules about which months the line uses and which stocks the chart places, and the map follows them. Its rules about the labels of the points and the symbols of the axes, about a chart hidden from assistive technology, and about the browser laying out the chart at the size of its frame give way to this record, as its status line says.
- DM Mono sets the marks of the axes of a chart, but no longer the names of the points of a map, which changes a rule of decision 0028 and one of decision 0029, as their status lines say. [`app/charts/AGENTS.md`](../../app/charts/AGENTS.md) holds the standard.
- Before JavaScript loads, a wide screen shows the names where the server placed them for a phone, so a name that only a wider plot has room for stays out until the browser places the names again.
