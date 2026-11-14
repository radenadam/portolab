# 0042. The class overview keeps a measured CSS budget

- Status: Accepted
- Date: 2026-11-15

## Context

The class overview of piece 19 of #127 merges the rebuilt Beranda, Mahasiswa, and Belajar screens from main at `cdcdac7`. Their combined build measures 20.88 kB of compressed CSS against the 20 kB ceiling kept by decision 0038. This ceiling counts every route, including styles that the class page does not load.

The measurement uses `pnpm build` followed by `pnpm size`, whose file plugin compresses each file with gzip at level 9. The class route and the shared root together import 15,226 bytes of compressed CSS, counting each stylesheet once through the static imports of the client manifest. This includes the student and lecturer views of the class route. The class map and Beranda share the panel and segmented-choice rules, and the join card uses the shared button style.

## Decision

The ceiling for all client CSS becomes 21 kB. Its scope stays every stylesheet of the production build, and the JavaScript ceilings and their route accounting stay as decision 0038 sets them. The size check and its test keep the ceiling in code.

This gives the complete set of rebuilt screens room for its measured styles while keeping growth bounded. The class screen's 15.23 kB of CSS remains below the earlier whole-app ceiling. Its drawing stays server-rendered SVG, and its layout and label tests cover a phone 360 pixels wide with and without JavaScript. The budget measures compressed bytes, so it makes no claim about loading time on a particular device.

## Alternatives

- **Keep 20 kB and share more styles.** The shared panel, segmented choice, and copy button use the existing rules, but the merged build remains 879 bytes above that ceiling. A wider stylesheet audit spans other screens, so issue #209 tracks it.
- **Count CSS by route.** The measured class route would fit, but changing how styles are counted needs its own analysis of route and deferred imports. The small increase keeps the current whole-app guard.

## Consequences

The build still fails when the combined CSS exceeds its ceiling. A later increase needs measurements and a decision record, as decision 0038 requires.
