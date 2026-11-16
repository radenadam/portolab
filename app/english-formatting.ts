import {
  formatCalendarDate,
  formatNumber,
  formatRupiah,
} from "./formatting.ts";
import type { Rupiah } from "./units/rupiah.ts";

// The command writes English outside a request, so its numbers cannot inherit the app's base language.
export const englishFormatting = {
  rupiah: (value: Rupiah): string => formatRupiah(value, "standard", "en"),
  number: (value: number): string => formatNumber(value, undefined, "en"),
  date: (value: string): string => formatCalendarDate(value, "long", "en"),
};
