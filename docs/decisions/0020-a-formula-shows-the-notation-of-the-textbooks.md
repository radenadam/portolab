# 0020. A formula shows the notation of the textbooks in both languages

- Status: Accepted
- Date: 2026-11-10

## Context

`docs/product.md` asks that every measure show its formula and its inputs, so that a student can reproduce it in a spreadsheet. A formula needs symbols with subscripts, such as the covariance of a stock with the market, and its numbers follow the format of the language of the reader. `AGENTS.md` asks that every text of the interface be a Paraglide message in both languages, and a message holds plain text, which has no subscripts.

The textbooks of the course write most symbols alike: E(R) for an expected return, σ for a standard deviation, β for beta, and ρ for a correlation. They differ in the rate free of risk, which Bodie, Kane, and Marcus write as r with the subscript f, and Tandelilin and Hartono write as R with the subscript BR, from "bebas risiko". Portolab also needs a symbol for the return that CAPM requires that differs from E(R), because E(R) is the mean of the past returns, which decision 0013 takes as the expected return.

## Decision

- A formula is markup of the notation, with its subscripts in HTML, and only its numbers come from the formats of the language. So it is no Paraglide message, and it reads the same in both languages.
- The subscript i stands for a stock, j for a second stock, p for the portfolio, M for the IHSG, and f for the rate free of risk.
- The return that CAPM requires is k, as older editions of Brigham write a required rate of return, and the distance of an expected return from the security market line is α.
- A formula whose value one spreadsheet function gives, such as AVERAGE or SLOPE, names that function in parentheses, with the English name that Google Sheets accepts in every language.
- A negative number after an operator stands in parentheses, such as 2.82% − (-0.28%), so its sign never reads as a second operator.

## Alternatives

- **A message for each formula, with the notation of each language.** The Indonesian formulas could write R_BR, but a message cannot hold a subscript, so every formula would lose its subscripts or write them with underscores, which no textbook does.
- **Formulas in words**, such as "the covariance with the IHSG divided by the variance of the IHSG". They need no notation, but they are long on a phone, and a student matches a formula with the textbook by its symbols.

## Consequences

- A student who learned R_BR reads R_f, which the label of the risk-free rate and its formula with the BI-Rate explain beside it.
- A new formula needs no message, and its test checks its markup in both languages, because its numbers still change with the language.
