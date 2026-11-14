# Browser tests

- Tests of signup and joining use the real forms and the running server's limits. This includes their validation, refusals, and behavior before JavaScript loads. Never raise, disable, or reset a limit to make a test pass.
- A test of another flow that only needs an existing student uses `signInAsTestStudent` or a setup helper built on it. Do not register students through `joinAsNewStudent` or `submitAccountForm` for setup.
