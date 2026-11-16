import {
  READ,
  ReferenceTracker,
  getPropertyName,
} from "@eslint-community/eslint-utils";
import type { Rule } from "eslint";

// A collator and a segmenter write no text of their own, so the modules that sort or split a text keep them.
const formatsWithoutText = new Set(["Collator", "Segmenter"]);

// Number, Date, and Array format their values with Intl through these methods, so they write the data of the engine too.
const localeMethods = new Set([
  "toLocaleString",
  "toLocaleDateString",
  "toLocaleTimeString",
]);

/** A module can reach a format of Intl through an alias, a destructured name, or the global object, so the rule follows every read of Intl rather than one spelling of a format. */
export const intlFormats: Rule.RuleModule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      format:
        "Format a number, a date, a time, or a list with the formats of app/intl-formats.ts, which write the same text on the server and in every browser, as the section Interface text of AGENTS.md states.",
    },
  },
  create(context) {
    function reportLocaleMethod(
      node: Extract<Rule.Node, { type: "MemberExpression" | "Property" }>,
    ): void {
      const name = getPropertyName(node, context.sourceCode.getScope(node));
      if (typeof name === "string" && localeMethods.has(name))
        context.report({ node, messageId: "format" });
    }
    return {
      MemberExpression: reportLocaleMethod,
      Property(node) {
        if (node.parent.type === "ObjectPattern") reportLocaleMethod(node);
      },
      "Program:exit"(node) {
        const tracker = new ReferenceTracker(context.sourceCode.getScope(node));
        for (const reference of tracker.iterateGlobalReferences({
          Intl: { [READ]: true },
        })) {
          if (!isTypeOrFormatWithoutText(reference.node, context))
            context.report({ node: reference.node, messageId: "format" });
        }
      },
    };
  },
};

function isTypeOrFormatWithoutText(
  node: Rule.Node,
  context: Rule.RuleContext,
): boolean {
  const parent: Rule.Node | null = node.parent;
  if (parent === null) return false;
  // A type of Intl, such as Intl.NumberFormatOptions, formats nothing.
  if ((parent.type as string) === "TSQualifiedName") return true;
  if (parent.type !== "MemberExpression" || parent.object !== node)
    return false;
  const name = getPropertyName(parent, context.sourceCode.getScope(parent));
  return typeof name === "string" && formatsWithoutText.has(name);
}
