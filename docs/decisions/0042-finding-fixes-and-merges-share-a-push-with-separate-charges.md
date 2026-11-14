# 0042. Finding fixes and merges share a push with separate charges

- Status: Accepted
- Date: 2026-11-15

## Context

[Issue #211](https://github.com/radenadam/portolab/issues/211) records a finding fix on #188 that could not start CI because the pull request conflicted with main. [GitHub documents](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request) that `pull_request` workflows do not run while merge conflicts remain. The fix and the merge that ended the conflict therefore reached the planner together. Decision 0037 refused that combination after the ordinary cap, even though both reserved allowances remained.

The planner kept only the scope of the whole push. It could not assign the author changes and manual merge resolutions to their separate allowances. Its tests required this refusal, so the checks preserved the defect.

## Measurements

The sample contains the 30 pull requests merged from 13 November 2026 through the latest merge at collection, #198 at 20:18:17 UTC on 14 November. It was collected with `gh pr list --state merged --search 'merged:>=2026-11-13' --limit 100` and `gh pr view <number> --json reviews`. A review with a reviewer counts as ordinary unless its comment identifies an extra merge round. A verifier-only run and a run without an agent do not count as ordinary. Repeated comments without another agent do not add a round.

| Ordinary rounds | Pull requests                                                    | Count |
| --------------- | ---------------------------------------------------------------- | ----- |
| 1               | #125, #126, #129, #140, #147, #148, #151, #155, #156, #158, #177 | 11    |
| 2               | #131, #134, #145, #153, #159, #160, #162, #190, #195, #198       | 10    |
| 3               | #130, #132, #138, #144, #152, #161, #173, #178, #180             | 9     |

#180 also needed one finding-check round. No merged pull request in this sample used an extra merge review. These counts describe the attempts that the existing cap allowed, so they cannot show how many later ordinary rounds would have sufficed.

The review comments supply file counts, agent turns, and rounded durations. Turns and durations below include both agents when a verifier ran. Durations are reconstructed from that rounded text. They are comparison measures, because the comments do not report tokens.

| Review scope       | Rounds | Median files | Median agent turns | Median agent seconds |
| ------------------ | ------ | ------------ | ------------------ | -------------------- |
| Whole change       | 30     | 16.5         | 15                 | 130.5                |
| Incremental change | 28     | 6            | 13                 | 58.5                 |

Three other changes exhausted the gate and continued in a new pull request. Their closing comments identify [#139 to #148](https://github.com/radenadam/portolab/pull/139), [#174 to #196](https://github.com/radenadam/portolab/pull/174), and [#188 to #212](https://github.com/radenadam/portolab/pull/188). Each used three ordinary rounds before restarting. #174 also used one extra merge round. #139 needed a late merge, #174 needed further author corrections after its merge review, and #188 needed the combined fix and merge. #196 and #212 were still open at collection, so their later costs are incomplete.

The first restarted review of [#148](https://github.com/radenadam/portolab/pull/148) read 28 files in 13 turns and 120 rounded seconds. The first of [#196](https://github.com/radenadam/portolab/pull/196) read 73 files in 55 combined turns and 324 rounded seconds. Together they reread 101 files in 68 turns and 444 rounded seconds. #212 had no completed review at collection. For comparison, the last ordinary round of #174 read two files in 12 combined turns and 58 rounded seconds. Its merge review read seven files in seven turns and 25 seconds. Another incremental ordinary round has the observed median cost of 13 turns and 58.5 seconds, while the class-map restart spent 55 turns and 324 seconds. Future savings remain an estimate because the incremental alternative did not run.

## Decision

Keep the caps together in `scripts/review-limits.ts`, which the planner and the verdict code read. Set its `reviewRoundLimit` to five. Keep the existing finding-check and merge-review limits. Two more ordinary rounds let a late author correction and a correction of its findings stay incremental. This avoids forcing a full restart at the point where the sample repeatedly reached its cap. Rounds run only when files change, so the 21 sampled pull requests that finished before round three would spend no more.

After ordinary reviews, a push may contain finding fixes, two-parent merges of main, or both. The history reader retains the author files and merge files separately, even when both touch one file. Foreign and octopus merges still require an ordinary review.

A combined run spends one finding-check round when author files changed and one extra merge-review round when manual resolutions changed. It uses the existing reviewer and verifier jobs in one workflow. The reviewer reads only the merge files through their remerge diffs. The verifier checks the open findings and accounts for every author file. Each author change must fix an open finding or complete the process, tests, and docs required by its fix. An unrelated change or an uncertain relation fails the run. The final job requires exactly one answer with evidence per author file, as it does for findings. Missing answers, repeated answers, unknown files, and failed jobs fail the gate.

The saved `round` counts spent allowances. A combined run advances it by two, and advances `mergeRounds` and `checkRounds` by one each. Ordinary usage is the total minus both reserved counts. Each allowance is judged from its own usage. A failed run keeps both charges and retains the earlier reviewed head and open findings. Neither allowance replenishes another. A clean merge with a finding fix spends only the check allowance. A merge without changed author files spends only the merge allowance. A push with no changed file keeps the earlier pass or unchanged behavior. The sum of the three caps still bounds the work.

Older states lack `checkRounds`. Their finding checks are the excess of the total minus merge rounds over the earlier ordinary cap of three. Reading that count preserves checks already spent when the ordinary cap increases. A current plan must supply its check count when its previous state has one. An older plan infers it by the same rule. Tests cover old states with exhausted checks and both unused and exhausted merge allowances.

The plan carries the files whose author changes need checking. A current plan must supply this field. An older plan whose previous state also lacks the check counter has none, so a final job that runs newer code can still finish a workflow planned at an older head. Only plans with author files require the new verifier output, and a missing current answer fails. The required check still judges the tested merge with main.

[Issue #192](https://github.com/radenadam/portolab/issues/192) remains separate. This decision preserves the existing remerge definition of manual integration edits and does not decide which edits may be authored inside a merge commit.

## Alternatives

- **Keep three ordinary rounds and restart.** The sample shows two completed full rereads after the cap and another restart awaiting review. This repeats work that an incremental round avoids.
- **Allow four ordinary rounds.** This gives a late author correction a reviewer, but its next correction immediately needs the verifier-only allowance. Five leaves one incremental review for that correction too, at the measured incremental cost.
- **Reset a cap after merging main.** Repeated merges could then refill the loop, so its total work would have no bound.
- **Treat the combined push as a merge alone.** This would let unrelated author work use a merge allowance and would not charge for checking the finding fixes.
- **Run finding checks on conflicting pull requests through another trigger.** This needs a separate trusted execution path and still needs a final review of resolutions against main. Combining the existing jobs keeps that final head as the one judged.

## Consequences

Finding fixes can reach CI together with a required merge without restarting the pull request. New tests exercise the separate and combined paths, exhausted budgets, failed jobs, and unrelated author work. Review comments name both charges. Additional author-file checks spend verifier work only after ordinary reviews, where the policy already restricts author changes to finding fixes.
