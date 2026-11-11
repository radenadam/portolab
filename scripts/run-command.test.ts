import { userInfo } from "node:os";
import { expect, test } from "vitest";
import { runCommand } from "./run-command.ts";

const node = process.execPath;

test("returns the output of a command that ends with code 0, and passes it its input", () => {
  expect(
    runCommand(node, ["-e", "process.stdin.pipe(process.stdout)"], {
      input: "the input",
    }),
  ).toEqual({ ok: true, value: { code: 0, stdout: "the input" } });
});

test("returns an exit code that answers a question", () => {
  expect(
    runCommand(node, ["-e", "process.exit(1)"], { answerCodes: [1] }),
  ).toEqual({ ok: true, value: { code: 1, stdout: "" } });
});

test("fails with the code and the standard error of a command that fails", () => {
  const run = runCommand(node, [
    "-e",
    "process.stderr.write('the reason'); process.exit(3)",
  ]);
  expect(run).toEqual({
    ok: false,
    failure: `${node} -e process.stderr.write('the reason'); process.exit(3) ended with code 3. the reason`,
  });
});

// Windows has no signals, so there Node ends the process with code 1, and CI runs this test on Linux.
test.skipIf(process.platform === "win32")(
  "fails with the signal that ended a command",
  () => {
    const run = runCommand(node, [
      "-e",
      "process.kill(process.pid, 'SIGKILL')",
    ]);
    expect(run.ok).toBe(false);
    expect(!run.ok && run.failure).toContain(
      "was ended by the signal SIGKILL.",
    );
  },
);

test("fails when the command cannot start", () => {
  const run = runCommand("a-command-that-does-not-exist", []);
  expect(run.ok).toBe(false);
  expect(!run.ok && run.failure).toContain(
    "a-command-that-does-not-exist failed. It reported:",
  );
});

// Windows has no numbers of users, and root may run a command as any user, so CI runs this test on Linux as another user than root.
test.skipIf(process.platform === "win32" || userInfo().uid === 0)(
  "fails when the command cannot run as the user that it names",
  () => {
    const { uid, gid } = userInfo();
    const run = runCommand(node, ["-e", ""], {
      identity: { user: uid + 1, group: gid },
    });
    expect(run.ok).toBe(false);
    expect(!run.ok && run.failure).toContain("EPERM");
  },
);
