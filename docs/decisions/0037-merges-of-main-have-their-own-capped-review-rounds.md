# 0037. Merges of main have their own capped review rounds

- Status: Accepted
- Date: 2026-11-14

## Context

Pull request #139 used its ordinary review rounds and had no open finding. Other pull requests then merged into main, so it had to merge main and resolve conflicts. The cap refused to review those resolutions, so #148 restarted the same change in a new pull request and reviewed it all again. Parallel work on #127 makes such merges common, and reviewing the earlier change again spends usage without new work to judge. Issue #149 records the defect in the gate.

## Decision

`scripts/review-plan.ts` sets three independent limits: `reviewRoundLimit` for ordinary reviews, `mergeReviewRoundLimit` for extra merge reviews, and `checkRoundLimit` for rounds that only check open findings. The total number of rounds that run an agent cannot exceed their sum. A round whose agent did not finish spends its allowance too.

After the ordinary review rounds, a push that contains only merges of main since the head that the last finished round reviewed may use an extra merge review. Each merge has two parents, and its second parent must be an ancestor of the current base branch. The reviewer reads only manual integration work, which `git show --diff-merges=remerge` selects by comparing the recorded merge with the automatic merge that Git recreates. This includes edits made while resolving the merge and leaves out files Git combined automatically, even when both parents changed one file. A foreign merge or a merge with more parents needs an ordinary review, which includes its imported files. The verifier checks any new findings and the open ones. A merge before the ordinary cap uses an ordinary round. A merge that resolves nothing uses no round and passes only when no finding is open.

A push with both merges and other author commits does not qualify for any round after the ordinary cap, even when they change the same files. A push with author commits alone may only fix open findings through the verifier-only allowance. Neither extra merge reviews nor verifier-only rounds replenish the other allowance. A change that no remaining round may read or check fails without an agent. The author then decides how the change continues, such as in a new pull request.

The plan records the reason for a refusal, so the review text explains the rule that refused the push even when other allowances are exhausted too. An older plan that names no reason gets a general refusal text rather than a guess from its counters.

The saved state keeps the count of extra merge reviews apart from the total rounds, including failures. Older states used no extra merge reviews, so their missing count reads as zero. A plan from an older pull request head also reads with zero merge rounds when both it and its previous state lack the count, because the final job can run newer code from the merge with main. A current plan whose previous state has the count must supply its own count too. A history that no longer contains the reviewed head cannot use the extra allowance because it has no reviewed starting point from which to select only the merge resolutions.

## Alternatives

- **Start another pull request after each late merge.** This bounds each panel run but repeats the review of the whole change, which caused the waste in #148.
- **Reset the ordinary cap after a merge.** This lets unrelated author changes enter another ordinary review and lets repeated merges restart the panel without end.
- **Use a combined diff to select resolutions.** A combined diff also lists a file whose disjoint edits Git merged automatically, so a clean merge would spend a round. Real merge tests now cover automatic same-file merges and manual integration edits. The [Git documentation](https://git-scm.com/docs/git-show#Documentation/git-show.txt-remerge) describes the remerge comparison.
- **Allow unlimited merge reviews.** Each round stays small, but parallel work could keep the panel running without a bound.

## Consequences

- A late merge with conflicts can finish in the same pull request without repeating its earlier review.
- An author pushes merges separately from finding fixes after the ordinary cap, so the gate can identify which allowance the push may use.
- Repeated conflicts can exhaust the merge allowance. The gate then fails, so a maintainer still decides how a change continues at the final cap.
