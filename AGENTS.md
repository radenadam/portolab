# AGENTS.md

Portolab is a portfolio management lab for university classes in Indonesia. Students build portfolios of IDX stocks with virtual cash at real delayed prices, and Portolab computes the measures of the course from their own holdings. The full product brief is [`docs/product.md`](docs/product.md), and every decision with a real alternative is in [`docs/decisions/`](docs/decisions/).

## Workflow

`pnpm check` runs everything that CI's check job runs.

Every change, however small:

1. Branch from an up-to-date `main` as `<type>/<summary-in-kebab-case>`. One coherent change goes on each branch. An improvement noticed along the way gets its own branch or a GitHub issue.
2. Make the change complete: code, tests, and every doc, example, and standard that it affects. Nothing is left for a follow-up.
3. Run `pnpm check`. It passes before every commit.
4. Commit using Conventional Commits, push, and open a pull request titled with the final commit message. Its description explains why the change is needed, because it becomes the body of the squashed commit, so update it whenever a push changes what the pull request does. Enable auto-merge with `gh pr merge --auto --squash`. The pull request merges when CI's check job and review job both pass. When the review job fails, fix each verified finding through the defect protocol and push again.

Work that is noticed but not done becomes a GitHub issue: a flaw that is parked, an open question, or an idea. Nothing about the state of the project lives only in a conversation or in a comment in the code.

## Review panel

The reviewers are in `.claude/agents/`. Each `review-*` file is one lens, and its description says which changes it applies to. `review-verifier` tries to refute each finding.

While working, call any lens whenever its view would help: on a plan before writing code, partway through a change, or before opening the pull request. Locally the choice is yours, and the gate is CI.

On every push to a pull request, the review workflow in CI runs the panel. A fresh agent, the router, picks the lenses: every lens whose description covers what the change touches, and every lens it is unsure about. `review-standards` and `review-consistency` always run. Each lens then runs as its own job with a fresh agent, the verifier checks every finding, and the `review` job posts one review on the pull request. The `review` job fails while any verified finding remains. It also fails when any part of the panel did not finish, because an unfinished lens has reviewed nothing, and when the verifier did not give exactly one verdict for each reported finding.

A finding counts only when it names a standard in this repository or demonstrates a concrete defect, because preference without a standard behind it creates churn instead of quality. Every verified finding is fixed before merge, and there is no lower tier to defer. A lens that believes a standard is missing reports a candidate standard. Adopt it when it would have prevented a real defect, and take candidates that turn on taste to a maintainer. When a defect reaches `main` past the gate, the router or a lens missed it, so trace which one and fix it. An agent without subagents runs each lens file as a separate pass.

A lens definition links to the standards in this file instead of restating them, so that sharpening a standard leaves no stale copy behind. An agent definition describes its task and what each part of its answer means. The schemas in `.github/review/` and the prompts in `.github/workflows/review.yml` alone define the shape of that answer in CI, so the definition and the workflow never disagree about it.

## Defect protocol

A defect is evidence about the process that produced it, wherever it surfaces: in review, in CI, in a bug report, or in a maintainer's reaction.

1. **Trace.** Find what let it through: a standard that was never written or is too vague, a missing check, a lens that was not looking, or a wrong pattern.
2. **Fix the process.** Write or sharpen the standard, add the check, or sharpen the lens.
3. **Redo everything the flawed process produced**, not only the instance found. The root cause sets how far that reaches. A new or sharpened standard reaches every existing file that it now covers, in the same change.
4. **Record.** The commit message states the root cause and the scope. Write a decision record only when a real alternative was weighed and the choice has lasting consequences.

Fixing only the instance leaves in place the process that produced it.

## This file

Every line here is read at the start of every session. A standard earns its place by changing behavior that no tool can enforce and that cannot be derived from the code. To add one, abstract it to the class of defect it prevents, merge it into an existing standard when one covers the same ground, and remove whatever it makes obsolete. Standards for one area of the code go in a nested `AGENTS.md` in that directory, with a `CLAUDE.md` beside it that contains `@AGENTS.md`. This file stays under 200 lines.

## Standards

### Writing

These apply to all prose: docs, comments, commit messages, pull requests, issues, every text in the interface, and every text that code generates, such as log messages and automated reviews.

- Every sentence is easy to parse for a reader with basic English or basic Bahasa Indonesia. This is about sentence structure only. It never means simpler ideas or padding.
- Connect ideas with words such as "because", "so", "but", and "which means", or split them into separate sentences. A colon may introduce a list, an example, or code, or separate a label from its description. `pnpm check` reads every Markdown, TypeScript, CSS, and YAML file in the repository, including those in dot folders, and the messages. In prose, which means Markdown outside code spans and code blocks, issue templates, and messages, it rejects em dashes, en dashes, and semicolons. In TypeScript, CSS, and YAML, it rejects dashes on every line and semicolons in comments. It cannot see a dash in a code span in prose, a semicolon in a string that code generates, or a colon that joins two clauses, so watch for those.
- Write plainly and directly. No marketing filler, no hedging, and no text that coaches the reader on what they already know.
- Each fact lives in one place, and other places link to it.

### Interface text

- Bahasa Indonesia is the default language, and English is complete as well. Every text is a Paraglide message in `messages/`, and no text is written directly in a component. `pnpm check` verifies that both languages have the same keys, that each key starts with the feature folder that uses it, or with `app_` when the whole app shares it, and that each key ends with the kind of text it holds: `_title`, `_body`, `_label`, `_notice`, `_error`, `_link`, or `_name`. Both languages must also say the same thing, which only a reader can check.
- Indonesian text addresses the reader as "Anda".
- An error teaches. It states what happened with the real numbers, explains the rule behind it, and offers a next step, such as the largest order the cash allows.
- Numbers, rupiah amounts, percentages, and dates are formatted with `Intl` for the active language, never by hand.
- Every screen that shows prices says that they are delayed, and every result is labelled as a simulation.
- Portolab never recommends a security, because recommendations are regulated in Indonesia and because choosing is what students must learn.

### Interface behavior

- Every screen works with touch on a screen 360 pixels wide and with a keyboard alone. Touch targets are at least 44 pixels high.
- Forms work before JavaScript loads, so actions use React Router forms and actions instead of client-only handlers.
- Gains and losses never rely on color alone. A sign or an arrow always carries the meaning.
- Colors, fonts, and spacing come from the tokens in `app/theme.css`.

### Code

- Prefer explicit code over clever code. A plain loop beats a chain of `reduce` calls. Names use full words, and ESLint rejects the common abbreviations.
- An abstraction exists only for callers that exist today, never for a future that may not come. Logic that repeats becomes one function that every copy calls. When an existing function almost fits a new caller, it is reshaped instead of copied.
- Units get branded types, such as rupiah, shares, and lots, so mixing them up is a type error. Amounts of rupiah are whole numbers.
- An expected failure, such as an order the cash cannot pay for, is a typed result that every caller must handle. Throwing is only for states that should never happen.
- Data from outside the program is parsed into types at the boundary where it enters, by a parser function, in scripts and CI steps as much as in the app. Outside data includes form input, environment variables, files, prices from the price source, and the output of agents. A type assertion such as `as` is not parsing, and neither is a type predicate (`value is T`) whose body does not check every part of its type. A parser is named `parse...`, takes `(value: unknown, source: string)` as its first parameters, and returns `Result<T, string>`. Its caller names the source, so one parser serves a file, an environment variable, and a test alike. ESLint checks this signature. Code inside the boundary trusts the parsed types and has no defensive checks for impossible states.
- A program that fails, such as a script, a CI step, or the server at startup, writes every reason to stderr before it exits, so the log explains the failure without a rerun. It parses all of its independent inputs before it stops, and it stops early only when a later input depends on an earlier one.
- A failure text names its source and the field or value that was wrong. Code that handles a failed result passes that text on, instead of replacing it with a generic message, so the real reason reaches the reader.
- A comment explains only why: a reason, an outside constraint, or a trap. It never narrates what the code does.
- A module that only the server may run ends in `.server.ts`, so that React Router keeps it out of the browser bundle.

### Structure

- Code is organized by feature in `app/features/<feature>/`. A feature folder holds that feature's routes, components, logic, styles, and tests. A feature uses another feature only through the exported functions and components that represent that feature's concept.
- A concept used by several features lives in the feature that owns it. A concept that no feature owns, such as the `Result` type, units of measure, formatting, or logging, lives directly in `app/`, in a file or folder named after the concept. Folders named `utils`, `helpers`, `common`, `shared`, or `lib` are not allowed, because their names say nothing about what they hold.
- A script in `scripts/` imports from `app/` only a module that imports nothing itself, because scripts run in plain Node without the app's build.
- File names are kebab-case. A file with one main export is named after it, such as `read-text-file.ts` for `readTextFile`, and a file whose exports serve one concept equally is named after the concept, such as `json.ts`. Tests sit beside their code as `<name>.test.ts`, and browser tests live in `e2e/`.
- All market data passes through the price source interface, as decision 0001 explains.
- IDX rules, such as tick sizes and auto rejection limits, are data with the dates they apply, as decision 0002 explains.

### Tests

- Tests exercise behavior through exported functions, not internals.
- A test name starts with the verb of the behavior it checks, such as "rejects" or "fails when".
- When two definitions must agree, such as a schema and its parser, or the lens names in `.github/review/route.schema.json` and the files in `.claude/agents/`, a test checks that they agree through the code that uses them, not through a copy of their data.
- A test of generated text checks the whole sentence for each case that changes its grammar, such as one item and several items, or a word that takes "a" and one that takes "an".
- Every check is tested. A check script keeps the logic that chooses and judges its input in a module with tests beside it, and a lint rule is tested through ESLint itself. The tests cover input that the check must accept, files in every place it must reach, such as dot folders, and every form of code that can break the standard it enforces. For a rule that finds functions by name, that is every node that can carry a name together with a function or the type of a function: declarations, variables with a value or a type, parameters, assignments, named function expressions, object properties, class methods, fields, and accessors, and the members of interfaces.
- Every calculation of money or of a measure is tested against expected values computed independently, for example in a spreadsheet, and the test names that source.
- Every user flow has a browser test that runs on the phone and desktop projects. Each screen is checked for accessibility with axe and for touch targets with `e2e/expect-touch-targets.ts`, because axe does not check the 44 pixels.

### CI

- Code that decides a gate checks that every expected input arrived, and treats a missing input as a failure, never as an empty one.
- A job that is a required check always runs and never ends as skipped, because GitHub counts a skipped required check as passed.

### Dependencies

- A new dependency must be maintained and must have no lighter alternative already in the repository.
- `minimumReleaseAge` in `pnpm-workspace.yaml` is never lowered, because the delay gives the registry time to remove a compromised release. A package runs install scripts or provides agent instructions only when `pnpm-workspace.yaml` allows it explicitly.

### Privacy and security

- Portolab stores only what a class needs and nothing about real finances. No secret or credential ever enters the repository.
- Every change to sign-in or sessions follows decision 0005 and gets a security review.
- A redirect target that comes from input is resolved with the URL parser against the site's own origin, and it is accepted only when the origins match. The redirect uses only the path, query, and fragment of the result, and that path must resolve to the site's origin as well, because normalization can turn a value such as `/.//example.com` into a path that leads to another site. A check of the text alone misses such values.
