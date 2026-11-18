import type { ReactNode } from "react";
import { NumberText } from "~/number-text";

export function TableHead({
  labels,
  help,
  className,
}: {
  labels: readonly string[];
  help?: Readonly<Record<string, ReactNode>>;
  className?: string | undefined;
}): ReactNode {
  return (
    <thead className={className}>
      <tr>
        {labels.map((label) => (
          <th key={label} scope="col">
            <NumberText>{label}</NumberText>
            {help?.[label]}
          </th>
        ))}
      </tr>
    </thead>
  );
}
