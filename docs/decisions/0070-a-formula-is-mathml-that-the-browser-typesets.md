# 0070. A formula is MathML that the browser typesets

- Status: Accepted
- Date: 2026-11-19

## Context

[Decision 0020](0020-a-formula-shows-the-notation-of-the-textbooks.md) makes a formula markup of the notation of the textbooks, with its subscripts in HTML. That markup writes a division as a slash, a square root as a sign before its radicand without a bar, and a sum as the Greek letter, so a formula looks unlike the textbooks that it follows. The maintainer asked for formulas that look typeset, as LaTeX sets them.

A formula of loose text and subscripts also breaks wherever its parent lays out its children one by one. In the card of Korelasi antarsaham, a flex column put each symbol and each subscript of the covariance on a line of its own.

## Decision

- A formula is one MathML element, which the browser draws in the math font of the device. [`app/math-notation.tsx`](../../app/math-notation.tsx) holds its building blocks, such as a letter with its subscript and its square, a fraction, a square root, and a sum, and the measures and learning features both use them.
- A division is a stacked fraction, a square root has its radical, a sum has the sign of a sum, and operators take the space that MathML gives them. A formula is in display style, so its fractions keep the size of its symbols.
- A formula with its numbers writes them on a line of their own below the notation, and its lines align at their relation, as the aligned environment of LaTeX aligns them. A sum of many terms, such as the risk without diversification, puts two terms on each line.
- A measure shows its numbers wherever the data gives them. An expected return shows the sum of its returns over their number, a variance and a covariance show the sum of the products of the deviations over the number of returns less one, a weighted sum of a portfolio shows the weight and the measure of each stock, and the variance of a portfolio also shows itself as the sum of the weight of each stock times its covariance with the portfolio, with those numbers. A formula that stands for every stock, such as the one under a table of stocks, keeps its notation alone.
- Every formula comes with a sentence that says what it computes, as `AGENTS.md` sets. A measure shows the sentence between its name with its value and its formula, and any other formula stands in `ExplainedFormula`, after its sentence.
- The numbers keep the formats of the language, as decision 0020 sets. A number below the bar of a fraction follows no operator, so it takes no parentheses when it is negative, such as the beta of the Treynor ratio.
- The spreadsheet function of a formula follows the notation as small text in the font of the text, outside the MathML, because it is no part of the notation.
- The notation takes the color of the text around it, so it reads alike in both themes. It takes the size of the token `--text-formula` on every screen, a little larger than the text, because the math font of a device draws its letters smaller than the font of the text, and a subscript under a fraction must stay readable.
- A formula never makes a page wider than the screen, and it never scrolls where it fits. When it is wider than its column, its spreadsheet function moves to a line of its own, then the notation shrinks to three quarters of its size at most, and only then does its box scroll sideways. A formula that scrolls is a stop of the Tab key, so a keyboard can scroll it, and so is a formula whose numbers are that wide on a phone before JavaScript loads, which is the risk of two stocks in lesson 2. The box never scrolls up and down, and its padding holds the ink of a sum or a fraction that the boxes of MathML leave outside them, which made every formula show a scroll bar of a few pixels before.
- A symbol in a sentence, such as R with the subscript f before the rate free of risk, is a MathML element of its own.
- The elements of MathML carry the reading of a formula, such as identifiers, numbers, operators, fractions, roots, and scripts, so a screen reader reads it as math.
- A test reads the markup of a formula as one line in the notation of LaTeX, and the test of `app/math-notation.tsx` checks the MathML of each building block.

## Alternatives

- **KaTeX or MathJax.** Either typesets LaTeX into HTML with fonts of its own, so formulas would look alike on every device. But each is a dependency that adds its script, its stylesheet, and its fonts to every page with a formula, while the browsers that Portolab supports draw MathML without one.
- **HTML and CSS that stack a fraction.** A fraction of two boxes looks typeset without MathML, but it carries no reading as math, and every other part of the notation, such as a radical over a long radicand, would need CSS of its own.
- **A long line that wraps between its terms.** Browsers do not break a line inside MathML. A formula that wraps would need one MathML element for each term, which a screen reader reads as separate formulas. So a long sum takes several lines, and a formula that is still too wide scrolls inside its box.

## Consequences

- A formula shrinks only once the app runs in the browser, because only the browser measures its width. Before JavaScript loads, a formula that is wider than its column scrolls sideways.

- Each device draws the notation in its own math font, such as Cambria Math on Windows, so formulas look alike in kind but can differ in their glyphs.
- [Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) sets Instrument Sans and DM Mono as the fonts of the screens, and its references draw a formula as text with subscripts. A formula now takes the math font of the device instead.
- A formula is now a tree of MathML elements, which the browser also renders when the page loads. On 19 November 2026 this added about 1.6 kB of gzipped JavaScript and 0.2 kB of gzipped CSS to each page under the learning overlay, which holds the formulas of the lessons, and 0.05 kB of gzipped JavaScript to every page.
- A new formula composes the building blocks of `app/math-notation.tsx`, and a block that a formula needs and the module lacks goes there, so every formula keeps the same notation.
