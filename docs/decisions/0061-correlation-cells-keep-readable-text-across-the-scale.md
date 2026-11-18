# 0061. Correlation cells keep readable text across the scale

- Status: Accepted
- Date: 2026-11-17

## Context

The heatmap of [Peta](0028-every-screen-follows-the-reference-screens-of-peta.md)
mixes blue or purple with its raised surface in Oklab. Above an absolute
correlation of 0.55, its prototype writes white text. A Chromium probe with
the installed Axe 4.14 reports contrast of 2.39:1 at a correlation of -0.60
and 2.52:1 at 0.60 in the light theme. The negative endpoint gives 4.37:1
in light and 2.83:1 in dark. Axe requires 4.5:1 for these small numbers.

The sample holdings do not reach every endpoint, so checking the sample alone
can miss this failure. The table must remain readable when two holdings move
perfectly together or in opposite directions.

## Decision

The off-diagonal cells keep Peta's blue and purple hues and the raised surface at zero.
`correlationFill` interpolates in sRGB and limits the blue endpoint to 70% of
its color and the purple endpoint to 60%. The rest is the raised surface.
Cells keep the existing ink color in both themes. This replaces the
prototype's full saturation and white text threshold for correlation cells.

The legend gets its endpoints from that same function, so its colors agree
with the values in the off-diagonal cells. The diagonal stays neutral because its self-correlations are always one. Values that round to zero use the neutral
surface, through the same rounding comparison as other charts.

The browser check reads the legend's endpoint colors and checks them with
the cell ink in both themes and languages. These extra samples are removed
before screenshots. The existing screen check still covers the real cells.

## Alternatives

- **Keep the prototype's white text threshold.** The observed contrast fails
  the accessibility check for valid correlations.
- **Keep full saturation and choose a foreground for each cell.** This needs
  separate thresholds for each hue and theme, which can drift when a token
  changes. Bounded tints let every cell share the existing ink token.
- **Keep full saturation only in the legend.** Its endpoint would then name
  a different color from a cell with the same correlation.

## Consequences

The cell colors are less saturated than the reference. The numbers, signs,
and calculations keep their values. The change adds no browser dependency
and works before JavaScript loads.
