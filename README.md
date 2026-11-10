# Portolab

Portfolio theory is easy to state and hard to feel. A student can compute beta from a textbook table and still not know what beta says about the stocks they would actually buy. Portolab closes that gap. A class builds real portfolios of Indonesian stocks with virtual money, at real market prices, under the rules of the Indonesia Stock Exchange. Portolab then computes the measures of the course from each student's own portfolio, so every formula works on numbers the student chose.

Portolab is made for lecturers and students of portfolio management courses at Indonesian universities. It speaks Bahasa Indonesia and English, and it works on a phone as well as on a computer.

## Status

Portolab is in early development. It shows delayed prices of the stocks in the LQ45 index and of the IHSG, and it keeps their daily closes for the measures of the course. Lecturers create classes, and students join them with a code. In a class, a student places market and limit orders under the rules of IDX, which fill at delayed prices, and sees the value of the portfolio that they leave and its return against the IHSG at each daily close. The student also sees the measures of the course for the portfolio and for each stock, each with its formula and its inputs. The lecturer of a class sees the portfolio and the measures of every student, ranked by their distance from the security market line, and downloads them as a spreadsheet for grading. The first release, planned for November 2026, serves the course sessions on CAPM and on portfolio return and risk. [`docs/product.md`](docs/product.md) describes what Portolab will do and what it deliberately will not do.

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

## Accounts

Nobody signs up as a lecturer. The person who runs the server creates each lecturer account with the account command:

```sh
pnpm account create-lecturer <username>
```

The command prints a temporary password and says what the lecturer does with it. When a lecturer forgets the password, the same command gives the account a new temporary password and signs it out on every device:

```sh
pnpm account reset-password <username>
```

The command works on the database that `DATABASE_PATH` names, so run it with the same environment variables as the server. It can run while the server runs, but it cannot end a block after wrong passwords, which the server keeps until the time that the sign-in page names.

## Configuration

Portolab reads these environment variables when it starts, and it names every wrong one before it stops:

| Variable        | Default                | Meaning                                                                                                                                                                                                                                                        |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | `3000`                 | The port the server listens on.                                                                                                                                                                                                                                |
| `DATABASE_PATH` | `data/portolab.sqlite` | The SQLite database file. Portolab creates it, and its folder, when they do not exist. `:memory:` keeps the database in memory until the server stops, which the check of the dev server uses. An empty value stops the server, because it would keep no data. |
| `PRICE_SOURCE`  | `yahoo`                | Where prices come from. `yahoo` fetches delayed prices from Yahoo Finance. `fixture` returns recorded quotes and daily closes for tests, which `app/features/market-data/fixture-price-source.server.ts` describes.                                            |

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) explains how to propose a change.

## License

[MIT](LICENSE)
