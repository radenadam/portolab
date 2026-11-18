# 0050. A sample class lives in a database of its own

- Status: Accepted. [Decision 0064](0064-the-empty-sample-joins-when-the-class-starts.md) replaces when the empty sample student joins.
- Date: 2026-11-16

## Context

The maintainer needs to test the rebuilt screens with a class that has varied portfolios, orders, and reasons. The lecturer then explores that class on a home network and on a server. The prototype has a role switch and an adjustable clock, but the app must exercise real sign-in, prices, and order checks. Sample work must never mix with a real class.

## Decision

- The explicit `sample-class` command fills the file that `DATABASE_PATH` names. It refuses account, session, class, membership, portfolio, holding, and order records, and an existing sample marker. The server never invokes it at startup.
- The marker stores presence only, because the class already owns the dates that the app shows. Deleting people keeps the warning until the operator deletes the database.
- History, quote checks, password preparation, and portfolio planning finish before one transaction writes the people, their work, and the marker. Recipes use only stocks with stored quotes and require an IHSG quote, so the class has values when the command finishes. A refusal or a recipe that cannot be built leaves no people behind. Market data may remain after a failed preparation, so the operator can retry after the price source recovers.
- People and orders use one moment after price preparation. The history job keeps its own timing and coverage, so a long fetch does not give the class an earlier day or move the job's failure wait.
- The command uses the history update of the price job when stored closes cannot support enough varied, measured portfolios or a complete order sequence. It can refresh an incomplete cache even after a successful update of the same final day, and it keeps the job's failure backoff. Historical quotes take the stored close of each day, and replay only trading days for which Portolab has recorded the universe and the rules. Split-adjusted fractional or off-tick closes are excluded from trading recipes. Placement, fill checks, costs, holdings, and persistence use the trading engine.
- The maximum purchase is rejected before the limit orders use its cash. The cancellation ends before the expiring order starts, so their reservations never overlap.
- Waiting sample purchases use current stored quotes and the rules of their trading day. The recipe tries another stock when the engine refuses its preferred purchase, such as a past holding that left the LQ45.
- The calendar begins about ten weeks before the command runs. Students with trades join just before their first trade, so their IHSG comparison covers their own trading period. The recipes vary sectors, cash weights, purchase dates, and sales. They include an empty portfolio, students without an order this week, every terminal order state, current waiting orders, and a demonstration portfolio. Reasons describe fictional students' experiments rather than recommendations.
- The command prints every username and the join code. Each role gets a newly generated password, and the synthetic students share their role's password so the lecturer can explore their views. These credentials belong only to this sample database.
- Every page of a marked database carries the [approved sample mode name](../../messages/AGENTS.md#approved-names) below the top bar, including sign-in and account pages. The English name refers to the class that the command creates. This is an additional frame label beside the simulation badge of decision 0028. The label remains when another person joins the sample class.
- The sample runs in real time. Separate browser profiles sign in as each role, new students join through the printed code, and the normal price job settles open orders. Starting again means stopping that instance, deleting its database, and running the command on a fresh file.
- `pnpm build` bundles the seeding work with the server. The repository runs `pnpm sample-class`, and the container runs `node server/sample-class.ts` with its own `DATABASE_PATH`.
- The optional Compose profile `sample` runs a second service with its own volume and `DATABASE_PATH=/app/data/sample.sqlite`. Only the host reaches its published port, `127.0.0.1:3001`. The live service, its volume, its HTTPS site, and its backups stay separate. The backup command names only the live service.
- Caddy on WSL serves the sample over HTTP on the home network and aborts requests from outside private ranges. The Windows setup opens TCP port 80 for the sample through mirrored networking or a port proxy. The lecturer opens the Windows LAN address, so the app builds the join address from the host that the lecturer opened. The VPS serves the sample over HTTPS at its own subdomain. Both sites import `sample/Caddyfile`, which points only at the sample service. Its optional import block uses Caddy 2.9 or later, as [Caddy's import documentation](https://caddyserver.com/docs/caddyfile/directives/import) describes.

## Alternatives

- A sample class in the live database could mix synthetic people into teaching work and personal data exports.
- Browser controls for roles, time, or resetting data would bypass the paths that the maintainer needs to test and would add controls absent from the app design.
- Directly inserting trade values and holdings would let the sample show a portfolio that the real rules cannot produce.
- Keeping fixed passwords in the repository would publish credentials for every running sample. Generated role passwords keep exploration simple without that shared secret.

## Consequences

The sample needs reachable price history and recorded trading rules. A missing source, insufficient history, or a period without usable trades ends the command with a reason. The database may retain downloaded market data, but it has no sample accounts until all recipes are ready.

The frame uses the existing warning tokens. No client budget changes. The browser tests run the built command against an isolated database and sign in with its printed credentials on both device projects and in both languages.

The optional section of [the deployment guide](../deploy.md#optional-sample-class) covers the Windows administrator steps, the two Caddy sites, and the sample lifecycle. The deployment test follows its Linux commands with recorded prices on both supported Ubuntu versions. It opens the home network site at the runner's non-loopback IPv4 address and follows the join address that the page shows. Removing the sample never removes the live volume or changes its site.
