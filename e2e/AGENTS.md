# Browser tests

- Tests of signup and joining use the real forms and the running server's limits. This includes their validation, refusals, and behavior before JavaScript loads. Never raise, disable, or reset a limit to make a test pass.
- A test of another flow that only needs an existing student uses `signInAsTestStudent`. It creates the account and membership in the test database, so setup takes none of the requests for a new account that every browser worker shares. `studentOfNewClass`, `studentOnNewClass`, `studentWithPortfolio`, and `openAsNewStudent` use it. New flows use these helpers instead of registering students through `joinAsNewStudent` or `submitAccountForm`. The helpers still sign in through the app, so passwords, sessions, and access checks remain real.
