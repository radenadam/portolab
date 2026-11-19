# 0065. The welcome has measured shared and route allowances

- Status: Accepted. [Decision 0067](0067-shared-parts-have-measured-allowances.md) replaces its JavaScript ceilings for every set that it names, and its CSS ceilings for class home, Market, the stock page, and the lecturer's student summary. [Decision 0069](0069-the-review-of-19-november-2026-has-measured-allowances.md) replaces its CSS ceilings for Activity, demonstration summary, demonstration Activity, demonstration analysis, student analysis, the ticket, and the lecturer's student analysis and journal.
- Date: 2026-11-18

## Context

Piece 28 of #127 gives a student without holdings, orders, or changed cash a welcome on Beranda, and the introduction of the approved prototype opens from it in three steps. The introduction shows the app icon beside the name of Portolab, the simulation chip of the frame, the IHSG as a sparkline, and the impact rows of the ticket. No dependency is added.

The frame loads the app icon and the simulation chip on every page. Beranda now loads them too, so the build moves them from the root chunk into a chunk that the root and Beranda share. The impact rows move from the chunk of Saham and the ticket into a chunk of their own, and the check for an unmodified click moves from the learning overlay into a chunk that every class route shares. Each of these chunks adds its own compressed overhead to every set that loads it. The demonstration summary and the lecturer's student summary share the map panel of Beranda, which now draws the welcome as well.

## Measurements

The comparison builds main at `7859fec` and this change, rebased onto that main, on the same machine, with `pnpm build` and `pnpm size`. Both use the compression and complete dependency walk of [decision 0038](0038-client-javascript-is-budgeted-by-route.md) and [decision 0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes.

| Dependency set              | Main JavaScript | This change JavaScript | Main CSS | This change CSS |
| --------------------------- | --------------: | ---------------------: | -------: | --------------: |
| Shared code                 |          142.78 |                 143.11 |     7.90 |            8.16 |
| Class home                  |          235.42 |                 240.84 |    25.54 |           27.40 |
| Market                      |          220.84 |                 221.28 |    22.89 |           23.15 |
| Activity                    |          211.17 |                 211.61 |    20.18 |           20.44 |
| Demonstration summary       |          224.33 |                 225.45 |    23.26 |           23.57 |
| Demonstration Activity      |          212.03 |                 212.48 |    20.82 |           21.08 |
| Demonstration analysis      |          230.29 |                 230.72 |    22.66 |           22.92 |
| Student analysis            |          229.42 |                 229.85 |    22.03 |           22.29 |
| Stock                       |          230.40 |                 231.24 |    23.03 |           23.54 |
| Ticket                      |          238.17 |                 239.00 |    25.85 |           26.36 |
| Class ranking               |          206.40 |                 206.84 |    20.26 |           20.52 |
| Lecturer's student summary  |          225.13 |                 226.25 |    23.65 |           23.96 |
| Lecturer's student analysis |          230.78 |                 231.20 |    23.05 |           23.31 |
| Lecturer's student journal  |          212.33 |                 212.77 |    21.21 |           21.47 |

Every class route gains about 0.44 kB of JavaScript and 0.26 kB of CSS, which the shared chunks and the click check carry. Beranda adds 5.42 kB of JavaScript and 1.86 kB of CSS for the welcome and the introduction. The demonstration summary and the lecturer's student summary add 1.12 kB of JavaScript for the panel. Saham and the ticket add about 0.84 kB of JavaScript and 0.51 kB of CSS, because the impact rows and the name of a point of the map get chunks of their own.

## Decision

The following ceilings replace the earlier ceilings only for these dependency sets. A set gets an allowance when this change takes it past its ceiling, or within 30 bytes of it, because the manifest of a build differs by a few bytes between machines. Every other ceiling and the complete dependency walk keep their rules.

| Dependency set              | JavaScript ceiling, kB gzip | CSS ceiling, kB gzip |
| --------------------------- | --------------------------: | -------------------: |
| Shared code                 |                       143.4 |                   20 |
| Class home                  |                       241.1 |                 27.6 |
| Market                      |                       221.5 |                 23.4 |
| Activity                    |                       211.9 |                 20.7 |
| Demonstration summary       |                       225.7 |                   24 |
| Demonstration Activity      |                       212.7 |                 21.3 |
| Demonstration analysis      |                         231 |                 23.2 |
| Student analysis            |                       230.1 |                 22.5 |
| Stock                       |                       231.5 |                 23.8 |
| Ticket                      |                       239.2 |                 26.6 |
| Class ranking               |                       207.1 |                 20.8 |
| Lecturer's student summary  |                       226.5 |                   24 |
| Lecturer's student analysis |                       231.4 |                 23.6 |
| Lecturer's student journal  |                         213 |                 21.7 |

## Alternatives

- **Keep the earlier ceilings.** The combined dependency sets fail them.
- **Copy the icon, the chip, the impact rows, or the click check into Beranda.** The copies would stay out of the shared chunks, but they would drift from the parts that the frame, the ticket, and the learning overlay use.
- **Leave the icon out of the introduction.** The approved prototype names Portolab with its icon there.
- **Load the introduction in a deferred import.** The complete route budget counts deferred imports, so the ceilings would still change.

## Consequences

`scripts/client-route-limits.ts` keeps the allowances on their named sets, and its tests check the exact routes and the default limits of similarly named routes. The welcome and every step of the introduction work before JavaScript loads, so the added JavaScript only enhances them.
