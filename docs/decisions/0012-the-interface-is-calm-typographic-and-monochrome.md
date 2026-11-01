# 0012. The interface is calm, typographic, and monochrome

- Status: Accepted
- Date: 2026-11-01

## Context

Students use Portolab on their phones, and lecturers show it on a projector. Most of what they read is numbers: prices, returns, betas, and measures of risk. Three visual directions were mocked up with the same example portfolio and the same rejected order, on a phone and on a desktop, in light and dark themes. The first lecturer to teach with Portolab chose between them.

## Decision

- IBM Plex Sans sets the text. IBM Plex Mono sets the numbers that stand on their own, such as the cells of a table, so digits line up in columns. A number inside a sentence stays in the font of the text.
- Portolab serves both fonts itself from the Fontsource packages, so a page loads nothing from another server and works on a local network without internet.
- The colors are neutral, with one indigo signal color that marks links, focus, and the current choice.
- A light and a dark theme follow the setting of the reader's device.
- Gains and losses use the ink color, never red or green. A sign and an arrow carry the meaning, such as ▲ +0.81% and ▼ -0.80%.
- Space and thin lines separate the parts of a page, instead of boxes and shadows.

The chosen palette:

| Role       | Light     | Dark      |
| ---------- | --------- | --------- |
| Background | `#F8F8FA` | `#121216` |
| Surface    | `#EEEEF3` | `#1C1C24` |
| Ink        | `#16161D` | `#ECECF1` |
| Muted      | `#5E5E6C` | `#9D9DAC` |
| Line       | `#E2E2EA` | `#2A2A34` |
| Signal     | `#3F3DC8` | `#A9A8FF` |
| On signal  | `#FFFFFF` | `#15142B` |

`app/theme.css` defines each role as a token when the interface first uses it.

## Alternatives

- **Terminal.** One dense, dark screen like a broker's trading terminal, with condensed labels and amber actions. Gains and losses use teal and rose with signs and arrows. It suits experienced traders more than students who are learning to read a portfolio.
- **Buku tulis.** Every measure appears as a worked example, with the formula, the real inputs, and the result together, on ruled paper or a chalkboard. It teaches well, but it needs three typefaces and makes every screen long on a phone.
- **Fonts from the servers of Google Fonts.** Simpler to add, but every page would depend on a server abroad, which fails on a local network without internet and tells Google who reads Portolab.
- **The fonts of each device.** Nothing to download, but the widths of text and digits change from one device to another, so a layout that fits a phone in the browser tests may not fit the phone of a student.

## Consequences

- Color never carries meaning by itself, so the interface works for readers who cannot tell red from green, and on a projector that washes colors out.
- A chart with two series draws them in ink and in muted gray with a dashed line, because the palette has no second strong color.
- Every text color passes WCAG AA against the background and the surface of its theme.
- A browser downloads the two fonts for Latin text once, about 60 kB in all, and keeps them for later pages.
