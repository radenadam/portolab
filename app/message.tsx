import type { ReactNode } from "react";

interface MessagePart {
  marker: string;
  value: ReactNode;
}

/** Translations keep control of word order while a value keeps its own markup. */
export function Message<Key extends string>({
  text,
  values,
}: {
  text: (markers: Record<Key, string>) => string;
  values: Record<Key, ReactNode>;
}): ReactNode {
  const markers = {} as Record<Key, string>;
  const parts: MessagePart[] = [];
  for (const [key, value] of Object.entries<ReactNode>(values)) {
    const marker = `\u0001${String(parts.length)}\u0002`;
    markers[key as Key] = marker;
    parts.push({ marker, value });
  }
  return withParts(text(markers), parts);
}

function withParts(text: string, parts: readonly MessagePart[]): ReactNode {
  let next: { position: number; part: MessagePart } | undefined;
  for (const part of parts) {
    const position = text.indexOf(part.marker);
    if (position >= 0 && (next === undefined || position < next.position))
      next = { position, part };
  }
  if (next === undefined) return text;
  return (
    <>
      {text.slice(0, next.position)}
      {next.part.value}
      {withParts(text.slice(next.position + next.part.marker.length), parts)}
    </>
  );
}
