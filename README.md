# Portolab

Portfolio theory is easy to state and hard to feel. A student can compute beta from a textbook table and still not know what beta says about the stocks they would actually buy. Portolab closes that gap. A class builds real portfolios of Indonesian stocks with virtual money, at real market prices, under the rules of the Indonesia Stock Exchange. Portolab then computes the measures of the course from each student's own portfolio, so every formula works on numbers the student chose.

Portolab is made for lecturers and students of portfolio management courses at Indonesian universities. It speaks Bahasa Indonesia and English, and it works on a phone as well as on a computer.

## Status

Portolab is in early development. It shows delayed prices of the stocks in the LQ45 index and of the IHSG, and it keeps their daily closes for the measures of the course. The table of prices, the holdings, and the order ticket name the company of each stock, and the table of prices and the ticket name its sector too. Lecturers create classes, and students join them with a code. The page of a class shows its semester and the session of the week, from the date of its first session. In a class, a student places market and limit orders under the rules of IDX, which fill at delayed prices, and sees the value of the portfolio that they leave and its return against the IHSG at each daily close. The student may write the reason of each order, which the lecturer of the class reads. The student also sees the measures of the course for the portfolio and for each stock, each with its formula and its inputs, and a chart that places them against the security market line. The lecturer of a class sees the portfolio and the measures of every student, ranked by a performance measure that the lecturer chooses, and downloads them as a spreadsheet for grading. The first release, planned for November 2026, serves the course sessions on CAPM and on portfolio return and risk. [`docs/product.md`](docs/product.md) describes what Portolab will do and what it deliberately will not do.

## Run it

Portolab needs [pnpm](https://pnpm.io) 12. pnpm installs the version of Node.js that the project needs by itself.

```sh
pnpm install
pnpm dev
```

Then open http://localhost:3000.

To show Portolab to phones on the same Wi-Fi network, build it and start it:

```sh
pnpm build
pnpm start
```

Open http://localhost:3000 on the laptop as before. The page of each class then shows its address for joining on each network of the laptop, because a phone cannot open localhost. The server also prints the address of the laptop on each network when it starts. On Windows, allow the connection when the firewall asks.

## Deploy it

[`docs/deploy.md`](docs/deploy.md) takes an Ubuntu server to Portolab, served over HTTPS at a domain of your own, one command at a time. It also covers backups, updates, what to do when prices stop updating, and how to answer a person who asks to see, correct, or delete their data.

## Accounts

Nobody signs up as a lecturer. The person who runs the server creates each lecturer account with the account command:

```sh
pnpm account create-lecturer <username>
```

The command prints a temporary password and says what the lecturer does with it. When a lecturer forgets the password, the same command gives the account a new temporary password and signs it out on every device:

```sh
pnpm account reset-password <username>
```

The command works on the database that `DATABASE_PATH` names, so run it with the same environment variables as the server. On a server that follows the deployment guide, it runs in the container of Portolab, as [the guide shows](docs/deploy.md#7-create-the-first-lecturer-account). It can run while the server runs, but it cannot end a block after wrong passwords, which the server keeps until the time that the sign-in page names.

## Sample class

Build the app, then fill a separate database with the sample command:

```sh
pnpm build
DATABASE_PATH=data/sample.sqlite pnpm sample-class
```

The command prints the usernames, the password of each role, and the join code. Start the server with the same `DATABASE_PATH` to explore the class. In a built container, run `node server/sample-class.ts` with that variable instead. [Decision 0050](docs/decisions/0050-a-sample-class-lives-in-a-database-of-its-own.md) describes the isolation, the recipes, and how to start again.

## Configuration

Portolab reads these environment variables when it starts, and it names every wrong one before it stops:

| Variable        | Default                | Meaning                                                                                                                                                                                                                                                        |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | `3000`                 | The port the server listens on.                                                                                                                                                                                                                                |
| `DATABASE_PATH` | `data/portolab.sqlite` | The SQLite database file. Portolab creates it, and its folder, when they do not exist. `:memory:` keeps the database in memory until the server stops, which the check of the dev server uses. An empty value stops the server, because it would keep no data. |
| `PRICE_SOURCE`  | `yahoo`                | Where prices come from. `yahoo` fetches delayed prices from Yahoo Finance. `fixture` returns recorded quotes and daily closes for tests, which `app/features/market-data/fixture-price-source.server.ts` describes.                                            |

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) explains how to propose a change.

The [workflow](AGENTS.md#workflow) sets which checks must pass before a push. `pnpm check` runs every check that CI runs. `pnpm check:fast` runs the same steps except the browser tests, including the dev server check, the production build, and the size check.

CI runs the fast check and the browser shards on separate runners. The required `check` job waits for all of them and names every job that did not succeed. [Decision 0051](docs/decisions/0051-browser-tests-run-in-six-independent-shards.md) records the measurements and shard count. A failed shard keeps its traces and HTML report in its `test-results-browser-<number>` artifact.

For a later push, run the fast check and choose the browser test files that cover the changed behavior. For example, after changing the stock screen:

```sh
pnpm check:fast
pnpm test:e2e e2e/stock.test.ts e2e/layout.test.ts
```

The browser command runs the selected files on both the phone and desktop projects, with their tests in both languages. Choose files by what they cover, including callers of shared code, rather than only test files that changed. A change to shared layout, styles, or browser test infrastructure can need the full browser suite, which runs with `pnpm test:e2e`. A change confined to docs or scripts with no browser behavior needs no browser tests.

To run checks at the same time, use a separate worktree for each run and give each a different `PORTOLAB_CHECK_SLOT` from `0` to `99`:

```sh
# In the first worktree
PORTOLAB_CHECK_SLOT=1 pnpm check
# In the second worktree
PORTOLAB_CHECK_SLOT=2 pnpm check
```

In PowerShell, set `$env:PORTOLAB_CHECK_SLOT = '1'` before `pnpm.cmd check`, and use `'2'` in the other worktree. Without the variable, or with `0`, the ports stay unchanged. Each slot selects the ports of the browser tests, the dev server check, and Vite's WebSocket server. Nonzero slots also limit test workers so the runs can share the computer. A wrong value stops the check with the reason. Build output, generated code, caches, and Playwright output stay in each worktree. The browser tests create their database in a unique temporary folder and remove it after the server stops, and the dev server check uses a database in memory.

The slot is only a setting of the check tools. The dev server check passes its WebSocket port through the server's `--hot-reload-port` option, so the server validates it with its other startup inputs.

## License

[MIT](LICENSE)
