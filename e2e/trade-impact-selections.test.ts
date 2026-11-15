import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { fieldMaximumLength } from "../app/form-size.ts";
import { impactSelectionTextForTest } from "../app/features/trading/impact-selection-text-for-test.ts";
import { tradeImpactStudent } from "./trade-impact-student.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";

for (const javaScriptEnabled of [true, false]) {
  test.describe(
    javaScriptEnabled
      ? "enhanced impact selections"
      : "native impact selections",
    () => {
      test.use({ javaScriptEnabled });
      for (const locale of locales) {
        const text = impactSelectionTextForTest[locale];
        for (const destination of ["stock", "ticket"] as const) {
          test(`corrects invalid ${destination} impact choices and their widest values in ${languageNames[locale]}`, async ({
            page,
            browser,
          }) => {
            const { student, classPath } = await tradeImpactStudent(
              page,
              browser,
              { locale, kind: "diversified" },
            );
            const path = `${classPath}/stocks/BBCA${destination === "ticket" ? "/buy" : ""}`;
            const cases = [
              {
                share: "0.3",
                axis: " BETA ",
                shareFailure: text.shareFailure,
                axisFailure: text.axisFailure,
                scan: javaScriptEnabled,
              },
            ];
            for (const character of ["W", "8"]) {
              const value = character.repeat(fieldMaximumLength);
              cases.push({
                share: value,
                axis: "beta",
                shareFailure: text.longShare,
                axisFailure: "",
                scan: false,
              });
              cases.push({
                share: "0.1",
                axis: value,
                shareFailure: "",
                axisFailure: text.longAxis,
                scan: false,
              });
            }
            for (const input of cases) {
              const query = new URLSearchParams({
                lots: "10",
                range: "3m",
                impact: input.share,
                impactAxis: input.axis,
              });
              const response = await student.goto(
                `${path}?${query.toString()}`,
              );
              expect(response?.status()).toBe(400);
              const share = student.getByRole("combobox", {
                name: text.share,
                exact: true,
              });
              const axis = student.getByRole("textbox", {
                name: text.axis,
                exact: true,
              });
              await expect(share).toHaveValue(input.share);
              await expect(axis).toHaveValue(input.axis);
              await expect(share).toHaveAccessibleDescription(
                input.shareFailure,
              );
              await expect(axis).toHaveAccessibleDescription(input.axisFailure);
              expect(await layoutProblems(student)).toEqual([]);
              if (input.scan) await expectAccessibleScreen(student);
              await share.selectOption("0.1");
              await axis.fill("risk");
              await student.locator('main form button[type="submit"]').click();
              await expectCorrectedImpact(
                student,
                path,
                destination === "ticket",
              );
            }
            await student.context().close();
          });
        }
      }
    },
  );
}

async function expectCorrectedImpact(
  student: Page,
  path: string,
  ticket: boolean,
) {
  await expect(student.locator("[data-impact-rows]").first()).toBeVisible();
  const corrected = new URL(student.url());
  expect(corrected.pathname).toBe(path);
  for (const [name, expected] of [
    ["impact", "0.1"],
    ["impactAxis", "risk"],
    ["lots", "10"],
    ["range", "3m"],
  ] as const)
    expect(corrected.searchParams.get(name)).toBe(expected);
  await expect(
    student.locator("svg").getByText("SML", { exact: true }),
  ).toHaveCount(0);
  if (ticket)
    await expect(student.locator('dialog input[name="lots"]')).toHaveValue(
      "10",
    );
}
