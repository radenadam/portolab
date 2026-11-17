# Contributing

Coding agents make most changes to Portolab, and every change follows the same workflow, whoever makes it. The standards live in [`AGENTS.md`](AGENTS.md), so this file covers only the steps.

1. Install [pnpm](https://pnpm.io) 12, then run `pnpm install`. This also installs git hooks that format and lint your staged files and check your commit message.
2. Follow the section "Workflow" of [`AGENTS.md`](AGENTS.md#workflow), which covers the branch, the change, `pnpm check`, and the pull request. The section "Review panel" describes the automated review that CI adds.

To report a bug or suggest an idea, open an issue. To report a vulnerability, follow [`SECURITY.md`](SECURITY.md).

After `pnpm build`, `pnpm size` reports shared and per-route JavaScript and CSS, plus both whole-client totals. [Decision 0038](docs/decisions/0038-client-javascript-is-budgeted-by-route.md) explains the JavaScript budgets and how to keep an enhancement with its route. [Decision 0042](docs/decisions/0042-client-css-is-budgeted-by-route.md) explains the CSS budgets.

## Decision records

Add a record in `docs/decisions/` with the next unused number in its filename and heading. Add its filename to [`docs/decisions/index.txt`](docs/decisions/index.txt) in number order, as [decision 0039](docs/decisions/0039-a-decision-catalog-makes-parallel-numbering-conflict.md) explains. Before pushing, merge `origin/main` into the branch and validate it as the [workflow](AGENTS.md#workflow) requires. The conventions check rejects duplicate decision numbers, an index that differs from the records, and a status line that continues after "Accepted" without a period. If another pull request has taken the number, renumber the record that your pull request adds and update its heading, links, mentions, and index entry. Keep the number of the record already on main. Find links by the record's filename. Check other mentions in context because another record can now use its former number. Check each changed link's label against its target.

For changes to earlier records, compare their bodies with `origin/main` and follow the [Writing standards](AGENTS.md#writing). [Decision 0029](docs/decisions/0029-the-server-draws-every-chart-as-svg.md) shows the status-line wording.
