import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { ContentBlock } from "./content";

export function ContentParagraphs({
  blocks,
  reference,
}: {
  blocks: readonly ContentBlock[];
  reference?: (
    block: Exclude<ContentBlock, { kind: "paragraph" }>,
  ) => ReactNode;
}): ReactNode {
  return blocks.map((block) => {
    switch (block.kind) {
      case "paragraph":
        return (
          <p key={block.text}>
            <NumberText>{block.text}</NumberText>
          </p>
        );
      case "formula":
      case "table":
        return reference === undefined ? null : (
          <div key={`${block.kind}-${block.id}`}>{reference(block)}</div>
        );
    }
  });
}
