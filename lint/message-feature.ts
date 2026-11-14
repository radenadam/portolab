import { AST_NODE_TYPES } from "@typescript-eslint/types";
import type { TSESTree } from "@typescript-eslint/types";
import type { RuleDefinition } from "@eslint/core";

// Issue #189 tracks the existing account label that the class form uses until a separate change gives shared messages their app prefix.
const existingUses = new Set([
  "classes/join-class-page.tsx:accounts_username_label",
]);

/** The parser gives message uses as member expressions, so the check follows the imported message name even when a module aliases it. */
export const messageFeature: RuleDefinition = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      prefix:
        'The message "{{key}}" is used by {{feature}}, so its key must start with "{{prefix}}_", or with "app_" when the whole app shares it. AGENTS.md "Interface text" states this standard.',
    },
  },
  create(context) {
    const path = /\/app\/features\/([^/]+\/.*)$/u.exec(
      context.filename.replaceAll("\\", "/"),
    )?.[1];
    if (path === undefined) return {};
    const feature = path.slice(0, path.indexOf("/"));
    const prefix = feature.replaceAll("-", "_");
    const imports = new Set<string>();
    return {
      Program(node: TSESTree.Program) {
        for (const name of messageImports(node)) imports.add(name);
      },
      MemberExpression(node: TSESTree.MemberExpression) {
        if (
          node.object.type !== AST_NODE_TYPES.Identifier ||
          !imports.has(node.object.name)
        )
          return;
        const key =
          node.property.type === AST_NODE_TYPES.Identifier && !node.computed
            ? node.property.name
            : node.property.type === AST_NODE_TYPES.Literal &&
                typeof node.property.value === "string"
              ? node.property.value
              : undefined;
        if (
          key === undefined ||
          key.startsWith(`${prefix}_`) ||
          key.startsWith("app_") ||
          existingUses.has(`${path}:${key}`)
        )
          return;
        context.report({
          node,
          messageId: "prefix",
          data: { key, feature, prefix },
        });
      },
    };
  },
};

function messageImports(program: TSESTree.Program): string[] {
  const names: string[] = [];
  for (const node of program.body) {
    if (
      node.type !== AST_NODE_TYPES.ImportDeclaration ||
      !node.source.value.endsWith("/paraglide/messages.js")
    )
      continue;
    for (const specifier of node.specifiers) {
      if (
        specifier.type === AST_NODE_TYPES.ImportSpecifier &&
        specifier.imported.type === AST_NODE_TYPES.Identifier &&
        specifier.imported.name === "m"
      )
        names.push(specifier.local.name);
    }
  }
  return names;
}
