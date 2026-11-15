# 0047. Chart names use an ellipsis when they are too wide

- Status: Accepted
- Date: 2026-11-16

## Context

The lecturer's student screens reuse Beranda and Analisis with the student's name. A valid name can be one word of the maximum length that the account accepts. The measured-name browser cases found that the map omitted this name because no candidate place could contain it. The return chart also reserved its full width beside the last point, which could leave no room for the plot. Its end-label room used the smaller axis font, while the label used the text font. Average glyph widths also underestimated wide letters, so the displayed label could extend beyond its reserved room.

[Decision 0035](0035-the-map-names-its-points-in-words-and-keeps-the-name-of-the-reader.md) keeps the name of the portfolio at every width. It did not say how to fit a name wider than the plot.

## Decision

- Names beside map points and at the ends of return lines use `chartName` in [`app/charts/chart-name.ts`](../../app/charts/chart-name.ts). A fixed comparison point keeps its complete course label. The helper leaves an ordinary name intact. When the name exceeds its width allowance, it takes complete graphemes from the start and adds an ellipsis. The font-width estimate and the named allowance in that module bound the result before JavaScript loads.
- Shortening changes only the name beside a mark. The heading, legend, tooltip, and data table retain the name that their caller gives them. A student screen keeps the student's full name in its heading.
- The map still places the portfolio and every holding ahead of other labels. A shortened name has the same priority as an ordinary name. Only its accompanying value may drop when room runs out.
- Browser cases include measured portfolios whose names have the maximum length in letters and digits, in both languages. They check the visible label, the complete heading and legend, the rendered bounds of end labels, and the layout at the reference widths, before and after JavaScript loads.

## Alternatives

- **Wrap the whole name beside the mark.** A maximum name would occupy several lines and cover other points. The full name already has room outside the plot.
- **Shrink the letters to fit.** A maximum name would become too small to read on a phone.
- **Omit the name when it does not fit.** The reader would lose the name of the portfolio that the map is about.

## Consequences

- The marks of an unusually long name remain identifiable on a narrow screen, while the complete name stays outside the plot.
- Two names can have the same prefix. Their full names remain in the tooltip and table, and the selected student's heading names the portfolio that the lecturer opened.
