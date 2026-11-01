# AGENTS.md

Portolab is a portfolio management lab for university classes in Indonesia. Students build portfolios of IDX stocks with virtual cash at real delayed prices, and Portolab computes the measures of the course from their own holdings. The full product brief is [`docs/product.md`](docs/product.md), and every decision with a real alternative is in [`docs/decisions/`](docs/decisions/).

## Workflow

`pnpm check` runs everything that CI's check job runs.

Every change, however small:

1. Branch from an up-to-date `main` as `<type>/<summary-in-kebab-case>`. One coherent change goes on each branch. An improvement noticed along the way gets its own branch or a GitHub issue.
2. Make the change complete: code, tests, and every doc, example, and standard that it affects. Nothing is left for a follow-up.
3. Run `pnpm check`. It passes before every commit.
4. Commit using Conventional Commits, push, and open a pull request titled with the final commit message. Its description explains why the change is needed, because it becomes the body of the squashed commit, so update it whenever a push changes what the pull request does. Before each push, compare it with `git diff origin/main...HEAD`, so that it names every change to a standard, a message, or a check, each in short sentences. Enable auto-merge with `gh pr merge --auto --squash`. The pull request merges when CI's check job and review job both pass. When the review job fails, fix each verified finding through the defect protocol and push again.

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
- Each fact lives in one place, and other places link to it. In code, that place is one named constant, such as the delay of prices, the offset of WIB, or the names of the languages, and a text that states a fact that can change takes it as a placeholder. The name of Portolab is part of its texts, because it does not change while the app runs.

### Interface text

- Bahasa Indonesia is the default language, and English is complete as well. Every text is a Paraglide message in `messages/`, and no text is written directly in a component. `pnpm check` verifies that both languages have the same keys, that each key starts with the feature folder that uses it, or with `app_` when the whole app shares it, that each key ends with the kind of text it holds, such as `_title` or `_label`, and that a test shows every message in full in each language, a message without placeholders as a whole string. `scripts/messages.ts` holds the list of kinds. Both languages must also say the same thing, which only a reader can check.
- Indonesian text addresses the reader as "Anda".
- An error teaches. It states what happened with the real numbers, explains the rule behind it, and offers a next step, such as the largest order the cash allows.
- Numbers, rupiah amounts, percentages, and dates are formatted with `Intl` for the active language, never by hand. A value that `Intl` formats as one, such as a date with its time, is split for a layout through `formatToParts` of that one format, never joined from parts formatted apart.
- Every screen that shows prices says that they are delayed, shows when each price was quoted, and names the prices that the latest attempt could not update. Every result is labelled as a simulation.
- Text that says what Portolab will do, or when, shows what the code that does it computes, such as the time of the next attempt from the schedule that the job follows, so the text cannot promise what the code does not do.
- Portolab never recommends a security, because recommendations are regulated in Indonesia and because choosing is what students must learn.

### Interface behavior

- Every screen works with touch on a screen 360 pixels wide and with a keyboard alone. It never scrolls sideways, in every state that changes its content, such as a cell that shows a date. Touch targets are at least 44 pixels high.
- Forms work before JavaScript loads, so actions use React Router forms and actions instead of client-only handlers.
- A page sets its title through its route `meta` export, unless the title depends on something that `meta` cannot see, such as the result of an action or an error. Such a page renders `PageTitle` from `app/page-title.tsx`.
- A failure that a reader sees, including one from an action, appears on a page in the reader's language, through `app/error-page.tsx` or on the form that caused it, with the next step that its text offers. A bare text response is only for machines.
- Gains and losses use the ink color, never red or green, as decision 0012 explains. A sign and an arrow carry the meaning, and they come from the value as the page shows it, so a mark never disagrees with a rounded number.
- Every screen follows the look that decision 0012 sets. Its colors, fonts, spacing, and sizes, such as the smallest touch target, come from the tokens in `app/theme.css`, and a state that every control shares, such as hover or focus, is styled once there, so no control drifts from its siblings.

### Code

- Prefer explicit code over clever code, even when it takes more lines. ESLint rejects `reduce` in favor of plain loops, and it rejects the common abbreviations in favor of full words.
- An abstraction exists only for callers that exist today, never for a future that may not come. Logic that repeats becomes one function that every copy calls, in tests as much as in code, and jscpd checks both. When an existing function almost fits a new caller, it is reshaped instead of copied.
- Units get branded types, such as rupiah, index points, shares, and lots, and so do the quantities that the measures compute, such as a monthly return, a variance, a beta, and the weight of a holding, so mixing them up is a type error. Amounts of rupiah are whole numbers. A closed set of values, such as the indices that Portolab tracks, is a union type. Code that chooses by such a set fails to compile or to lint when the set gains a member, so a new member never falls into the branch of another. A table typed over the set and a switch that ESLint checks for exhaustiveness both give this, and so does a branch that reads a field that only its own members have.
- An expected failure, such as an order the cash cannot pay for, is a typed result that every caller must handle. Throwing is only for states that should never happen. Outside data can make a calculation undefined, such as prices that never change, whose variance of zero a correlation divides by, so the calculation checks for that state first and returns a typed failure.
- Data from outside the program is parsed into types at the boundary where it enters, by a parser function, in scripts and CI steps as much as in the app. Outside data includes form input, environment variables, command-line arguments, files, prices from the price source, and the output of agents. A type assertion such as `as` is not parsing, and neither is a type predicate (`value is T`) whose body does not check every part of its type. A parser is named `parse...`, takes `(value: unknown, source: string)` as its first parameters, and returns `Result<T, string>`. Its caller names the source, so one parser serves a file, an environment variable, and a test alike. ESLint checks this signature. Code inside the boundary trusts the parsed types and has no defensive checks for impossible states.
- A program that fails, such as a script, a CI step, or the server at startup, writes every reason to stderr before it exits, so the log explains the failure without a rerun. It parses all of its independent inputs before it stops, and it stops early only when a later input depends on an earlier one, so the server reads every environment variable at startup in one place. A program that runs a child process counts it as failed when it exits with another code than 0, and also when it writes to stderr if the tool can report an error with code 0, as drizzle-kit does. It passes on the stderr of the child when the child fails. A program that waits on a request, such as a job, a script, a check, or a step in CI, ends the request after a timeout, so a peer that hangs becomes a named failure. In CI, every step has a time limit of its own below the limit of its job, which `pnpm check` verifies. A job's timeout is shorter than its interval, and the job counts a timeout or an answer without usable data as a failure, so it records it and backs off. It also records each item that a partial answer lacks, so that the screen can name it. The record of a run also keeps what the run covered, such as the latest final day that it asked for, apart from when the run ended, because a long run can end in the next state of its schedule.
- A failure text names its source and the field or value that was wrong. A parser says what its source must be or have and what it is, through `describeValue` in `app/value-shapes.ts`, such as `PORT must be a whole number from 1 to 65535, but it is "0".` Code that handles a failed result passes that text on, instead of replacing it with a generic message, so the real reason reaches the reader.
- A program, a check, or a test that creates a temporary file or folder removes it when it finishes, even when it fails, or avoids the file, such as with a database in memory.
- A comment explains only why: a reason, an outside constraint, or a trap. It never narrates what the code does.
- The server finds the files that ship with it, such as its build and its migrations, from the location of its own code, never from the working directory. Only a path that the operator gives, such as `DATABASE_PATH`, resolves against the working directory. Scripts run through pnpm, which starts them in the root of the repository.
- A module that only the server may run ends in `.server.ts`, so that React Router keeps it out of the browser bundle.

### Structure

- Code is organized by feature in `app/features/<feature>/`. A feature folder holds that feature's routes, components, logic, styles, and tests. A feature uses another feature only through the exported functions and components that represent that feature's concept.
- A concept used by several features lives in the feature that owns it. A concept that no feature owns, such as the `Result` type, units of measure, formatting, or logging, lives directly in `app/`, or in a folder of `app/` named after the concept, such as `app/database/`. Folders named `utils`, `helpers`, `common`, `shared`, or `lib` are not allowed, because their names say nothing about what they hold.
- A module in `app/` that a script or the server imports uses only relative imports with the `.ts` extension, because both run in plain Node without the app's build. A module of `app/` outside the features never imports from a feature, so dependencies point from features to `app/` and never back. Only `app/root.tsx`, `app/routes.ts`, and `server/app.ts` compose the app from its features, and ESLint checks every other module of `app/` and `server/` against every way to load a module.
- No module keeps a connection or another service in a variable of its own, because the dev server evaluates an edited module again. The server opens the services at startup and hands them to loaders and actions through the load context, and `pnpm check` edits such modules in the dev server to prove it.
- File names are kebab-case. A file with one main export is named after it, such as `read-text-file.ts` for `readTextFile`, and a file whose exports serve one concept equally is named after the concept, such as `json.ts`. ESLint checks the name of every module that exports one value, apart from the names that React Router reads from a route module. Tests sit beside their code as `<name>.test.ts`, and browser tests live in `e2e/`.
- All market data passes through the price source interface, as decision 0001 explains, and every fact about the source, such as its name and its delay, comes from that interface.
- IDX rules, such as tick sizes, auto rejection limits, trading hours, and exchange holidays, are data with the dates they apply, as decision 0002 explains. A date that the data does not cover fails, so a missing year is noticed.

### Tests

- Tests exercise behavior through exported functions, not internals, and `knip --production` rejects a module or an export that only tests use. A module of `app/` that serves only tests is named `<name>-for-test`. An export may serve tests alone only when no exported function reaches its code without the network, the real clock, or a running schedule, and its comment then says so with `@internal`. A module that the screen of an open issue in the current milestone will call may land before that screen only as an entry of `knip.config.ts`, whose comment names the issue, so the exception stays visible until the screen calls it.
- A test name starts with the verb of the behavior it checks, such as "rejects" or "fails when".
- When two definitions must agree, such as a schema and its parser, or the lens names in `.github/review/route.schema.json` and the files in `.claude/agents/`, a test checks that they agree through the code that uses them, not through a copy of their data.
- A screen whose text depends on several states, such as whether data exists, whether its source failed for some items or for all, and when in the trading schedule that happened, is tested in both languages in every combination of the states that shape the same sentence. The kind of failure and the state of the schedule together set the time of the next attempt, for example, so each kind is tested in each state. When a text names items, such as the prices that an attempt missed, whether data exists is a state of each named item, so the tests include an item with stored data and an item without it. Code that follows a schedule is tested in each of its states, such as during a session, in its last minute, after the close, on a weekend, on a holiday, and on a date that no calendar covers, and with a run that starts in one state and ends in the next, such as a run that crosses the close.
- A test of generated text checks the whole sentence for each case that changes its grammar, such as one item and several items, or a word that takes "a" and one that takes "an".
- Every check is tested. A check script keeps the logic that chooses and judges its input in a module with tests beside it, and a lint rule is tested through ESLint itself. The tests cover input that the check must accept, files in every place it must reach, such as dot folders, and every form of code that can break the standard it enforces. For a rule that finds functions by name, that is every node that can carry a name together with a function or the type of a function: declarations, variables with a value or a type, parameters, assignments, named function expressions, object properties, class methods, fields, and accessors, and the members of interfaces. In each of them, the name can be an identifier, a quoted string, or a computed key. For a rule that restricts imports, that is every way to load a module, which means a static import, a type import, `export from`, `export * from`, and a dynamic `import()`, each with the alias, a relative path, and a path that climbs out of its folder. For a rule about the exports of a module, that is every way to export a value: functions, classes, enums, namespaces, and variables, including destructured ones, default exports, export lists with renamed or quoted names, `export from`, `export * as`, and `export import`. A test that lints code fails when the code does not parse, because no rule runs on such code, so a test that expects no report would pass without checking anything.
- A test of text that the interface shows, whether a browser test or a unit test, including an error page and a failure that a parser writes, runs the same checks in each language, from one test body and a table of the expected text that is typed over the languages, such as `Record<Locale, string>`.
- Every calculation of money or of a measure is tested against expected values computed independently, for example in a spreadsheet, and the test names that source.
- Every user flow has a browser test that runs on the phone and desktop projects. Each screen is checked with `e2e/expect-accessible-screen.ts`, which runs axe in the light and the dark theme and checks the touch targets and the width of the page, which axe does not check. The data of the browser tests includes the state with the widest content.

### CI

- Code that decides a gate checks that every expected input arrived, and treats a missing input as a failure, never as an empty one.
- A job that is a required check always runs and never ends as skipped, because GitHub counts a skipped required check as passed.
- Code that decides a gate from the results of jobs treats every result other than success as a failure that it names. It treats a cancelled job as superseded only when it can show the newer run, such as a newer head of the pull request, because GitHub also cancels a job that runs out of time.

### Dependencies

- A new dependency must be maintained and must have no lighter alternative already in the repository.
- `minimumReleaseAge` in `pnpm-workspace.yaml` is never lowered, because the delay gives the registry time to remove a compromised release. A package runs install scripts or provides agent instructions only when `pnpm-workspace.yaml` allows it explicitly.

### Privacy and security

- Portolab stores only what a class needs and nothing about real finances. No secret or credential ever enters the repository.
- Every change to sign-in or sessions follows decision 0005 and gets a security review.
- A redirect target that comes from input is resolved with the URL parser against the site's own origin, and it is accepted only when the origins match. The redirect uses only the path, query, and fragment of the result, and that path must resolve to the site's origin as well, because normalization can turn a value such as `/.//example.com` into a path that leads to another site. A check of the text alone misses such values.
