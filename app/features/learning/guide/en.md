# Lecturer guide

## sample | Start with the sample class

Ask the server owner to open the sample class before you invite students. The {{label:app_sample_class_label}} marker distinguishes this synthetic data from your class. Try opening a student, reading order reasons, downloading the workbook, and trading in the demonstration portfolio.

To see the student side, use a sample student account in a private window or another browser. Keep your lecturer account open in the first window. Sample orders follow the running market clock, so their status can change. Sample class data is separate from teaching class data. Create your teaching class on the main service, rather than on the sample service.

{{link:sample|Sample class instructions for the server owner}}

## workspace | Find pages and help

The class name at the top opens the class switcher. Each class keeps its own portfolios and students. On a computer, navigation is on the left. On a phone, it is at the bottom.

Your navigation contains {{label:navigation_class_link}}, {{label:navigation_students_link}}, {{label:navigation_portfolio_link}}, {{label:navigation_market_link}}, and {{label:navigation_learn_link}}. Open your name or avatar for {{label:accounts_account_link}}, the theme and language choices, this guide, and {{label:accounts_sign_out_title}}. You can change your name and password on the account page.

{{link:account|Account page}}

A question mark opens the meaning of a concept. {{label:app_concept_calculation_label}} opens its formula and inputs. A lesson opened from another screen usually appears over that screen. Closing it returns you to your work. If your browser opens the lesson as a separate page, use its back link. In that case, unsent fields can be lost.

## overview | Read the class overview

In {{label:navigation_class_link}}, the map compares student portfolios. The horizontal axis shows risk, and the vertical axis shows return since starting cash. Choose {{label:classes_map_beta_label}} for risk against the IHSG or {{label:classes_map_deviation_label}} for variation in monthly returns. Select a point to open that student. When data is available, bars at the map edges show the class spread and a median line summarises its returns.

Portolab pairs each available student return with the IHSG return for the same period. The headline takes the median of those differences. Students can join on different dates, so their comparison periods can differ too.

A student without risk measures or a return has no point yet. Open {{label:classes_map_table_label}} for their data and the reason for an unavailable measure. The figures below the map help check student count, order activity, and class risk before opening someone's work.

## create | Set up a class and its calendar

Choose {{label:navigation_create_class_link}} in the class switcher. You can also create a class from your class list.

{{link:classes|Your class list}}

Fill in {{label:classes_name_label}}, {{label:classes_first_session_label}}, and {{label:classes_starting_cash_label}}, then choose {{label:classes_create_label}}. Starting cash defaults to {{value:starting-cash}}, and you can change it when creating the class. Each student receives the class's virtual starting cash when joining.

The calendar places {{value:sessions}} weekly sessions from that starting date and determines the class semester. Check the calendar in {{label:navigation_class_link}} before the first meeting. {{label:classes_calendar_link}} changes the starting date and shifts the later sessions. The calendar helps locate this week's material. It does not restrict trading to class meeting days.

## join | Invite students

Tap {{label:classes_join_chip_title}} at the top of the class to see the code and its address. Share the displayed code or address with students. On a home network, students need a network that can reach the server computer. Try the address on a phone before class. If it does not open, ask the server owner to check the network and firewall.

Students open the address you share. They can also open the join page and enter the code.

{{link:join|Join page}}

New students choose a username, name, and password, then agree to the privacy notice. No email is needed. Students who already have an account sign in with it and then join. Check names in {{label:navigation_students_link}} before grading their work.

Students may give a NIM for each class when joining and correct or clear it on their account page. {{label:navigation_students_link}}, its panel, and the student details show the NIM below the name, or the username when a student gave no NIM. Two students can share a name and a NIM, but never a username, so the workbook lists both the NIM and the username of each student.

## student | What students see and do

Students have {{label:navigation_home_link}}, {{label:navigation_market_link}}, {{label:navigation_activity_link}}, {{label:navigation_analysis_link}}, and {{label:navigation_learn_link}}. They choose stocks, place orders with virtual cash, review results, and learn concepts from their own portfolios. Students cannot open classmates' detailed work. Their map shows classmates only as unnamed points.

{{label:navigation_home_link}} shows portfolio value, daily change, return against the IHSG, risk, and holdings. Its map and time chart help discuss the portfolio's position and progress. The cash row distinguishes cash held from cash set aside for open orders. Direct new students to {{label:navigation_market_link}} to choose their first purchase.

## market | Choose and read stocks

{{label:navigation_market_link}} shows LQ45 stocks, the IHSG chart, search by code or company name, sector filters, and list sorting. Open a stock for its price, quote time, closing-price chart, risk and return measures, and any position already held. Tiles show a logo supplied by the server owner or letters from the stock code. Portolab does not recommend stocks to buy.

A purchase requires LQ45 membership on the order's trading day and enough monthly history for portfolio measures. A holding that leaves the LQ45 can still be sold. If buying is unavailable, read the reason and next step shown on the stock or ticket. Creating another account will not resolve missing price history.

Choose {{label:market_data_map_label}} to compare stocks by {{label:market_data_beta_label}} or {{label:market_data_map_deviation_label}} and price change over the selected range. Filled points are stocks you hold, hollow points are other stocks, and the yellow point is your portfolio at current weights. Its map change is not the result of trades over that range. Stocks that cannot be placed are listed below the map. Select a point to open its stock, or {{label:market_data_list_label}} to return to the list.

The stock statistics show the day's low and high beside the range of stored closes. The day range belongs to the quote's trading day, which can be earlier than today. The label names today only when the quote belongs to today. Open its question mark for the date and meaning. A quote without a recorded low and high shows why the range is unavailable.

Use the star on a stock page or in {{label:market_data_list_label}} to add or remove a stock from your personal watchlist. {{label:market_data_watchlist_title}} appears above the LQ45 list with the same columns, search, sector filters, and sorting. Your stars follow your account across classes. Students and lecturers each have their own watchlist.

## orders | Place an order and read its costs

From a stock, choose {{label:trading_buy_label}} or {{label:trading_sell_label}}. Choose {{label:trading_ticket_market_label}} for a market order or {{label:trading_ticket_limit_label}} for a price limit, then enter lots. The ticket checks lot sizes, tick sizes, price limits, cash, and available shares. Review trade value, broker fees, sales tax, and cash afterwards before confirming. If the total changes, review the new preview and confirm again.

In {{label:trading_impact_title}}, compare the portfolio before and after a hypothetical order when its measures are available. On a stock page, choose a portfolio share for a purchase from available cash. When that purchase can be previewed, open its ticket to carry the displayed lots into the order. The ticket follows the lots and price you enter for a purchase or sale. The comparison includes stock and sector weights and a map. Read notices about changed shared months or unavailable measures before interpreting it.

{{label:trading_reason_label}} keeps the reason for a decision, which you can read. Ask students to explain how a trade relates to their goals, weights, or portfolio risk. A reason does not change order checks or the fill price.

Orders use delayed quotes from IDX continuous trading sessions. Outside a session, an order waits for the next session. A market order uses the first eligible quote. A limit order that immediately meets its limit uses that quote. A resting limit order uses its limit price when the quote reaches the limit. An order lasts for its assigned trading day and expires once that day's delayed prices are final. Some quotes from the last session arrive after the exchange closes.

## activity | Follow orders and the journal

{{label:navigation_activity_link}} separates orders from the journal of filled trades. Use the status filter to find waiting, open, filled, expired, cancelled, or rejected orders. An open order sets aside cash or shares, so other orders cannot use them. They become free when the order is cancelled or ends without filling.

{{label:trading_activity_cancel_label}} cancels an open order after confirmation. A filled order cannot be cancelled. The journal keeps reasons, price changes since a trade, and realised gains or losses from sales. Unavailable comparisons have an explanation, so they are not read as zero.

## analysis | Discuss measures with students

{{label:navigation_analysis_link}} shows the risk and return map, stock and sector weights, diversification, and performance measures. Expected return is a past average, rather than a promise of profit. Beta measures the relationship with the IHSG. Standard deviation measures variation in returns. CAPM gives the return required for that beta. The distance from its line is Jensen's alpha.

In {{label:measures_analysis_allocation_title}}, switch between {{label:measures_analysis_sector_label}} and {{label:measures_analysis_stock_label}} to compare weights with cash included. Select a cell in {{label:measures_analysis_correlations_title}} for the pair calculation. For portfolio risk, compare each contribution bar with its weight tick, then select the row for its inputs. Cash contributes no risk. The same panels appear in a student analysis and your demonstration analysis.

Measures use closing-price history, with at least {{value:minimum-returns}} monthly returns in the latest {{value:return-window}} complete months. A portfolio and its stocks use the months they share with the IHSG. Cash participates in portfolio weights and earns no interest. The risk-free rate uses the dated BI-Rate shown in the calculation. Measures stay monthly, so do not compare them directly with annual figures.

Students do not need to wait through that history window after joining. Stock history already supplies the measures. The portfolio performance chart instead follows the student's holdings and trades since trading became possible. Past daily points use final closes. An endpoint labelled with its time uses the current portfolio valuation and latest delayed IHSG level. Its time follows the latest quote for a holding or the IHSG, or a later order fill.

When a measure is unavailable, read its reason. Missing history, missing quotes, or a zero denominator can make a result undefined. Open the calculation and monthly data to check it with the student, including variance, covariance and correlation matrices, and each stock's risk contribution.

## ranking | Read rankings fairly

In {{label:navigation_students_link}}, choose {{label:grading_market_line_label}}, {{label:grading_sharpe_label}}, or {{label:grading_treynor_label}}. Jensen's alpha compares expected return with CAPM. Sharpe compares excess return with standard deviation. Treynor compares it with beta. Ranking uses the selected measure from highest to lowest, and ties follow joining order.

Search names, NIMs, or usernames and use filters to follow up a group. A rank is available only when the selected measure can be computed. It is not a final course grade. Review the period, risk, and trade reasons alongside results, because the largest profit alone does not explain decision quality.

Select a student for the summary panel, then {{label:grading_open_portfolio_link}} or {{label:grading_journal_link}}. Student pages have {{label:grading_summary_label}}, {{label:grading_analysis_label}}, and {{label:grading_journal_label}}. You read them without being able to trade as that student. The back link keeps your selected student and filters.

## workbook | Prepare grading

Choose {{label:grading_export_link}} in {{label:navigation_students_link}}. The spreadsheet contains every student in the class, available measures, and reasons for unavailable measures. Its order follows the selected ranking measure. List search and filters do not restrict the workbook.

Open the file in your spreadsheet application. The time in the workbook is its export time. Before grading, check the quote times shown in the app and the monthly period in the student's {{label:grading_analysis_label}}. Save an export at your chosen grading time to keep a record of results then. The workbook contains student data, so share it only with people authorised to grade.

## demonstration | Demonstrate in your own portfolio

{{label:navigation_portfolio_link}} opens your class demonstration portfolio, with {{label:trading_demonstration_summary_label}}, {{label:trading_demonstration_activity_label}}, and {{label:trading_demonstration_analysis_label}}. Its starting cash follows the class starting cash. Trades from {{label:navigation_market_link}} while you are signed in as a lecturer use this portfolio.

Use it to show order costs, changing weights, and reading risk in class. Students cannot open it. It is excluded from class statistics, the class map, attention flags, rankings, and the workbook, so your demonstration does not change class results.

## lessons | Prepare lessons and discussion

{{label:navigation_learn_link}} follows the class calendar. Open a session topic for its summary, key idea, and terms. {{label:learning_glossary_link}} provides term search. Research reviews and exams are cards without simulator lesson pages.

{{label:classes_capm_session_title}} and {{label:classes_portfolio_risk_session_title}} have practice with portfolio data. In the weight practice, moving weights changes only the exercise calculation. It does not place an order. Lessons on other instruments, such as futures, mutual funds, options, and bonds, explain their concepts, but those instruments cannot yet be traded in the simulation.

{{label:classes_portfolio_theory_session_title}} compares two stocks with weights and correlation you can change. Students can use pairs of their holdings in the chart. {{label:classes_trading_mechanism_session_title}} shows the schedule, ticks, price bands, and costs from the applicable rules. Its task opens a Limit ticket and returns to the lesson without placing an order. {{label:learning_price_guide_link}} in {{label:navigation_learn_link}} explains the code, price per share, daily change, quote time, and cost of one lot.

{{label:classes_discussion_title}} in {{label:navigation_class_link}} uses class data and this week's session to pose questions. Start with those questions, then ask students to read calculations and decision reasons. Available data determines the figures you can discuss. Check the calendar date if this week's material differs from your teaching plan.

## attention | Follow up with students

{{label:classes_flags_title}} marks the largest loss, the most volatile portfolio, students without stocks, and students without an order this week. Open a flag for the student or group. A flag is a reason to ask, rather than a diagnosis or grade. Students without stocks may never have traded, may be waiting for an order, or may have sold all their holdings.

Active means placing an order, rather than just signing in. Hollow map points mark students without an order this week. {{label:classes_reasons_title}} shows reasons from filled orders. Compare the reason with risk and results, then ask what has changed since the decision.

## prices | Delayed prices and failed updates

The simulation badge at the top names the price source and delay. Open it for the update time and prices that failed to update. The time near a price or its referenced page tells you when it was quoted, rather than when you opened the page. A delayed quote does not guarantee an available price for a real trade.

When an update fails, Portolab keeps stored prices and marks those it could not update. Portfolio values can use those older prices. A price never stored and a measure that cannot be computed have an explanation. Orders fill only with quotes eligible for their session and trading day, so an old price cannot always fill an order.

Check quote times before discussing changes or grading results. If the badge gives a next attempt time, wait until that time. If the problem continues, ask the server owner to check the operating guide. Do not ask students to send repeated orders to trigger a price update.

{{link:deployment|Server operating guide}}

## limits | What the simulation leaves out

Portolab uses no real money, connects to no brokerage account, and sends no order to the exchange. Dividends do not enter cash. Price returns exclude dividends. Stock closing history is adjusted for splits, but holding and order share counts are not adjusted automatically yet. A split can make portfolio values and performance charts misleading. If a student's holding splits, discuss this limitation before grading its results.

Other corporate actions, including reference-price adjustments on their action dates, are not modelled. The special monitoring board and its auctions are not modelled either. Portolab does not reproduce opening or closing auctions, order-book depth, or market liquidity. No stamp duty is collected. Sales use only shares already held, so there is no short selling. Use the simulation to discuss portfolio decisions within these limits.

## passwords | Help with forgotten passwords

For a student, open their panel in {{label:navigation_students_link}}, then choose {{label:grading_reset_link}}. Check their identity and confirm with {{label:classes_reset_label}}. Portolab signs the student out on every device and displays a temporary password. Give it directly to the correct student. They choose a new password at the next sign-in.

If you forget your lecturer password, contact the server owner with your username. The owner runs the account command to reset it. Lecturer accounts are created by the server owner, so the student join form does not replace one.

{{link:lecturer-account|Lecturer account section of the server guide}}

## privacy | Privacy and deletion

Read the privacy notice for stored data, who sees it, and student and lecturer rights. Explain that notice before students agree and join.

{{link:privacy|Privacy notice}}

For a data copy or deletion request, contact the server owner.

{{link:personal-data|Personal data section of the server guide}}

## server | Server, backups, and semester end

Give these instructions to the server owner. You do not need to run server commands to teach. Agree on who receives outage reports and data requests.

{{link:deployment|Installation and update guide}}

{{link:backups|Backup and restore steps}}

At semester end, download the workbook for grading and agree on data retention or deletion with the owner. The calendar's end date does not delete the class or stop trading. Create a new class for the next semester to keep each cohort's cash, portfolios, and work separate. The guide inside the app follows the Portolab version you are using. Server guide links open repository documentation and need internet access.
