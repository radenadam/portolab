# The prototype of the design Peta

This branch keeps the clickable prototype of the design "Peta" of Portolab, which the maintainer approved on 13 November 2026. It has no history in common with `main`, because it holds no code of the app. Decision 0028 on `main` makes screenshots of this prototype the reference screens of Portolab, and issue #127 tracks the rebuild of the app to them.

## What it holds

- `design-brief.md`: the specification of the design, with its 14 principles, the screens of each reader, and the look.
- `src/`: the prototype. It is React with htm in the browser, with a data engine that draws seeded price series and computes every measure from them with the formulas of the course, so the numbers agree on every screen.
- `build.mjs`: writes `portolab-mock.html`, the page that the maintainer approved, and `preview.html`, the same page in the frame of the page that published it, which the checks open.
- `links.md`: every control that navigates or opens something, with how the reader returns.
- `reference/portolab-peta-reference.html`: the reference of the direction Peta, which the maintainer chose on 13 November 2026, with five frames of it that the maintainer took: `kelas-light.png`, `kelas-dark.png`, `mahasiswa-light.png`, `mahasiswa-dark.png`, and `beranda-dark.png`.
- `reference/20-app-icon-reference.png`: the reference of the app icon. The icon of the prototype draws the flask and the line without the dark tile of this image, which is how the maintainer approved it.
- The checks below.

## Logos

The approved prototype showed the logo of each company. The logos belong to their companies, so this branch carries none, and each stock shows a monogram tile with the first two letters of its code. `build.mjs` embeds a logo for each PNG in a folder `logos/` beside it, named by the code of the stock, and git ignores that folder.

## Run it

The page loads React, htm, and its two fonts from public CDNs, so it needs a connection to the internet. The checks need Node and pnpm.

```sh
pnpm install
pnpm exec playwright install chromium
pnpm build
```

Then open `portolab-mock.html` in a browser. The control "Demo" switches between a student and a lecturer, starts a new student, and restores the sample data. It exists only in the prototype.

## Checks

Each check is a script that you run with `node`, after `pnpm build`. It prints what it found, and it prints one sentence of success when it found nothing. Screenshots go to `shots/`, which git ignores.

| Script           | What it checks                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify.js`      | It computes the measures of the sample portfolio again from its monthly series, compares them with those of the engine, and prints the fees, the tick sizes, and the auto rejection limits of a few orders.                                    |
| `texts.cjs`      | It runs every sentence that the screens compute from the data through each branch that the data can produce, and it fails on a dash, a semicolon, a hyphen-minus before a number, or "−0".                                                     |
| `layout.cjs`     | It renders every screen at 768 to 2560 pixels and at 390 and 360 on a phone, and fails when the content is wider than its maximum or not centered, when side-by-side columns end apart, when a cell overflows, or when columns do not line up. |
| `inplace.cjs`    | It types lots in the ticket, opens a "?" card and its lesson in a sheet, closes both, and finds the lots, the address, and the ticket unchanged.                                                                                               |
| `flows.cjs`      | It runs the main flows of a student and of the lecturer, and fails on a console error or a page that scrolls sideways.                                                                                                                         |
| `extra.cjs`      | It checks the theme toggle, the class switcher, an order while the market is closed, the keyboard alone, the lessons, and the ticket at the width of a tablet.                                                                                 |
| `trade-look.cjs` | It checks that Beli is green and Jual is red wherever a trade starts or is confirmed, with text at a contrast of at least 4.5 to 1, and that each listed or headlined stock shows its tile while the maps do not.                              |
| `icon.cjs`       | It checks that the app icon has no background, and that its flask takes the ink and its line the green of gains of each theme.                                                                                                                 |
| `logos.cjs`      | It checks that each logo of the folder `logos/` fills its tile enough to read, and it has nothing to measure without that folder.                                                                                                              |
| `targets.cjs`    | It checks that every control is at least 44 pixels high, and that no screen scrolls sideways.                                                                                                                                                  |
| `smoke.cjs`      | It opens the screens of a student on a phone and on a laptop, and fails on a console error or a page that scrolls sideways.                                                                                                                    |
| `phones.cjs`     | It takes screenshots on phones 390 and 360 pixels wide, and of the tooltips of the maps and of the line chart on a desktop.                                                                                                                    |
| `compare.cjs`    | It renders the three screens of `reference/portolab-peta-reference.html` and of the prototype at 1320 pixels in both themes, side by side.                                                                                                     |
| `net.cjs`        | It lists the hosts from which the page loads, and checks that its fonts loaded.                                                                                                                                                                |
