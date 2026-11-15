import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { ContentBlock } from "./content";

export function ContentParagraphs({
  blocks,
}: {
  blocks: readonly ContentBlock[];
}): ReactNode {
  return blocks.map((block) => {
    switch (block.kind) {
      case "paragraph":
        return (
          <p key={block.text}>
            <NumberText>{block.text}</NumberText>
          </p>
        );
      // Pieces 23 and 30 supply the data and render the typed references, as docs/learning-content.md assigns them.
      case "formula":
      case "table":
        return null;
    }
  });
}
