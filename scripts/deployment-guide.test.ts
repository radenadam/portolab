import { expect, test } from "vitest";
import { fail, succeed } from "../app/result.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import {
  checkBackupsOnlyForRoot,
  checkSystemNamed,
  followsGuide,
  guidePath,
  parseIdOutput,
  parseRunArguments,
  parseServerBlocks,
  parseSystemRelease,
  parseTestEvent,
} from "./deployment-guide.ts";
import { readTextFile } from "./read-text-file.ts";
import type { ChangedFile } from "./review-lenses.ts";

const repository = "/tmp/portolab.git";

/** A guide with every example that the test replaces, in blocks for the server and for the computer of the reader. */
const guide = `# Deploying Portolab

<!-- A comment -->

## 1. Connect

\`\`\`text
ssh root@203.0.113.10
\`\`\`

## 2. Start Portolab

\`\`\`sh
git clone https://github.com/radenadam/portolab.git /opt/portolab
cd /opt/portolab
\`\`\`

## 3. Serve Portolab over HTTPS

- Write the Caddyfile:

  \`\`\`sh
  cat > /etc/caddy/Caddyfile <<'EOF'
  import /opt/portolab/Caddyfile portolab.example.com
  EOF
  \`\`\`

### Restore a backup

\`\`\`sh
sqlite3 ".restore /backups/portolab-2026-11-10.sqlite"
\`\`\`
`;

function changeOf(...paths: string[]): ChangedFile[] {
  return paths.map((path) => ({ path, change: "modified" }));
}

test("follows the guide for a pull request that touches a file or a folder of the deployment or of its test", () => {
  for (const path of [
    "Dockerfile",
    ".dockerignore",
    "compose.yaml",
    "Caddyfile",
    "docs/deploy.md",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "server/main.ts",
    ".github/workflows/deployment.yml",
    "scripts/deployment-guide.ts",
    "scripts/plan-deployment-test.ts",
    "scripts/run-deployment-guide.ts",
    "e2e/deployment/join-on-the-server.test.ts",
  ]) {
    expect(
      followsGuide("pull_request", () =>
        succeed(changeOf("app/root.tsx", path)),
      ),
      path,
    ).toEqual({ ok: true, value: true });
  }
});

test("skips the guide for a pull request that touches no file of the deployment, such as one whose name only starts like one", () => {
  for (const paths of [
    [],
    ["app/root.tsx", "docs/product.md"],
    ["Dockerfile.old", "server-notes.md", "e2e/deployment.test.ts"],
  ]) {
    expect(
      followsGuide("pull_request", () => succeed(changeOf(...paths))),
      paths.join(", "),
    ).toEqual({ ok: true, value: false });
  }
});

test("passes on the failure to read the change of a pull request", () => {
  expect(
    followsGuide("pull_request", () =>
      fail("git diff ended with code 128. fatal: bad revision"),
    ),
  ).toEqual({
    ok: false,
    failure: "git diff ended with code 128. fatal: bad revision",
  });
});

test("follows the guide on a schedule and by hand without reading a change", () => {
  for (const event of ["schedule", "workflow_dispatch"] as const) {
    expect(
      followsGuide(event, () => {
        throw new Error("A run without a pull request has no change to read.");
      }),
    ).toEqual({ ok: true, value: true });
  }
});

test("reads each event that starts the test and rejects any other", () => {
  for (const event of ["pull_request", "schedule", "workflow_dispatch"]) {
    expect(parseTestEvent(event, "GITHUB_EVENT_NAME")).toEqual({
      ok: true,
      value: event,
    });
  }
  expect(parseTestEvent("push", "GITHUB_EVENT_NAME")).toEqual({
    ok: false,
    failure:
      'GITHUB_EVENT_NAME must be "pull_request", "schedule", or "workflow_dispatch", but it is "push".',
  });
});

test("reads the repository that the guide clones from the command line", () => {
  expect(
    parseRunArguments(["--repository", repository], "The command line"),
  ).toEqual({ ok: true, value: repository });
});

test("rejects a command line without a repository, with another option, or that is not a list", () => {
  expect(parseRunArguments([], "The command line")).toEqual({
    ok: false,
    failure:
      "--repository must name the repository that the guide clones, but it is missing.",
  });
  expect(parseRunArguments(["--repository="], "The command line")).toEqual({
    ok: false,
    failure:
      "--repository must name the repository that the guide clones, but it is empty.",
  });
  const otherOption = parseRunArguments(
    ["--repository", repository, "--domain", "portolab.internal"],
    "The command line",
  );
  expect(otherOption.ok ? "" : otherOption.failure).toMatch(
    /^The command line must hold only the option --repository, but it is \["--repository","\/tmp\/portolab\.git","--domain","portolab\.internal"\]\. Node reported: \S/,
  );
  expect(parseRunArguments("--repository", "The command line")).toEqual({
    ok: false,
    failure:
      'The command line must be a list of arguments, but it is "--repository".',
  });
});

test("reads the blocks for the server in order, with their sections, the commands of the test in place of the examples, and without the indentation of a list", () => {
  expect(parseServerBlocks(guide, guidePath, repository)).toEqual({
    ok: true,
    value: [
      {
        section: "2. Start Portolab",
        commands: "git clone /tmp/portolab.git /opt/portolab\ncd /opt/portolab",
      },
      {
        section: "3. Serve Portolab over HTTPS",
        commands:
          "cat > /etc/caddy/Caddyfile <<'EOF'\nimport /opt/portolab/Caddyfile portolab.internal\nEOF",
      },
      {
        section: "Restore a backup",
        commands: 'sqlite3 ".restore /backups/portolab-$(date -I).sqlite"',
      },
    ],
  });
});

test("reads every block of the guide of the repository and finds each example in it", () => {
  const blocks = successValueForTest(
    parseServerBlocks(
      successValueForTest(readTextFile(guidePath), `${guidePath} can be read`),
      guidePath,
      repository,
    ),
    `${guidePath} has the blocks that the test runs`,
  );
  expect(blocks.length).toBeGreaterThan(0);
});

test("rejects a block that the test would skip because it is marked with another kind, with no kind, or fenced with tildes", () => {
  for (const [fence, failure] of [
    [
      "```bash",
      'docs/deploy.md must mark each block as sh for the server or as text for the computer of the reader, but line 3 is "```bash".',
    ],
    [
      "```",
      'docs/deploy.md must mark each block as sh for the server or as text for the computer of the reader, but line 3 is "```".',
    ],
    [
      "~~~sh",
      "docs/deploy.md must fence each block with backticks, but line 3 uses tildes.",
    ],
  ] as const) {
    expect(
      parseServerBlocks(
        `# Guide\n\n${fence}\napt-get update\n${fence.slice(0, 3)}\n`,
        guidePath,
        repository,
      ),
      fence,
    ).toEqual({ ok: false, failure });
  }
});

test("rejects a block that does not end", () => {
  expect(
    parseServerBlocks(
      `# Guide\n\n\`\`\`sh\napt-get update\n`,
      guidePath,
      repository,
    ),
  ).toEqual({
    ok: false,
    failure:
      "docs/deploy.md must end each block, but the block from line 3 does not end.",
  });
});

test("rejects a guide without a block for the server, because the test would run nothing", () => {
  expect(
    parseServerBlocks(
      "# Guide\n\n```text\nssh root@203.0.113.10\n```\n",
      guidePath,
      repository,
    ),
  ).toEqual({
    ok: false,
    failure:
      "docs/deploy.md must have a block of commands marked sh, but it has none, so the test would run nothing.",
  });
});

test("rejects a guide whose blocks for the server lack an example that the test replaces, even when a block for the reader holds it", () => {
  expect(
    parseServerBlocks(
      "# Guide\n\n```text\nscp root@203.0.113.10:/var/backups/portolab/portolab-2026-11-10.sqlite .\n```\n\n```sh\ngit clone https://github.com/radenadam/portolab.git /opt/portolab\n```\n",
      guidePath,
      repository,
    ),
  ).toEqual({
    ok: false,
    failure:
      'docs/deploy.md must hold each example that the test replaces in a block marked sh, but no such block holds "portolab.example.com" or "2026-11-10".',
  });
});

test("rejects a guide that is not text", () => {
  expect(parseServerBlocks(undefined, guidePath, repository)).toEqual({
    ok: false,
    failure: "docs/deploy.md must be the text of the guide, but it is missing.",
  });
});

test("reads the name and the version of the system, quoted or not", () => {
  expect(
    parseSystemRelease(
      'PRETTY_NAME="Ubuntu 24.04.3 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nID=ubuntu\n',
      "/etc/os-release",
    ),
  ).toEqual({ ok: true, value: { name: "Ubuntu", version: "24.04" } });
  expect(
    parseSystemRelease("NAME=Ubuntu\nVERSION_ID=26.04\n", "/etc/os-release"),
  ).toEqual({ ok: true, value: { name: "Ubuntu", version: "26.04" } });
});

test("rejects a release without the name or the version of the system, naming each that it lacks", () => {
  expect(
    parseSystemRelease('PRETTY_NAME="Ubuntu"\n', "/etc/os-release"),
  ).toEqual({
    ok: false,
    failure:
      "/etc/os-release must name the system in NAME and its version in VERSION_ID, but it has no NAME and VERSION_ID.",
  });
  expect(parseSystemRelease('NAME="Ubuntu"\n', "/etc/os-release")).toEqual({
    ok: false,
    failure:
      "/etc/os-release must name the system in NAME and its version in VERSION_ID, but it has no VERSION_ID.",
  });
  expect(parseSystemRelease(7, "/etc/os-release")).toEqual({
    ok: false,
    failure:
      "/etc/os-release must be the text of an os-release file, but it is 7.",
  });
});

test("accepts a guide that names the system of the test machine and rejects one that does not", () => {
  const system = { name: "Ubuntu", version: "26.04" };
  expect(
    checkSystemNamed("Ubuntu 24.04 LTS or Ubuntu 26.04 LTS", system),
  ).toEqual({ ok: true, value: undefined });
  expect(checkSystemNamed("Ubuntu 24.04 LTS or 26.04 LTS", system)).toEqual({
    ok: false,
    failure:
      "docs/deploy.md must name Ubuntu 26.04, because the test follows it on that system, but it does not.",
  });
});

test("accepts a folder of backups that the user of the container can read none of, and checks each file at its path", () => {
  const checkedPaths: string[] = [];
  expect(
    checkBackupsOnlyForRoot(
      ["portolab-2026-11-10.sqlite", "portolab-2026-11-11.sqlite"],
      1000,
      (path) => {
        checkedPaths.push(path);
        return succeed(false);
      },
    ),
  ).toEqual([]);
  expect(checkedPaths).toEqual([
    "/var/backups/portolab/portolab-2026-11-10.sqlite",
    "/var/backups/portolab/portolab-2026-11-11.sqlite",
  ]);
});

test("fails for each file in the folder of the backups that the user of the container can read", () => {
  expect(
    checkBackupsOnlyForRoot(
      [
        "portolab-2026-11-10.sqlite",
        "portolab-2026-11-11.sqlite",
        "unfinished.sqlite",
      ],
      1000,
      (path) => succeed(!path.endsWith("portolab-2026-11-11.sqlite")),
    ),
  ).toEqual([
    "A process of the user number 1000 can read /var/backups/portolab/portolab-2026-11-10.sqlite, so an account of the server with that number reads the personal data in it.",
    "A process of the user number 1000 can read /var/backups/portolab/unfinished.sqlite, so an account of the server with that number reads the personal data in it.",
  ]);
});

test("fails for a folder of backups without a file, because the check would pass without checking anything", () => {
  expect(checkBackupsOnlyForRoot([], 1000, () => succeed(false))).toEqual([
    "/var/backups/portolab holds no file after the guide, so the test cannot check who reads a backup.",
  ]);
});

test("passes on why it could not tell whether the user of the container can read a file", () => {
  const failure =
    "test -r /var/backups/portolab/portolab-2026-11-11.sqlite ended with code 2. test: missing argument";
  expect(
    checkBackupsOnlyForRoot(["portolab-2026-11-11.sqlite"], 1000, () =>
      fail(failure),
    ),
  ).toEqual([failure]);
});

test("reads the number of a user or of a group as id prints it", () => {
  for (const [output, number] of [
    ["0\n", 0],
    ["1000\n", 1000],
    ["2147483647\n", 2_147_483_647],
  ] as const) {
    expect(parseIdOutput(output, "The output of id --user")).toEqual({
      ok: true,
      value: number,
    });
  }
});

test("rejects an output of id that is not one whole number on a line of its own, or that Node cannot run a process as", () => {
  for (const [output, description] of [
    ["", "empty"],
    ["1000", '"1000"'],
    ["1000\n1000\n", '"1000\\n1000\\n"'],
    ["01000\n", '"01000\\n"'],
    ["-1\n", '"-1\\n"'],
    ["node\n", '"node\\n"'],
    ["2147483648\n", '"2147483648\\n"'],
    [1000, "1000"],
  ] as const) {
    expect(parseIdOutput(output, "The output of id --user")).toEqual({
      ok: false,
      failure: `The output of id --user must be a whole number from 0 to 2147483647 on a line of its own, but it is ${description}.`,
    });
  }
});
