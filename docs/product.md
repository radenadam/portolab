# Product

## Purpose

Portfolio management courses teach how to measure return and risk, why diversification lowers risk, and how models such as CAPM price that risk. Students usually meet these ideas as formulas applied to textbook numbers, so the ideas stay abstract. Portolab lets a class build real portfolios of Indonesian stocks with virtual cash, at real market prices, under the trading rules of the Indonesia Stock Exchange (IDX). It then computes the measures of the course from each student's own portfolio, so every formula has numbers the student chose. The lecturer uses Portolab to teach in class and to follow every student's work between meetings.

## Users

- **Lecturers** of portfolio management and investment courses at Indonesian universities, starting with one postgraduate management course. A lecturer creates a class, sets its rules, and follows the portfolio of every student.
- **Students** in those courses. Postgraduate management students are often working adults who meet on weekday evenings and Saturdays and do much of their coursework online, on a phone as often as on a computer. Many have never traded, and some already invest through Indonesian apps.

Portolab is not for investors outside a class, for traders who want a trading platform, or for anyone who wants investment advice. It never recommends what to buy or sell.

## Quality bar

- **StockTrak** is the classroom simulator that universities use most. Its lecturers set trade limits, commissions, diversification rules, and start and end dates, and they can rank students by Sharpe ratio, alpha, and beta instead of raw return. It does not cover IDX, has no Indonesian interface, and does not tie portfolio theory to a student's holdings. Portolab matches its class controls for everything Portolab supports, and it is better on all three gaps.
- **Stockbit Virtual Trading** follows IDX mechanics faithfully: trading sessions, lots, tick sizes, auto rejection limits, fees, and the states of an order. It has no class features and no portfolio analytics. Portolab matches its market realism.
- **Portfolio Visualizer** shows risk measures and efficient frontiers clearly, but only for US and Canadian assets. Portolab shows the measures of the course with the same clarity, for IDX stocks, computed from the student's own portfolio.
- **Teaching research** finds that leaderboards by raw return, prizes for rank, and badges push students toward gambling, while trading on fixed dates and judging risk-adjusted return against a benchmark teach portfolio management. Portolab follows the research by design.

Beyond these products, Portolab must meet three standards of its own:

- **Every measure can be checked by hand.** A measure shows its formula and its inputs, so a student can reproduce it in a spreadsheet and trust it.
- **Copy teaches.** When the app rejects an action, it states what happened with the real numbers, explains the rule behind it, and offers a next step.
- **Both languages are complete.** Bahasa Indonesia and English cover every screen, message, and number format, and neither is a translation afterthought.

## Scope

### First release

The first release serves the course sessions on CAPM and on portfolio return and risk.

- A lecturer creates a class, and students join it with a code. Accounts need no email.
- Each student starts with virtual cash, Rp100 million unless the lecturer sets another amount.
- Students trade IDX stocks during IDX trading sessions at delayed prices, which decision 0001 describes. Orders follow IDX lots, tick sizes, auto rejection limits, fees, and the final tax on sales. Limit orders and market orders are supported.
- A portfolio shows its holdings, cash, value, and return over time against the IHSG index.
- For each stock and for the whole portfolio, Portolab shows the expected return, variance, standard deviation, covariances and correlations, beta against the IHSG, the return that CAPM requires, and the position on the security market line.
- The lecturer sees every portfolio and every measure, and can export them for grading.
- Every screen works on a phone, a tablet, and a computer.
- Every result is labelled as a simulation, and the price delay is always visible.

### Later releases

Each later release serves the next course topic, in teaching order: futures and hedging, mutual funds, options, and bonds. After those come the efficient frontier, the performance measures of Sharpe, Treynor, and Jensen, portfolios managed by teams, and the topics of the first half of the course.

### Non-goals

- **Real money.** Portolab never connects to a brokerage account and never places a real order.
- **Advice.** Portolab never recommends securities, because recommendations are regulated in Indonesia and because choosing is what students must learn.
- **Rewards for rank.** No leaderboard by raw return, no prizes, no badges, and no streaks, because they teach gambling.
- **Real-time prices.** Real-time IDX data requires a license that costs far more than the project can pay. Delayed prices are enough to teach the course.
- **Other markets.** Crypto, foreign exchange, and foreign stocks are outside the syllabus.

## Constraints

- **Platforms**: current browsers on phones, tablets, and computers, from a screen 360 pixels wide.
- **Hosting**: one Linux VPS that the lecturer owns. Its owner deploys and updates Portolab from the public repository by following the deployment guide, so the guide must work step by step on a fresh server. Demonstrations also run on a laptop and serve phones on the same Wi-Fi network. The project uses no paid service.
- **Market data**: delayed prices come from Yahoo Finance, which has no license for this use and limits automated requests. The source sits behind one interface, every price is cached, and the app keeps working with the last known prices when the source fails. A licensed source can replace it without changes elsewhere.
- **Privacy**: Indonesia's personal data protection law applies. Portolab stores only what a class needs, asks for explicit consent, and holds no real financial data.
- **Regulation**: OJK rules on financial information allow simulations that are labelled as simulations and that make no recommendations.
- **Schedule**: the first release is live before the first session on CAPM, in November 2026.
