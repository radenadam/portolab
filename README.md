# Portolab

Portfolio theory is easy to state and hard to feel. A student can compute beta from a textbook table and still not know what beta says about the stocks they would actually buy. Portolab closes that gap. A class builds real portfolios of Indonesian stocks with virtual money, at real market prices, under the rules of the Indonesia Stock Exchange. Portolab then computes the measures of the course from each student's own portfolio, so every formula works on numbers the student chose.

Portolab is made for lecturers and students of portfolio management courses at Indonesian universities. It speaks Bahasa Indonesia and English, and it works on a phone as well as on a computer.

## Status

Portolab is in early development. It shows delayed prices of a few IDX stocks and of the IHSG, but it cannot trade yet. The first release, planned for November 2026, serves the course sessions on CAPM and on portfolio return and risk. [`docs/product.md`](docs/product.md) describes what Portolab will do and what it deliberately will not do.

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

The server prints the addresses that phones on the network can open. On Windows, allow the connection when the firewall asks.

## Configuration

Portolab reads these environment variables when it starts:

| Variable        | Default                | Meaning                                                                                                                                               |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`          | `3000`                 | The port the server listens on.                                                                                                                       |
| `DATABASE_PATH` | `data/portolab.sqlite` | The SQLite database file. Portolab creates it, and its folder, when they do not exist.                                                                |
| `PRICE_SOURCE`  | `yahoo`                | Where prices come from. `yahoo` fetches delayed prices from Yahoo Finance. `fixture` always returns the closing prices of 30 October 2026, for tests. |

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) explains how to propose a change.

## License

[MIT](LICENSE)
