# 0039. A decision catalog makes parallel numbering conflict

- Status: Accepted
- Date: 2026-11-14

## Context

Pull requests #161 and #162 both chose decision number 0037. A check of filenames detects the duplicate after an author merges main. Two pull requests can both pass that check before either merges. Main accepts their stale checks, so both can merge. The first round of review in #178 verified this remaining race.

## Decision

`docs/decisions/index.txt` lists every numbered decision filename in number order, one per line. The decision number check rejects a catalog that differs from the files. Two branches that give different records the same number insert their filenames at the same place. Number order keeps this place fixed even when the numbers have different zero padding. Git reports a conflict before the second branch merges. Tests create two branches that each pass the check, confirm that their merge conflicts in the catalog, and confirm that renumbering the later record resolves it.

The author resolves the conflict by keeping the number already on main and renumbering the record of the pull request. [The decision record workflow](../../CONTRIBUTING.md#decision-records) gives the steps.

## Alternatives

- **Require every branch to pass checks against the latest main.** [GitHub's strict status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging) require branches to include the latest main before merging. Other merges can then force each screen branch to repeat its checks. The catalog requires an update only from a change to the set of decision records.
- **Use a merge queue.** [GitHub requires an organization owner and workflows that check `merge_group`](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue). This would require moving the repository to an organization.
- **Check filenames without a catalog.** Two passing pull requests can still merge duplicate numbers when neither includes the other.

## Consequences

The catalog carries filenames only. Changes to the prose of a record need no catalog edit.
