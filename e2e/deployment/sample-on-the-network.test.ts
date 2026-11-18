import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import type { Role } from "../../app/features/accounts/accounts.schema.ts";
import { localNetworkAddresses } from "../../app/local-network.server.ts";
import { locales } from "../../app/paraglide/runtime.js";
import type { Locale } from "../../app/paraglide/runtime.js";
import { successValueForTest } from "../../app/success-value-for-test.ts";
import { minuteMilliseconds } from "../../app/time-units.ts";
import {
  guidePath,
  parseServerBlocks,
  serverFolder,
  splitAtSample,
  sampleTestDomain,
  testDomain,
} from "../../scripts/deployment-guide.ts";
import { parseSampleCredentialsForTest } from "../../scripts/parse-sample-credentials-for-test.ts";
import { joinAsNewStudent, submitSignIn } from "../accounts.ts";
import { openJoinDetails } from "../class-controls.ts";
import { newDevice } from "../new-device.ts";
import { languageNames } from "../../app/language-names.ts";
import { expectAccessibleScreen } from "../expect-accessible-screen.ts";
import { companyLogoForTest } from "../../app/features/market-data/company-logo-for-test.ts";
import { companyLogoPath } from "../../app/features/market-data/company-logo-paths.ts";

// The optional guide shares one service and site file, so each device finishes its whole lifecycle before another starts.
test.describe.configure({ mode: "serial" });

let folder: string;
let composeFiles: { withLogos: string; withoutLogos: string };
let output: string;
let liveBefore: string;
let companyLogosPath: string;
let preparedTile: string;

const sampleBlocks = successValueForTest(
  splitAtSample(
    successValueForTest(
      parseServerBlocks(
        readFileSync(guidePath, "utf8"),
        guidePath,
        "/tmp/unused.git",
      ),
      "The deployment guide has server commands",
    ),
  ),
  "The deployment guide has sample commands",
).after;

// Stored recordings and a fixed clock let the production seeder run after the fixture's semester, with the same fixture source as the live deployment test.
const seedWithRecordings = `node --input-type=module --eval 'import { openDatabase, closeDatabase } from "./app/database/database.server.ts"; import { saveSampleHistoryForTest, sampleMomentForTest } from "./app/features/sample-class/sample-prices-for-test.server.ts"; import { parseDatabasePath } from "./server/server-options.ts"; import { sampleClass } from "./server/sample-class.ts"; const path = parseDatabasePath(process.env.DATABASE_PATH, "DATABASE_PATH"); if (!path.ok) throw new Error(path.failure); const database = openDatabase(path.value, "./migrations"); try { saveSampleHistoryForTest(database); } finally { closeDatabase(database); } await sampleClass(process.env, () => sampleMomentForTest);'`;

function runSection(
  section: string,
  composeFile = composeFiles.withLogos,
): string {
  const block = sampleBlocks.find((candidate) => candidate.section === section);
  if (block === undefined)
    throw new Error(`The guide has no commands in "${section}".`);
  return execFileSync(
    "sudo",
    [
      "env",
      `COMPOSE_FILE=${composeFile}`,
      `COMPANY_LOGOS_PATH=${companyLogosPath}`,
      "bash",
      "-euo",
      "pipefail",
      "-c",
      block.commands
        .replaceAll("node server/sample-class.ts", seedWithRecordings)
        .replaceAll("/root/logo-input/BBCA.png", preparedTile)
        .replaceAll("/var/lib/portolab/company-logos", companyLogosPath)
        .replaceAll("compose.yaml:compose.logos.yaml", composeFile),
    ],
    {
      encoding: "utf8",
      timeout: minuteMilliseconds,
    },
  );
}

function docker(...arguments_: string[]): string {
  return execFileSync("sudo", ["docker", ...arguments_], {
    encoding: "utf8",
    timeout: minuteMilliseconds,
  }).trim();
}

function liveRecords(): string {
  return docker(
    "compose",
    "--project-directory",
    serverFolder,
    "exec",
    "--no-TTY",
    "app",
    "sqlite3",
    "/app/data/portolab.sqlite",
    "SELECT count(*) FROM users; SELECT count(*) FROM classes; SELECT count(*) FROM sample_class_marker;",
  );
}

test.beforeAll(() => {
  folder = mkdtempSync(join(tmpdir(), "portolab-sample-deployment-"));
  const prices = join(folder, "prices.yaml");
  // Public generated tiles must be reachable by the container's separate user.
  chmodSync(folder, 0o755);
  companyLogosPath = join(folder, "generated-tiles");
  preparedTile = join(folder, "prepared.png");
  writeFileSync(preparedTile, companyLogoForTest("square"), { mode: 0o644 });
  writeFileSync(
    prices,
    "services:\n  app: &prices\n    environment:\n      PRICE_SOURCE: fixture\n  sample:\n    <<: *prices\n",
  );
  composeFiles = {
    withLogos: `${serverFolder}/compose.yaml:${serverFolder}/compose.logos.yaml:${prices}`,
    withoutLogos: `${serverFolder}/compose.yaml:${prices}`,
  };
  liveBefore = liveRecords();
  runSection("Prepare company logo files");
  runSection("Start the sample");
  runSection("Start with company logos");
  // A later command of the guide, such as an update in a new shell, sets neither variable, so Compose must read the override and the folder from .env.
  expect(
    execFileSync("sudo", ["docker", "compose", "config", "app"], {
      cwd: serverFolder,
      encoding: "utf8",
      timeout: minuteMilliseconds,
    }),
  ).toContain(`source: ${companyLogosPath}`);
  output = runSection("Fill the sample");
});

test.afterAll(() => {
  try {
    const resetOutput = runSection("Reset the sample");
    const original = successValueForTest(
      parseSampleCredentialsForTest(output, "The fill output"),
      "The fill prints credentials",
    );
    const reset = successValueForTest(
      parseSampleCredentialsForTest(resetOutput, "The reset output"),
      "The reset prints credentials",
    );
    expect(reset.lecturer.password).not.toBe(original.lecturer.password);
    expect(
      docker(
        "compose",
        "--project-directory",
        serverFolder,
        "exec",
        "--no-TTY",
        "sample",
        "sqlite3",
        "/app/data/sample.sqlite",
        "SELECT count(*) FROM users; SELECT count(*) FROM sample_class_marker;",
      ),
    ).toBe("31\n1");
  } finally {
    try {
      runSection("Stop company logos", composeFiles.withoutLogos);
    } finally {
      try {
        runSection("Remove the sample", composeFiles.withoutLogos);
        expect(
          docker(
            "volume",
            "ls",
            "--quiet",
            "--filter",
            "name=portolab_sample-data",
          ),
        ).toBe("");
        expect(liveRecords()).toBe(liveBefore);
        expect(
          docker(
            "compose",
            "--project-directory",
            serverFolder,
            "ps",
            "--status",
            "running",
            "--quiet",
            "app",
          ),
        ).not.toBe("");
      } finally {
        // The guide copies the tiles as root, so only root can remove them.
        execFileSync("sudo", ["rm", "--recursive", "--", folder], {
          timeout: minuteMilliseconds,
        });
      }
    }
  }
});

const texts: Record<
  Locale,
  { sample: string; students: string; portfolio: string }
> = {
  id: {
    sample: "Data contoh",
    students: "Mahasiswa",
    portfolio: "Nilai portofolio",
  },
  en: {
    sample: "sample class",
    students: "Students",
    portfolio: "Portfolio value",
  },
};

for (const locale of locales) {
  test(`opens the sample and its displayed join address over HTTP and HTTPS in ${languageNames[locale]}`, async ({
    browser,
    page,
  }) => {
    test.setTimeout(3 * minuteMilliseconds);
    const credentials = successValueForTest(
      parseSampleCredentialsForTest(output, "The sample command output"),
      "The sample command prints both roles",
    );
    const network = localNetworkAddresses(new URL("http://localhost"))[0];
    if (network === undefined)
      throw new Error(
        "The deployment runner has no non-loopback IPv4 address.",
      );
    const http = new URL(network.address);
    expect(isIP(http.hostname)).toBe(4);
    expect(http.hostname).not.toMatch(/^127\./);
    for (const site of [
      {
        section: "Serve the sample on the home network",
        address: http.origin,
        secure: false,
      },
      {
        section: "Serve the sample on the VPS",
        address: `https://${sampleTestDomain}`,
        secure: true,
      },
    ]) {
      runSection(site.section);
      await expectPreparedTile(page, site.address);
      for (const role of ["lecturer", "student"] as const) {
        await exploreSampleAs(browser, locale, {
          site,
          role,
          credentials: credentials[role],
        });
      }
      // The deployment workflow installs its local certificate authority in Chromium's trust store.
      const liveHealth = await page.goto(`https://${testDomain}/health`);
      expect(liveHealth?.ok()).toBe(true);
      await expectPreparedTile(page, `https://${testDomain}`);
    }
  });
}

// The request context of Playwright runs in Node, which does not trust the local certificate authority of Caddy, so the browser opens the tile.
async function expectPreparedTile(page: Page, origin: string): Promise<void> {
  const tile = await page.goto(`${origin}${companyLogoPath("BBCA")}`);
  expect(tile?.status()).toBe(200);
  expect(await tile?.body()).toEqual(companyLogoForTest("square"));
}

async function exploreSampleAs(
  browser: Browser,
  locale: Locale,
  {
    site,
    role,
    credentials,
  }: {
    site: { address: string; secure: boolean };
    role: Role;
    credentials: { username: string; password: string };
  },
): Promise<void> {
  const reader = await newDevice(browser, locale, { siteUrl: site.address });
  try {
    await reader.goto("/sign-in");
    await expect(
      reader.getByText(texts[locale].sample, { exact: true }),
    ).toBeVisible();
    const signInResponse = reader.waitForResponse(
      (response) => response.request().method() === "POST",
    );
    await submitSignIn(reader, credentials.username, credentials.password);
    await expect(reader).toHaveURL(`${site.address}/classes/1`);
    await expect(
      reader.getByText(texts[locale].sample, { exact: true }),
    ).toBeVisible();
    const sessionHeaders = (await (await signInResponse).headersArray()).filter(
      ({ name }) => name.toLowerCase() === "set-cookie",
    );
    // The last-class cookie is also HttpOnly, so the sign-in response identifies the session.
    const sessionCookies = (await reader.context().cookies()).filter(
      ({ name }) =>
        sessionHeaders.some(({ value }) => value.startsWith(`${name}=`)),
    );
    expect(sessionCookies).toEqual([
      expect.objectContaining({ secure: site.secure, httpOnly: true }),
    ]);
    expect(sessionCookies[0]?.name.startsWith("__Host-")).toBe(site.secure);
    if (role === "lecturer") {
      await expectLecturerCanShare(reader, browser, {
        locale,
        siteAddress: site.address,
      });
    } else {
      await expect(
        reader.getByRole("heading", {
          name: texts[locale].portfolio,
          exact: true,
        }),
      ).toBeVisible();
    }
    await reader.keyboard.press("Escape");
    await expectAccessibleScreen(reader);
  } finally {
    await reader.context().close();
  }
}

async function expectLecturerCanShare(
  reader: Page,
  browser: Browser,
  { locale, siteAddress }: { locale: Locale; siteAddress: string },
): Promise<void> {
  await reader.goto("/classes/1/students");
  await expect(
    reader.getByRole("heading", { name: texts[locale].students, exact: true }),
  ).toBeVisible();
  const ranks = await reader
    .locator("table")
    .first()
    .locator("tbody tr td:first-child")
    .allTextContents();
  expect(ranks.length).toBeGreaterThanOrEqual(30);
  expect(ranks.filter((rank) => rank.trim() !== "").length).toBeGreaterThan(
    ranks.length / 2,
  );
  await openJoinDetails(reader);
  const addresses = await reader
    .locator("[popover]:popover-open dd")
    .allTextContents();
  const joinAddress = addresses.find((address) =>
    address.startsWith(`${siteAddress}/join/`),
  );
  expect(joinAddress).toBeDefined();
  if (joinAddress === undefined)
    throw new Error("The sample page shows no join address at its own host.");
  const student = await newDevice(browser, locale, { siteUrl: siteAddress });
  try {
    await joinAsNewStudent(student, joinAddress, "Sample visitor");
    await expect(
      student.getByText(texts[locale].sample, { exact: true }),
    ).toBeVisible();
  } finally {
    await student.context().close();
  }
}
