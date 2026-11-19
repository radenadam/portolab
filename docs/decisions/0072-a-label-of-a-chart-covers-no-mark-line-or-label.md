# 0072. A label of a chart covers no mark, line, or label

- Status: Accepted
- Date: 2026-11-19

## Context

[Decision 0035](0035-the-map-names-its-points-in-words-and-keeps-the-name-of-the-reader.md) places the names of a map clear of the marks of other points and of other labels, and it lets a kept name, such as "Portofolio Anda", cross its own mark when no place follows every rule. The placement knew no lines. On 19 November 2026 the security market line of Analisis ran through "Portofolio Anda", the labels "IHSG -0,31%" and "SML" lay across the stems of alpha on a phone, lesson 9 drew its line through "β 0,55", and the maps of Beranda, of a student, and of the demonstration portfolio put "Portofolio Anda" on its own ring. The maintainer set the rule that a label of a chart never covers a mark, a line, or another label.

## Decision

- The lines of data of a map are obstacles for every label, as its marks are: the line of the return of the IHSG, the line of the map, such as the security market line, the median of a class, the stem of each point, each arrow with its head beside the mark that it points at, and the curve of two stocks with the line between them. `mapObstacles` of `app/charts/map-obstacles.ts` lists them from what the drawing draws, and the drawing marks each with `data-map-line`. The lines of the grid lie under the labels, also the strong lines at zero and at the risk of the IHSG, because they belong to the axes.
- Only the letters of a label keep clear of a line, so a label of a line, such as "IHSG 2,71%", stands on the outline beside its own line, as before.
- A label of a line tries its places from the left end of its line and then from its right end, because the strong line at the risk of the IHSG can cross every place from the left.
- A kept name keeps clear of every mark and every line of data before it stays nearer its own point than to another point, which turns the order of decision 0035, because a name over a point or a line hides what the map draws. A kept name without a clear place beside its mark also tries places farther from it and the gutter beside the plot. A place over its own mark costs as much as a place over another name, so a kept name takes it only when every other place also covers a name.
- The costs of the broken rules of a place are whole numbers that add up in any order, and the distance to its own point joins them once, so the order in which a caller lists the points never moves a name.
- `e2e/expect-map-labels-clear.ts` checks every label of every map that a screen shows against every other label, every mark, its own included, and every line marked with `data-map-line`, and `e2e/expect-accessible-screen.ts` runs it on every screen.

## Alternatives

- **Lines of the grid as obstacles too.** A label would then never cross the strong line at the risk of the IHSG, but a long label, such as the median of a class, finds no place on a phone in either half of the plot, and the corners of a narrow map go too.
- **Names that stay nearer their own point first.** A kept name could keep its link to its own point before it keeps clear of marks, as decision 0035 set, but then it covers the ring of the portfolio or the dots of classmates where the map is crowded, which is the defect.

## Consequences

- A fixed label without a clear place is left out, so a phone can show a map without the label of the line of the IHSG, whose value the legend and the measures still give.
- A kept name in a crowded map can stand nearer another point than its own, where the place beside its own point would cover a mark or a line. A map so crowded that a kept name finds no clear place at all still draws the name in the place that breaks the fewest rules, and the check of every screen then fails, so that the map gets more room or fewer names.
