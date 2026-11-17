# 0056. The owner supplies company logos outside the repository

- Status: Accepted
- Date: 2026-11-17

## Context

The second cut of [the rebuild](https://github.com/radenadam/portolab/issues/127) makes companies recognizable with their logos, as principle 14 of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) requires. The maintainer chose an owner-filled folder outside this public repository. [Decision 0034](0034-a-stock-carries-the-name-and-the-sector-that-idx-publishes.md) already supplies the shared tile.

The existing tile variants reused control or default corners instead of all the prototype's tile corners. Their tests covered letters alone, so neither replaced-image baselines nor the corners of the variants had a browser check.

## Decision

- The optional `COMPANY_LOGOS_PATH` names an external folder. Each tracked stock has at most one file, named with its uppercase code and `.png`. An unset folder leaves all monograms. The server loads a bounded snapshot at startup and logs rejected files. Only accepted codes enter the root loader's catalogue, so missing files need no image request and keep their monograms before JavaScript loads.
- Tiles are prepared static PNGs with RGBA pixels. `app/features/market-data/company-logo-format.ts` owns their dimensions and byte limit. The parser validates chunks, checksums, and decompressed scanlines before serving bytes from memory. Other formats, symbolic links, untracked codes, and directory listings are not served. The app's own image endpoint uses revalidation and `nosniff`.
- The owner crops and centers each mark before export, following [the deployment guide](../deploy.md#optional-company-logos). A wide mark fills the tile's width with the smaller padding of the approved prototype. Each variant has its own size and corner tokens from that prototype, on a white ground in both themes. The letters keep the text baseline beneath the image. A failed browser image request restores the monogram.
- The optional Compose override mounts the external folder read-only in both the main and sample services. It preserves their separate database volumes. Neither the server nor the sample command downloads or writes logos. The sample's existing holdings and orders already exercise the shared tile.
- Public source addresses and the parts used by the prototype live in [the source list](../company-logo-sources.md). No real logo enters the repository, its tests, or its screenshots.
- Saham has a JavaScript ceiling of 213.6 kB gzip, and its ticket has a ceiling of 221.5 kB gzip. Pasar has a CSS ceiling of 20.1 kB gzip. The other ceilings keep their rules. The measurements below follow the complete dependency walk of decisions 0038 and 0042, with kB meaning 1,000 bytes. The build uses the code of main at `21dce2a` before this change.

| Dependency set | Main JavaScript kB | With logos JavaScript kB | Main CSS kB | With logos CSS kB |
| -------------- | -----------------: | -----------------------: | ----------: | ----------------: |
| Shared         |             140.16 |                   140.16 |        7.50 |              7.53 |
| Pasar          |             194.56 |                   194.73 |       19.93 |             20.03 |
| Saham          |             213.36 |                   213.54 |       20.39 |             20.49 |
| Ticket         |             221.28 |                   221.46 |       23.16 |             23.27 |

The tile reads the existing root loader data, so its catalogue needs no shared client provider. Its image, shared path builder, and request-failure fallback add about 0.18 kB to each route that draws tiles. Prepared tiles need no image library in the browser. Pasar exceeds its earlier CSS ceiling by 28 bytes after the image and variant rules, so its measured allowance keeps those rules together in the shared tile instead of copying them into individual screens.

## Alternatives

- Accepting arbitrary image sizes would require code to resize them. The owner would still need to choose the part of each mark that reads at a small size.
- Serving the owner's whole folder as static content would expose unrelated files and accept active formats such as SVG.
- Reading each file on every image request would let visitors repeat disk work. A startup snapshot bounds that work and keeps the catalogue consistent with the served images.

## Consequences

The owner restarts each service and reloads open pages after changing tiles. A stock without an accepted file keeps its monogram. Tests generate geometric raster tiles and exercise the sample class in both roles, languages, themes, and device projects. No database migration or sample recipe change is needed.
