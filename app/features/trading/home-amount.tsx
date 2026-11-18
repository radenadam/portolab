import type { ReactNode } from "react";
import { estimatedLabelWidth } from "~/charts/estimated-label-width";
import { formatRupiah, formatRupiahParts } from "~/formatting";
import { NumberText } from "~/number-text";
import type { Rupiah } from "~/units/rupiah";
import styles from "./home-amount.module.css";

/** The class cash limit must fit on a phone without separating the currency or digits. */
export function HomeAmount({
  amount,
  smallCurrency = false,
}: {
  amount: Rupiah;
  smallCurrency?: boolean;
}): ReactNode {
  return (
    <p
      className={styles["amount"]}
      data-small-currency={smallCurrency || undefined}
      style={{
        fontSize: `min(var(--text-home-amount, var(--text-headline)), calc(100cqi / ${String(estimatedLabelWidth(formatRupiah(amount)))}))`,
      }}
    >
      <NumberText whole>
        {formatRupiahParts(amount).map((part) =>
          part.type === "currency" ? (
            <small key={part.type}>{part.value}</small>
          ) : (
            part.value
          ),
        )}
      </NumberText>
    </p>
  );
}
