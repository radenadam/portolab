import type { TSESTree } from "@typescript-eslint/types";
import type { RuleDefinition } from "@eslint/core";

/** Locale tables keep translated expectations together, and language names make test reports readable. */
export const testLanguage: RuleDefinition = {
  meta: {
    type: "suggestion",
    messages: {
      localeTable:
        "Put language-dependent input and expected text in a table typed over Locale, as the section Tests of AGENTS.md states.",
      languageName:
        "Name the language in a test title with languageNames[locale].",
    },
    schema: [],
  },
  create(context) {
    return {
      'BinaryExpression:matches([left.name="locale"][right.type="Literal"], [right.name="locale"][left.type="Literal"])'(
        node: TSESTree.BinaryExpression,
      ) {
        context.report({ node, messageId: "localeTable" });
      },
      'CallExpression:matches([callee.name=/^(test|it)$/], [callee.object.name=/^(test|it)$/]) > TemplateLiteral.arguments:first-child > Identifier[name="locale"]'(
        node: TSESTree.Identifier,
      ) {
        context.report({ node, messageId: "languageName" });
      },
    };
  },
};
