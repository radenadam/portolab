# 0059. The owner supplies company logos outside the repository

- Status: Accepted. [Decision 0060](0060-learning-practices-have-measured-sheet-allowances.md) replaces its Pasar JavaScript ceiling.
- Date: 2026-11-17

## Context

The second cut of [the rebuild](https://github.com/radenadam/portolab/issues/127) makes companies recognizable with their logos, as principle 14 of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) requires. The maintainer chose an owner-filled folder outside this public repository. [Decision 0034](0034-a-stock-carries-the-name-and-the-sector-that-idx-publishes.md) already supplies the shared tile.

The existing tile variants reused control or default corners instead of all the prototype's tile corners. Their tests covered letters alone, so neither replaced-image baselines nor the corners of the variants had a browser check.

## Decision

- The optional `COMPANY_LOGOS_PATH` names an external folder. Each tracked stock has at most one file, named with its uppercase code and `.png`. An unset folder leaves all monograms. The server loads a bounded snapshot at startup and logs rejected files. Only accepted codes enter the root loader's catalogue, so missing files need no image request and keep their monograms before JavaScript loads.
- Tiles are prepared static PNGs with RGBA pixels. `app/features/market-data/company-logo-format.ts` owns their dimensions and byte limit. The parser validates chunks, checksums, and decompressed scanlines before serving bytes from memory. Other formats, symbolic links, untracked codes, and directory listings are not served. The app's own image endpoint uses revalidation and `nosniff`.
- The owner crops and centers each mark before export, following [the deployment guide](../deploy.md#optional-company-logos). A wide mark fills the tile's width with the smaller padding of the approved prototype. Each variant has its own size and corner tokens from that prototype, on a white ground in both themes. The letters keep the text baseline beneath the image. A failed browser image request restores the monogram.
- The optional Compose override mounts the external folder read-only in both the main and sample services. It preserves their separate database volumes. The deployment guide names the override and the folder in `.env`, which Compose reads for every later command in the checkout, so an update, a backup, a restore, and a reset of the sample keep the logos. Docker creates a missing folder empty, so a missing folder leaves monograms instead of stopping a backup. Neither the server nor the sample command downloads or writes logos. The sample's existing holdings and orders already exercise the shared tile.
- Public source addresses and the parts used by the prototype live in [the source list](../company-logo-sources.md). No real logo enters the repository, its tests, or its screenshots.
- Pasar JavaScript has a ceiling of 200.4 kB gzip. Every other ceiling of [decision 0057](0057-theme-choice-has-measured-shared-and-route-allowances.md) and [decision 0058](0058-home-outcomes-have-a-measured-route-allowance.md) and the complete dependency walk keep their rules.

The tile reads the existing root loader data, so its list of logos needs no shared client provider, and prepared tiles need no image library in the browser. The measurements below follow the complete dependency walk and the gzip method of [decision 0038](0038-client-javascript-is-budgeted-by-route.md) and [decision 0042](0042-client-css-is-budgeted-by-route.md), with kB meaning 1,000 bytes. Main is `a51f11c`, which includes the outcomes on Beranda, and the combined build merges that main into this change.

| Dependency set | Main JavaScript/CSS kB | Combined JavaScript/CSS kB |
| -------------- | ---------------------: | -------------------------: |
| Shared         |          141.94 / 7.76 |              141.94 / 7.79 |
| Beranda        |         220.44 / 23.58 |             220.62 / 23.68 |
| Pasar          |         200.13 / 20.63 |             200.31 / 20.73 |
| Saham          |         215.27 / 20.81 |             215.45 / 20.91 |
| Ticket         |         223.20 / 23.64 |             223.38 / 23.74 |
| Aktivitas      |         196.05 / 18.29 |             196.23 / 18.39 |

The image of the tile, its path, and its return to the monogram after a failed request add 0.18 kB of JavaScript to each route that draws tiles. Pasar JavaScript exceeds the ceiling of decision 0057 by 13 bytes. Every other route passes its ceiling, so only the ceiling of Pasar grows, by 0.05%.

## Alternatives

- Accepting arbitrary image sizes would require code to resize them. The owner would still need to choose the part of each mark that reads at a small size.
- Serving the owner's whole folder as static content would expose unrelated files and accept active formats such as SVG.
- Reading each file on every image request would let visitors repeat disk work. A startup snapshot bounds that work and keeps the catalogue consistent with the served images.
- Setting the variables in the shell that starts the services would drop the logos at the next update, which runs in a new shell.

## Consequences

The owner restarts each service and reloads open pages after changing tiles. A stock without an accepted file keeps its monogram. Tests generate geometric raster tiles and exercise the sample class in both roles, languages, themes, and device projects. No database migration or sample recipe change is needed.
