import { AST_NODE_TYPES } from "@typescript-eslint/types";
import type { TSESTree } from "@typescript-eslint/types";
import type { RuleDefinition } from "@eslint/core";

const testFunctions = new Set(["test", "it", "describe"]);
const testPackages = new Set(["vitest", "@playwright/test"]);
const testModifiers = new Set([
  "skip",
  "only",
  "todo",
  "fails",
  "concurrent",
  "sequential",
  "describe",
  "serial",
  "parallel",
  "fixme",
  "runIf",
  "skipIf",
  "each",
  "for",
  "extend",
  "step",
]);

interface TestCalls {
  functions: Set<string>;
  namespaces: Set<string>;
}

const localeComparison =
  'BinaryExpression[operator=/^(===|!==|==|!=)$/]:matches([left.name="locale"][right.type="Literal"], [right.name="locale"][left.type="Literal"], [left.name="locale"][right.type="TemplateLiteral"][right.expressions.length=0], [right.name="locale"][left.type="TemplateLiteral"][left.expressions.length=0])';

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
    const calls: TestCalls = {
      functions: new Set(testFunctions),
      namespaces: new Set(),
    };
    return {
      Program(node: TSESTree.Program) {
        for (const statement of node.body) {
          if (statement.type === AST_NODE_TYPES.ImportDeclaration)
            registerTestImport(statement, calls);
        }
      },
      [localeComparison](node: TSESTree.BinaryExpression) {
        context.report({ node, messageId: "localeTable" });
      },
      'SwitchStatement[discriminant.name="locale"]'(
        node: TSESTree.SwitchStatement,
      ) {
        if (node.cases.some((branch) => branch.test !== null))
          context.report({ node, messageId: "localeTable" });
      },
      'Identifier[name="locale"]'(node: TSESTree.Identifier) {
        const parent = node.parent;
        if (
          parent.type === AST_NODE_TYPES.MemberExpression &&
          parent.property === node
        ) {
          if (
            !parent.computed ||
            (parent.object.type === AST_NODE_TYPES.Identifier &&
              parent.object.name === "languageNames")
          )
            return;
        }
        if (insideTestTitle(node, calls))
          context.report({ node, messageId: "languageName" });
      },
    };
  },
};

function registerTestImport(
  node: TSESTree.ImportDeclaration,
  calls: TestCalls,
): void {
  if (!testPackages.has(node.source.value) || node.importKind === "type")
    return;
  for (const specifier of node.specifiers) {
    switch (specifier.type) {
      case AST_NODE_TYPES.ImportDefaultSpecifier:
        calls.functions.add(specifier.local.name);
        break;
      case AST_NODE_TYPES.ImportNamespaceSpecifier:
        calls.namespaces.add(specifier.local.name);
        break;
      case AST_NODE_TYPES.ImportSpecifier: {
        const name =
          "name" in specifier.imported
            ? specifier.imported.name
            : specifier.imported.value;
        if (specifier.importKind !== "type" && testFunctions.has(name))
          calls.functions.add(specifier.local.name);
        break;
      }
    }
  }
}

function insideTestTitle(node: TSESTree.Identifier, calls: TestCalls): boolean {
  let ancestor: TSESTree.Node = node.parent;
  while (ancestor.type !== AST_NODE_TYPES.Program) {
    if (ancestor.type === AST_NODE_TYPES.TemplateLiteral) {
      const parent: TSESTree.Node = ancestor.parent;
      if (
        parent.type === AST_NODE_TYPES.CallExpression &&
        parent.arguments[0] === ancestor &&
        isTestCallee(parent.callee, calls)
      )
        return true;
    }
    ancestor = ancestor.parent;
  }
  return false;
}

function isTestCallee(node: TSESTree.Node, calls: TestCalls): boolean {
  if ("object" in node && "property" in node) return isTestMember(node, calls);
  if ("callee" in node) return isTestCallee(node.callee, calls);
  if ("tag" in node) return isTestCallee(node.tag, calls);
  if ("expression" in node && typeof node.expression === "object")
    return isTestCallee(node.expression, calls);
  return (
    "name" in node &&
    typeof node.name === "string" &&
    calls.functions.has(node.name)
  );
}

function isTestMember(
  node: TSESTree.MemberExpression | TSESTree.JSXMemberExpression,
  calls: TestCalls,
): boolean {
  const object = node.object;
  const objectName = memberName(object);
  const name = memberName(node.property);
  if (objectName !== undefined && calls.namespaces.has(objectName)) {
    return name !== undefined && testFunctions.has(name);
  }
  if (name === undefined || !testModifiers.has(name)) return false;
  return isTestCallee(object, calls);
}

function memberName(node: TSESTree.Node): string | undefined {
  const name =
    "name" in node ? node.name : "value" in node ? node.value : undefined;
  return typeof name === "string" ? name : undefined;
}
