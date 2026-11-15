# 0045. Lesson practice keeps estimates fixed while weights change

- Status: Accepted
- Date: 2026-11-15

## Context

Piece 23 of issue #127 connects the reserved sections of sessions 9 and 10 to the student's portfolio. The approved lesson of session 9 in [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) places the interactive before the student's numbers, terms, and practice. The content of [decision 0036](0036-lessons-and-the-glossary-are-content-in-both-languages.md) also has prose and typed formula references that explain the assumptions.

The prototype changes portfolio weights with the observed covariance matrix. It shows every covariance term in a square grid. That grid becomes wider than a phone as holdings are added. A real portfolio can also have no negative alpha, no variation, or stocks whose histories no longer share enough months. The seeded prototype does not show each of those states.

## Decision

- The server supplies the starting beta and current weights. Beta starts at the closest slider step to the portfolio beta. Without portfolio measures, it starts at the market beta. The slider range includes a starting beta outside its usual range. The default drawing and numbers appear before JavaScript loads. The sliders appear after hydration.
- Changing weights keeps the original shared months, stock estimates, and covariances. The same allocation calculation serves the portfolio measures and the exercise. The remaining weight is cash, which earns no interest. Weight sliders keep fractional server weights, because snapping them to whole percentages would change the default allocation. Reset restores the current portfolio weights. The exercise places no order.
- The covariance calculation opens in place as responsive cards for unique pairs, with the observed correlation, weights, covariance, and weighted term. Its explanation accounts for each off-diagonal pair twice. This preserves every input without a grid that scrolls sideways. The prose and formula references open through the lesson's question card, so the reading order follows the reference.
- Practice uses the student's numbers. A student without holdings gets a task to find a first stock, with the task and a return to the practice section on the market, stock, ticket, and activity. Missing prices and histories keep their existing measurement explanations. An example allocation uses stocks with sufficient stored history when there are no usable portfolio measures. Its label distinguishes it from the student's allocation.
- The shared ratio formulas preserve nonzero operands that would round to zero, through the significant-digit fallback of `formatNonzeroNumber`. This keeps a small positive denominator distinct from an undefined division.
- The alpha task asks for the most negative displayed alpha when one exists. Otherwise it asks for the smallest alpha and compares its inputs. The risk task uses the target in `practiceRiskTarget` and compares risk at the displayed precision. If the proportional target rounds to zero, the task instead asks for risk above the display step in `smallestPercentStep`. This gives a visible goal for small holdings beside cash and for a portfolio without variation. The latter also explains why its risk shares have no value.

## Alternatives

- **Estimate again as weights change.** A change of weights could then change the data period too, so the student could not isolate its effect. Keeping estimates fixed matches the prototype and the shared-period convention of decision 0013.
- **Keep a horizontally scrolling matrix.** It follows the prototype's grid, but breaks the layout standard on a phone. Responsive pair cards retain the same terms.
- **Hide numeric formula inputs when they round to zero.** This would remove the inputs that a student needs to reproduce the ratio in a spreadsheet. The significant-digit fallback keeps them available.
- **Invent fallback returns.** They keep an interactive available without history, but they no longer teach from the source used by the app. The page instead explains missing data and uses stored estimates for its labelled example when available.

## Consequences

The lessons keep the existing calculation components and number formats. The content parser still reserves empty interactive and practice sections in Markdown, because components provide their data. The [content guide](../learning-content.md) names the implemented sections and references. The route budgets of decisions 0038 and 0042 remain unchanged.
