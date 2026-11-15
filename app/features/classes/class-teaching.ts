import type { UserId } from "~/features/accounts/accounts.schema";
import type { Beta } from "~/units/beta";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { Rupiah } from "~/units/rupiah";
import type { SessionNumber } from "./course-calendar";

export interface TeachingStudent {
  id: UserId;
  name: string;
  return: CumulativeReturn | undefined;
  risk:
    | { beta: Beta; standardDeviation: MonthlyReturn; alpha: MonthlyReturn }
    | undefined;
  holdingCount: number;
  cash: Rupiah;
  value: Rupiah | undefined;
  orderHistory: "none" | "unfilled" | "filled";
  ordersThisWeek: number;
  lastOrder: string;
}

export interface ClassFlag {
  key: "loss" | "volatile" | "no-stocks" | "inactive";
  tone: "loss" | "idle";
  group: boolean;
  name: string;
  text: string;
  href: string;
}

export interface ClassDiscussion {
  badge: string | undefined;
  notice: string | undefined;
  lesson: SessionNumber | undefined;
  questions: string[];
}
