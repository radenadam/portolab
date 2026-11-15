import type { Browser, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { uniqueUsername } from "./accounts.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { storeActivityOrders } from "./store-activity-orders.ts";
import {
  homeDesignStartingCash,
  storeHomeDesignPortfolio,
} from "./store-home-design-portfolio.ts";

export async function studentDesignClass(
  page: Page,
  browser: Browser,
  locale: Locale,
) {
  const place = await studentOfNewClass(page, browser, {
    locale,
    className: "Manajemen Portofolio A",
    lecturerName: "Dosen",
    studentName: "Raka Pratama",
    studentUsername: `raka${uniqueUsername("raka").slice(-8)}`,
    startingCash: homeDesignStartingCash,
  });
  storeHomeDesignPortfolio(place.classId);
  storeActivityOrders(place.classId);
  return place;
}
