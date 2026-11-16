import en from "../../../messages/en.json";
import id from "../../../messages/id.json";
import { defaultStartingCash } from "../classes/class-rules.ts";
import { sessionCount } from "../classes/course-calendar.ts";
import { defaultEstimationSettings } from "../measures/estimation-settings.ts";
import { formatNumber, formatRupiah } from "../../formatting.ts";
import type { Locale } from "../../paraglide/runtime.js";
import { succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { parseGuideLabels } from "./parse-guide-labels.ts";

export const guideLinks = {
  privacy: "/privacy",
  classes: "/classes",
  join: "/join",
  account: "/account",
  deployment: "https://github.com/radenadam/portolab/blob/main/docs/deploy.md",
  "personal-data":
    "https://github.com/radenadam/portolab/blob/main/docs/deploy.md#personal-data",
  backups:
    "https://github.com/radenadam/portolab/blob/main/docs/deploy.md#8-back-up-the-database",
  "lecturer-account":
    "https://github.com/radenadam/portolab/blob/main/docs/deploy.md#7-create-the-first-lecturer-account",
};

export function guideReferences(
  locale: Locale,
): Result<Map<string, string>, string> {
  const labels = parseGuideLabels(
    { id, en }[locale],
    `messages/${locale}.json`,
  );
  if (!labels.ok) return labels;
  const references = labels.value;
  references.set(
    "value:starting-cash",
    formatRupiah(defaultStartingCash, "standard", locale),
  );
  references.set(
    "value:sessions",
    formatNumber(sessionCount, undefined, locale),
  );
  references.set(
    "value:minimum-returns",
    formatNumber(
      defaultEstimationSettings.minimumReturnCount,
      undefined,
      locale,
    ),
  );
  references.set(
    "value:return-window",
    formatNumber(defaultEstimationSettings.returnCount, undefined, locale),
  );
  return succeed(references);
}
