import { basename } from "node:path";
import { AST_NODE_TYPES } from "@typescript-eslint/types";
import type { TSESTree } from "@typescript-eslint/types";
import type { RuleDefinition } from "@eslint/core";

// React Router reads these names from a route module, so they name a role that every route shares instead of the module.
const routeModuleExports = new Set([
  "action",
  "clientAction",
  "clientLoader",
  "clientMiddleware",
  "ErrorBoundary",
  "handle",
  "headers",
  "HydrateFallback",
  "Layout",
  "links",
  "loader",
  "meta",
  "middleware",
  "shouldRevalidate",
]);

/** Checks the standard in the section Structure of AGENTS.md that a file with one main export is named after it. The parser of typescript-eslint gives each listener a node of TypeScript, so each listener names the type of its node. */
export const fileNamedAfterExport: RuleDefinition = {
  meta: {
    type: "suggestion",
    messages: {
      fileName:
        "The one export of this module is {{name}}, so its file name must start with {{expected}}, but it starts with {{actual}}. The section Structure of AGENTS.md states this standard.",
    },
    schema: [],
  },
  create(context) {
    // Each value that the module exports, with undefined for one that has no name, such as the object of a config file.
    const exportedNames: (string | undefined)[] = [];
    let exportsUnknownNames = false;
    return {
      "Program > ExportNamedDeclaration"(
        node: TSESTree.ExportNamedDeclaration,
      ) {
        // The parser gives a declared value, such as export declare function, the export kind of a type, so a declaration is judged by its node instead.
        if (node.declaration !== null) {
          exportedNames.push(...declaredNames(node.declaration));
          return;
        }
        if (node.exportKind === "type") {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.exportKind !== "type") {
            exportedNames.push(namedExport(specifier.exported));
          }
        }
      },
      "Program > ExportDefaultDeclaration"(
        node: TSESTree.ExportDefaultDeclaration,
      ) {
        const { declaration } = node;
        if (declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
          return;
        }
        const isNamedDeclaration =
          declaration.type === AST_NODE_TYPES.ClassDeclaration ||
          declaration.type === AST_NODE_TYPES.FunctionDeclaration ||
          declaration.type === AST_NODE_TYPES.TSDeclareFunction;
        exportedNames.push(
          isNamedDeclaration ? declaration.id?.name : undefined,
        );
      },
      "Program > ExportAllDeclaration"(node: TSESTree.ExportAllDeclaration) {
        if (node.exportKind === "type") {
          return;
        }
        if (node.exported === null) {
          exportsUnknownNames = true;
          return;
        }
        exportedNames.push(namedExport(node.exported));
      },
      "Program > TSExportAssignment"() {
        exportsUnknownNames = true;
      },
      "Program:exit"() {
        const mainExports = exportedNames.filter(
          (name) => name === undefined || !routeModuleExports.has(name),
        );
        const [name] = mainExports;
        if (
          exportsUnknownNames ||
          mainExports.length !== 1 ||
          name === undefined
        ) {
          return;
        }
        const expected = kebabCase(name);
        const actual = basename(context.filename).split(".")[0] ?? "";
        if (actual !== expected) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "fileName",
            data: { name, expected, actual },
          });
        }
      },
    };
  },
};

// A declaration can export several names, such as a variable that destructures an object, and an interface or a type alias exports none.
function declaredNames(
  declaration: TSESTree.NamedExportDeclarations,
): string[] {
  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    const names: string[] = [];
    for (const declarator of declaration.declarations) {
      names.push(...patternNames(declarator.id));
    }
    return names;
  }
  if (
    declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
    declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration
  ) {
    return [];
  }
  // Every other declaration names one value, apart from a module whose name is a string or a path, such as declare module "x".
  return declaration.id?.type === AST_NODE_TYPES.Identifier
    ? [declaration.id.name]
    : [];
}

function patternNames(pattern: TSESTree.Node): string[] {
  if (pattern.type === AST_NODE_TYPES.Identifier) {
    return [pattern.name];
  }
  if (pattern.type === AST_NODE_TYPES.RestElement) {
    return patternNames(pattern.argument);
  }
  if (pattern.type === AST_NODE_TYPES.AssignmentPattern) {
    return patternNames(pattern.left);
  }
  const names: string[] = [];
  if (pattern.type === AST_NODE_TYPES.ObjectPattern) {
    for (const property of pattern.properties) {
      names.push(
        ...patternNames(
          property.type === AST_NODE_TYPES.Property ? property.value : property,
        ),
      );
    }
  }
  if (pattern.type === AST_NODE_TYPES.ArrayPattern) {
    for (const element of pattern.elements) {
      if (element !== null) {
        names.push(...patternNames(element));
      }
    }
  }
  return names;
}

// An export named default has no name of its own, like an anonymous default export.
function namedExport(
  exported: TSESTree.Identifier | TSESTree.StringLiteral,
): string | undefined {
  const name =
    exported.type === AST_NODE_TYPES.Identifier
      ? exported.name
      : exported.value;
  return name === "default" ? undefined : name;
}

/** Turns a name such as quoteChange or PricesView into the file name quote-change or prices-view. */
function kebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}
