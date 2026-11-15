import type { ReactNode } from "react";
import { NumberText } from "~/number-text";

/** Readers see quote failures in several views, so one renderer keeps their formatted numbers intact. */
export function QuoteNotice({
  text,
  className,
}: {
  text: string | undefined;
  className: string | undefined;
}): ReactNode {
  return text === undefined ? null : (
    <p className={className}>
      <NumberText>{text}</NumberText>
    </p>
  );
}
