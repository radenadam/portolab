import type { ReactNode } from "react";

export function TableHead({
  labels,
  help,
}: {
  labels: readonly string[];
  help?: Readonly<Record<string, ReactNode>>;
}): ReactNode {
  return (
    <thead>
      <tr>
        {labels.map((label) => (
          <th key={label} scope="col">
            {label}
            {help?.[label]}
          </th>
        ))}
      </tr>
    </thead>
  );
}
