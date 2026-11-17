# 0056. The market map has measured route allowances

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 25 of #127 adds the approved map of Pasar. It reuses the risk map, its label placement, its legend, and its native point controls. The corners share the placement code of the class map without loading its distribution drawing. Pasar keeps the same stock table in its list view. Its new controls and messages stay on the market route.

The native point controls now follow stock links before JavaScript loads. Once scripts load, a tap chooses the nearest point, as the existing map slider does. The corner placement and point controls are shared by the other maps, so their routes carry a small JavaScript increase too. The shared set includes the generated browser route manifest, which changes when the build splits these modules.

These measurements use main at `21dce2a` and the first pushed map build at `82e97a6`, with the same dependencies, `pnpm build`, and `pnpm size`. The complete dependency walk and gzip method follow decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes.

| Dependency set         | Main JavaScript kB | Map JavaScript kB | Main CSS kB | Map CSS kB |
| ---------------------- | -----------------: | ----------------: | ----------: | ---------: |
| Shared                 |             140.16 |            140.22 |        7.50 |       7.50 |
| Pasar                  |             194.56 |            198.34 |       19.93 |      20.32 |
| Saham                  |             213.36 |            213.67 |       20.39 |      20.39 |
| Ticket                 |             221.28 |            221.60 |       23.16 |      23.16 |
| Analisis               |             201.65 |            201.97 |       18.53 |      18.53 |
| Demonstration analysis |             202.52 |            202.84 |       19.11 |      19.11 |

## Decision

- Pasar has a CSS ceiling of 20.5 kB gzip. Its JavaScript keeps the existing ceiling.
- Shared JavaScript has a ceiling of 140.3 kB gzip.
- Saham, the ticket, Analisis, and demonstration analysis have JavaScript ceilings of 214, 222, 202.3, and 203.2 kB gzip respectively.
- Every other ceiling and the dependency walk keep their rules.

The map and its links render on the server. A phone can choose its view, range, and axis and open a stock before it downloads or runs the enhancement. The added stylesheet cost on Pasar is about 0.4 kB gzip. The complete market JavaScript remains below its earlier ceiling. Its browser checks cover touch at 360 pixels, both themes, native stock navigation, and the transition to the enhanced slider. The sample class exercises the same screen with varied holdings for both roles. These checks and byte measurements support the narrow allowances. They do not measure latency on every phone.

## Alternatives

- Duplicating the map for Pasar would keep the other map routes smaller but give label placement and native activation two implementations.
- Omitting the native stock controls would leave map points unusable before JavaScript loads.
- Raising every route ceiling would allow unrelated growth. Exact route entries keep the allowances on the dependency sets that need them.

## Consequences

`scripts/client-route-limits.ts` holds the allowances. The budget tests apply them through `clientSizeChecks` and keep nearby route names on their earlier limits. The sample command already supplies measured holdings and historical closes, so this map needs no new sample records.
