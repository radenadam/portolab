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
const testFactories = new Set(["each", "for", "skipIf", "runIf", "extend"]);

interface TestCalls {
  functions: Set<string>;
  namespaces: Set<string>;
}

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
      "BinaryExpression[operator=/^(===|!==|==|!=)$/]"(
        node: TSESTree.BinaryExpression,
      ) {
        if (
          (isLocaleExpression(node.left) && isStaticValue(node.right)) ||
          (isLocaleExpression(node.right) && isStaticValue(node.left))
        )
          context.report({ node, messageId: "localeTable" });
      },
      SwitchStatement(node: TSESTree.SwitchStatement) {
        if (
          isLocaleExpression(node.discriminant) &&
          node.cases.some((branch) => branch.test !== null)
        )
          context.report({ node, messageId: "localeTable" });
      },
      'Identifier[name="locale"]'(node: TSESTree.Identifier) {
        if (!isPropertyKey(node) && insideTestTitle(node, calls))
          context.report({ node, messageId: "languageName" });
      },
      MemberExpression(node: TSESTree.MemberExpression) {
        if (
          propertyName(node) === "locale" &&
          !isPropertyKey(node) &&
          insideTestTitle(node, calls)
        )
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

function insideTestTitle(node: TSESTree.Node, calls: TestCalls): boolean {
  let ancestor: TSESTree.Node = node;
  while (ancestor.type !== AST_NODE_TYPES.Program) {
    const parent: TSESTree.Node = ancestor.parent;
    if (
      parent.type === AST_NODE_TYPES.CallExpression &&
      parent.arguments[0] === ancestor &&
      canBeTitle(ancestor) &&
      isTestCallee(parent.callee, calls) &&
      !isTestFactory(parent.callee)
    )
      return true;
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
  const name = propertyName(node);
  if (objectName !== undefined && calls.namespaces.has(objectName)) {
    return name !== undefined && testFunctions.has(name);
  }
  if (name === undefined || !testModifiers.has(name)) return false;
  return isTestCallee(object, calls);
}

function memberName(node: TSESTree.Node): string | undefined {
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
  )
    return node.quasis.map((part) => part.value.cooked).join("");
  const name =
    "name" in node ? node.name : "value" in node ? node.value : undefined;
  return typeof name === "string" ? name : undefined;
}

function propertyName(
  node: TSESTree.MemberExpression | TSESTree.JSXMemberExpression,
): string | undefined {
  if (
    "computed" in node &&
    node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier
  )
    return undefined;
  return memberName(node.property);
}

function isLocaleExpression(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.Identifier) return node.name === "locale";
  if (node.type === AST_NODE_TYPES.MemberExpression)
    return propertyName(node) === "locale";
  if ("expression" in node && typeof node.expression === "object")
    return isLocaleExpression(node.expression);
  return false;
}

function isStaticValue(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.Literal ||
    (node.type === AST_NODE_TYPES.TemplateLiteral &&
      node.expressions.length === 0)
  );
}

function isPropertyKey(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.Program) return false;
  const parent = node.parent;
  if ("expression" in parent && parent.expression === node)
    return isPropertyKey(parent);
  return (
    parent.type === AST_NODE_TYPES.MemberExpression && parent.property === node
  );
}

function canBeTitle(node: TSESTree.Node): boolean {
  return (
    node.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
    node.type !== AST_NODE_TYPES.FunctionExpression
  );
}

function isTestFactory(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    const name = propertyName(node);
    return name !== undefined && testFactories.has(name);
  }
  if ("expression" in node && typeof node.expression === "object")
    return isTestFactory(node.expression);
  return false;
}
