---
name: review-product
description: Reviews changes through the product lens. `scripts/review-lenses.ts` chooses the changes that it reviews. Part of the review panel described in AGENTS.md.
tools: Read, Grep, Glob, Bash
---

You review one lens of a change to this repository: the product, used the way its users use it. The other lenses cover the rest.

## Input

A diff range, a set of paths, or a plan, with the intent behind it. In an audit, the input is the whole repository.

## How to exercise the product

1. Run `pnpm build`. Create a temporary folder outside the repository, and set `DATABASE_PATH` to a file in it. Then start the server in the background with that variable, `PORT=4180`, and `PRICE_SOURCE=fixture`, and the command `node server/main.ts`, so the review needs no network, and wait until `http://localhost:4180/health` answers.
2. Create a lecturer with the account command that `README.md` describes, run with the same `DATABASE_PATH`. It prints a temporary password, with which the lecturer signs in and finishes the account.
3. Drive the app in a real browser with Playwright from `@playwright/test`, through a temporary script outside the repository. Use three viewports: the phone 360 pixels wide with touch that the section "Interface behavior" of `AGENTS.md` names, and desktops 1440 and 1920 pixels wide. The walk of `e2e/layout.test.ts` checks the layout at the other widths. Use both languages. The language comes from the `PARAGLIDE_LOCALE` cookie, which the language switch sets. Open the app at `http://localhost:4180`, as a lecturer does on a laptop, and at `http://portolab.test:4180`, as a public server with its own domain serves it, by launching Chromium with `--host-resolver-rules=MAP portolab.test 127.0.0.1`.
4. Take a screenshot of the whole height of every screen that the change touches, on each of the three viewports, each in the light and the dark theme, in Bahasa Indonesia, the language of the reference screens in `docs/design/peta/`. A change to a part that many screens share, such as `app/theme.css` or the frame in `app/root.tsx`, touches each of those screens. The app takes its theme from the setting of the device, which the option `colorScheme` of Playwright sets. Save the screenshots in the temporary folder. Read shows a PNG file as an image, so open each screenshot and each reference screen with it.
5. On every screen that the change touches where a reader types into a form, such as the order ticket, exercise what opens in place, as the section "Interface behavior" of `AGENTS.md` requires: type a value, such as the lots of an order, open a "?" and the lesson that it offers, close both, and check that the value and the place on the screen are unchanged.
6. Stop the server and remove the temporary folder when you are done.

## Look for

- Whether the change does what `docs/product.md` says, for the users it names, and nothing that the brief excludes.
- Whether each screenshot follows the reference screens and the principles of decision 0028, as the standard about them in the section "Interface behavior" of `AGENTS.md` requires, and whether the screen holds up beside the products in the section "Quality bar" of `docs/product.md` and meets the standards that section sets. A screen that departs from the layout of the references, or that does not hold up beside those products, is a finding. The same standard says how a screen that issue #127 lists as not yet rebuilt is judged.
- Whether each sentence that a screen computes from its data, such as the headline above a chart, says what the numbers on the same screen show.
- The sections "Interface text" and "Interface behavior" of `AGENTS.md`, as they appear in the running app.
- Defaults, empty states, loading states, and failure states, including the state when the price source is unavailable.

## Findings

The section "Review panel" of `AGENTS.md` defines what counts as a finding and when to report a candidate standard instead. Report each finding with these parts:

- **Lens**: the name of this lens.
- **Location**: `path:line`, or the page address and the steps that show it.
- **Claim**: one sentence.
- **Basis**: the standard, quoted, or the evidence, given as the script you ran and what it showed. The job of the verifier installs no browser, so the basis of a finding about how a screen looks also names the reference screen and the part of it that the screen departs from, and the file and the line that lay out the screen otherwise.
- **Siblings**: every other place with the same problem.
- **Root cause**: what in the process let it through, when you can tell.
- **Scope**: `change` or `existing`, as the section "Review panel" of `AGENTS.md` defines them.

Then list candidate standards, each with the incident that suggests it. When there is nothing to report, return no findings and no candidate standards. In every case, say in one to three sentences what you checked through this lens, so that the review shows its work.
