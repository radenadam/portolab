# 0051. Browser tests run in eight independent shards

- Status: Accepted
- Date: 2026-11-16

## Context

The Check workflow ran `pnpm check` in one job. Each piece of the rebuild adds browser cases, and [issue #269](https://github.com/radenadam/portolab/issues/269) records complete runs and runs that exhausted the whole-check deadline. Raising that deadline keeps every pull request waiting on the entire suite on one runner. [Issue #275](https://github.com/radenadam/portolab/issues/275) separately tracks snapshot cases that put too much work within one case deadline. Sharding does not change a case's work or deadline.

## Measurements

These measurements come from the Check logs and the job and step timestamps returned by `gh run view <id> --json jobs`. Browser durations come from Playwright's summary, so they exclude installation and the fast check. Case durations use the rounded values that Playwright reports.

| Run                                                                           | Head      | Cases | Browser phase |       Whole check job |
| ----------------------------------------------------------------------------- | --------- | ----: | ------------: | --------------------: |
| [43760746237](https://github.com/radenadam/portolab/actions/runs/43760746237) | `1a0ccf5` |   564 |  28.2 minutes | 31 minutes 52 seconds |
| [43805077482](https://github.com/radenadam/portolab/actions/runs/43805077482) | `3fcac94` |   682 |  35.4 minutes | 38 minutes 53 seconds |
| [43816264127](https://github.com/radenadam/portolab/actions/runs/43816264127) | `a952172` |   688 |  41.7 minutes |  46 minutes 3 seconds |

The latest passing main run is the last row. Its browser phase used four workers and finished with 675 passes and 13 skips. The whole-check step took 45 minutes 33 seconds. The fast phase before the browser cases took about 3 minutes 54 seconds within that step. These are observations of different heads and runners, so their difference does not isolate a cause of slower cases.

Dividing the latest browser duration by four already projects 10.4 minutes per shard before uneven work. To compare larger counts, list the suite with `pnpm exec playwright test --list --shard=i/n --reporter=json`. Match each case by project, file, line, and full title to the 675 passing case durations in the main log. Sum each shard's case durations and divide by its four workers. Skipped cases contribute no duration. These estimates exclude startup and assume the same case timings and continuous worker use.

| Shards | Cases per shard              | Projected minutes by shard               | Longest projection |
| -----: | ---------------------------- | ---------------------------------------- | -----------------: |
|      5 | 138, 138, 138, 137, 137      | 5.80, 11.83, 8.81, 5.36, 9.57            |              11.83 |
|      6 | 115, 115, 115, 115, 114, 114 | 5.14, 7.93, 8.62, 4.90, 7.05, 7.73       |               8.62 |
|      7 | 99, 99, 98, 98, 98, 98, 98   | 5.13, 5.21, 8.73, 5.69, 2.82, 7.61, 6.18 |               8.73 |

With the initial four-worker profile, six is the smallest measured count whose longest projection stays below the target of about ten minutes. Its longest shard leaves about 16 percent growth before ten minutes. Seven repeats setup on another runner without lowering the longest projection. Playwright balances case counts rather than observed durations, so CI must also measure each shard. The six lists together contain every one of the suite's 688 cases once.

### The first sharded runs

[Run 43873909579](https://github.com/radenadam/portolab/actions/runs/43873909579/attempts/1) ran the six shards with four case workers on each runner. The fast job passed in 311 seconds. The browser steps took 412, 616, 515, 255, 447, and 569 seconds. Shard 1 completed its 115 cases with 109 passes, two skips, and four failures at the existing 60-second case deadline. The other five shards passed. The gate named browser-1 and failed, and its traces and HTML report remained downloadable.

An [unchanged rerun of the failed jobs](https://github.com/radenadam/portolab/actions/runs/43873909579/attempts/2) reused the five passing shards and the fast result. Shard 1 again completed in 6.8 minutes with four cases at their own deadline. The first attempt lost the English native activity journey, the Indonesian demonstration summary, and both demonstration trading journeys. The rerun lost both demonstration summaries and both trading journeys. These are case deadlines within a completed shard, rather than the whole-check deadline that sharding removes.

The original choice copied the monolithic worker pool and sized only the total work. It did not leave the long cases enough margin for the variation that issue #269 already measured. Case workers share CPU with the server and Chromium, so the new default uses half the CPUs. The measured runners have four CPUs, which gives two case workers. The reliability lens now checks each unit's deadline as well as the whole job when parallelism changes. This changes the pool in CI and keeps the existing local default and slot settings.

### Measurements with two workers

[Run 43888319757](https://github.com/radenadam/portolab/actions/runs/43888319757) at `aa8f795` completed all 688 cases with two case workers per runner, 675 passes, and 13 skips. Its six browser steps took 461, 491, 760, 296, 436, and 557 seconds. No case reached its deadline. The four JavaScript demonstration cases that had repeatedly reached 60 seconds took 33.2, 35.9, 33.2, and 36.1 seconds. The longest layout walk took 72 seconds against its 180-second limit. The longest lesson-practice case took 50.2 seconds against its 120-second limit.

The longest browser step took 12 minutes 40 seconds, so the shard count must be sized again for this pool. Match all 675 passing case durations from this run to the shard lists and divide each shard's sum by two workers. The skipped cases again contribute no duration. Each candidate list contains every one of the 688 cases once.

| Shards | Projected minutes by shard                                 | Longest projection |
| -----: | ---------------------------------------------------------- | -----------------: |
|      5 | 8.22, 14.05, 10.47, 5.32, 11.06                            |              14.05 |
|      6 | 7.57, 7.99, 12.48, 4.84, 7.07, 9.17                        |              12.48 |
|      7 | 7.55, 5.17, 11.64, 6.71, 2.85, 7.89, 7.31                  |              11.64 |
|      8 | 7.54, 3.54, 9.02, 7.86, 4.89, 3.18, 7.13, 5.95             |               9.02 |
|      9 | 7.53, 1.15, 7.30, 9.21, 5.11, 2.58, 4.40, 6.67, 5.17       |               9.21 |
|     10 | 7.24, 0.98, 5.14, 8.91, 5.77, 4.70, 0.86, 4.62, 6.56, 4.34 |               8.91 |

Eight is the smallest candidate whose longest projection stays below ten minutes with the chosen two-worker pool. Every shard contains 86 cases. Nine makes the longest projection slower. Ten saves about seven seconds on that projection but repeats installation and a build on two more runners.

Each observed browser step took about 6 to 12 seconds longer than its projection from the case timings with two workers. Using the 1.464 median duration ratio from issue #269 as a scenario gives a longest projection of about 13.2 minutes for eight shards, before this overhead. This leaves more than six minutes below the 20-minute step limit. The longest of the four demonstration journeys becomes about 52.9 seconds at that ratio, below its unchanged 60-second deadline.

## Decision

Run `pnpm check:fast` in its own job and split the browser suite into eight independent jobs with Playwright's `--shard=i/8`. Use half the CPUs for case workers unless a check slot selects a smaller pool. Keep the assertions, case deadlines, and zero retries. The existing `fullyParallel` setting allows [Playwright to shard individual tests](https://playwright.dev/docs/test-sharding#balancing-shards).

Each browser job installs through the existing cached `pnpm/setup` action, installs Chromium through the existing browser action, builds once, and runs only its shard. The fast job installs once and runs its existing build and size check without installing Chromium. The gate checks out the code and runs a Node script that needs no package installation or build. Local `pnpm check` still runs the fast check and complete browser suite in sequence.

Use explicit job ids so `needs` gives the gate a separate result for every shard. The browser jobs reuse their steps through [YAML anchors supported by GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#yaml-anchors-and-aliases). The required job keeps the name `check`, uses `always()`, and waits for the fast job and all eight browser jobs. It fails for every result other than `success`, including a missing result, cancellation, or skip. Its tests compare the expected jobs with the workflow and exercise all unsuccessful results and malformed inputs through the gate code.

Every job and step keeps a time limit. Browser execution has a 20-minute step limit within a 35-minute job. The two-worker projections and variation scenario above size the step margin. The job leaves time for setup and for uploading evidence after a step timeout. Each failed shard uploads `test-results/` and `playwright-report/` under a unique artifact name for seven days. There is no sibling cancellation on a shard failure, so the other shards finish their coverage and retain their own evidence.

## Alternatives

- **Keep one browser runner and raise its limit.** The observed complete runs already take tens of minutes, and the growing suite keeps increasing that wait.
- **Use fewer than eight shards.** The two-worker measurements project more than the ten-minute target for five, six, or seven shards before growth. Six already took 12 minutes 40 seconds in the complete two-worker run.
- **Use nine or ten shards.** Nine has a slower longest projection than eight. Ten saves about seven seconds while repeating setup on two more runners.
- **Keep one case worker per CPU.** The two sharded runs still exhausted individual case deadlines even though the shards finished. A smaller pool leaves CPU for the server and browser processes without enlarging those deadlines.
- **Use a matrix and judge its aggregate result.** A matrix gives `needs` one result for the matrix job, which cannot name every unsuccessful shard. Collecting per-shard artifacts or querying the jobs API would add another failure path to the gate.
- **Build in a separate job and transfer the build.** A build is short compared with the browser suite. Transferring its generated server and client files would add an artifact dependency and download on every shard. Each shard instead builds once, without repeating the fast checks.

## Consequences

The slowest browser shard sets the Check workflow's wait once the fast job finishes. Each shard has its own server and temporary database, which reduces concurrent work on any one server without changing the tests. Additional runners repeat setup and builds, so total runner time can grow even while wall time falls. A case that exhausts its own deadline still fails and needs a separate correction.

The change adds no client JavaScript or CSS and changes no route budget. Main's first complete sharded run provides the comparison against the measured main run above, including every shard's browser and job duration.
