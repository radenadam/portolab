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
- **Stockbit, Ajaib, and IPOT** are apps with which many Indonesians trade IDX stocks, and some students already use one of them. Portolab must hold up beside them on a phone, so a stock opens with its price chart, an order shows its costs before the student confirms it, and gains and losses are green and red with a sign and an arrow.
- **Investopedia Simulator** is a free simulator in which a teacher can run a game for a class, as StockTrak runs classes. Portolab must feel as much like trading as both, while it ties every trade to the theory of the course.
- **Duolingo and Khan Academy** teach in short steps, with help where the learner practices, such as the tips of a lesson and the hints of an exercise. Portolab teaches the same way, so practice comes first, and a concept opens where the student acts, with depth on demand.
- **Teaching research** finds that leaderboards by raw return, prizes for rank, and badges push students toward gambling, while trading on fixed dates and judging risk-adjusted return against a benchmark teach portfolio management. Portolab follows the research by design.

[Decision 0028](decisions/0028-every-screen-follows-the-reference-screens-of-peta.md) sets the screens that meet this bar. Beyond these products, Portolab must meet three standards of its own:

- **Every measure can be checked by hand.** A measure shows its formula and its inputs, so a student can reproduce it in a spreadsheet and trust it.
- **Copy teaches.** When the app rejects an action, it states what happened with the real numbers, explains the rule behind it, and offers a next step.
- **Both languages are complete.** Bahasa Indonesia and English cover every screen, message, and number format, and neither is a translation afterthought.

## Scope

### First release

The first release serves the course sessions on CAPM and on portfolio return and risk, and it teaches every other topic of the course in a lesson.

- A lecturer creates a class, and students join it with a code. Accounts need no email.
- Each student starts with virtual cash, Rp100 million unless the lecturer sets another amount.
- Students trade the stocks of the LQ45 index, as decision 0014 explains. They buy only those that have the monthly returns that the measures need, and they can sell a holding even after its stock leaves the index, as decision 0015 explains. Their orders fill at delayed prices quoted in session I and session II of IDX. Decision 0001 describes the prices, and decision 0016 explains the fills. Orders follow IDX lots, tick sizes, auto rejection limits, fees, and the final tax on sales. Limit orders and market orders are supported. An order lasts for one trading day, as decision 0016 explains, and a student can cancel it until it fills or expires. A student may write the reason of an order, which the lecturer of the class reads, as decision 0033 explains.
- A portfolio shows its holdings, cash, value, and return over time against the IHSG index. The return counts at each final daily close since the student could first trade, as decision 0018 explains.
- For each stock and for the whole portfolio, Portolab shows the expected return, variance, standard deviation, covariances and correlations, beta against the IHSG, the return that CAPM requires, and the position on the security market line. A stock gets them once it has the monthly returns that decision 0013 requires. Because students buy only such stocks, a portfolio has them too, unless a holding later loses monthly returns, such as after a suspension, or its stocks lack the closes of different months. A chart places the portfolio and the stocks against the security market line of the months that their measures share, as decision 0023 explains.
- The lecturer sees every portfolio and every measure, ranked by the distance from the security market line, as decision 0021 explains, and downloads them for grading as a workbook that every spreadsheet opens, as decision 0022 explains.
- The approved design brings these into the first release besides the reason of an order, as [decision 0028](decisions/0028-every-screen-follows-the-reference-screens-of-peta.md) explains: the measures of performance of Sharpe, Treynor, and Jensen, a lesson for each session of the course that teaches a topic with a glossary, a watchlist, and a demonstration portfolio in which the lecturer trades and which no statistic of the class counts.
- Every screen works on a phone, a tablet, and a computer.
- Every result is labelled as a simulation, and the price delay is always visible.

### Later releases

Each later release lets students practice the next course topic in the simulation, in teaching order: futures and hedging, mutual funds, options, and bonds. The first release teaches these topics only in their lessons. After those come the efficient frontier and portfolios managed by teams.

### Non-goals

- **Real money.** Portolab never connects to a brokerage account and never places a real order.
- **Advice.** Portolab never recommends securities, because recommendations are regulated in Indonesia and because choosing is what students must learn.
- **Rewards for rank.** No leaderboard by raw return, no prizes, no badges, and no streaks, because they teach gambling.
- **Real-time prices.** Real-time IDX data requires a license that costs far more than the project can pay. Delayed prices are enough to teach the course.
- **Other markets.** Crypto, foreign exchange, and foreign stocks are outside the syllabus.

## Constraints

- **Platforms**: current browsers on phones, tablets, and computers, from a screen 360 pixels wide.
- **Hosting**: one Linux VPS that the lecturer owns. Its owner deploys and updates Portolab from the public repository by following [the deployment guide](deploy.md), so the guide must work step by step on a fresh server, and also on a server that already runs other work, which the guide leaves as it is. Demonstrations also run on a laptop and serve phones on the same Wi-Fi network. The project uses no paid service.
- **Market data**: delayed prices come from Yahoo Finance, which has no license for this use and limits automated requests. The source sits behind one interface, every price is cached, and the app keeps working with the last known prices when the source fails. A licensed source can replace it without changes elsewhere.
- **Privacy**: Indonesia's personal data protection law applies. Portolab stores only what a class needs, asks for explicit consent, and holds no real financial data.
- **Regulation**: OJK rules on financial information allow simulations that are labelled as simulations and that make no recommendations.
- **Schedule**: the first release reaches the students of the first class in the remaining sessions of the semester, which ends around 21 December 2026, as issue #127 tracks.
