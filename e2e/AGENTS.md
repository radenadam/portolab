# Browser tests

- Tests of signup and joining use the real forms and the running server's limits. This includes their validation, refusals, and behavior before JavaScript loads. Never raise, disable, or reset a limit to make a test pass.
- A test of another flow that only needs an existing student uses `signInAsTestStudent` or a setup helper built on it. Do not register students through `joinAsNewStudent` or `submitAccountForm` for setup.
- A control that works before JavaScript loads and gains client behavior has a browser test of that transition. The test holds the client scripts, uses the native control, releases the scripts, waits for the client behavior to start, and checks that the reader's state is kept. Tests with JavaScript enabled or disabled alone do not cover this transition.
