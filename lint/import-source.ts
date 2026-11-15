import {
  findVariable,
  getStringIfConstant,
} from "@eslint-community/eslint-utils";
import type { Rule, Scope } from "eslint";

export type ImportSyntaxNode = Parameters<
  Rule.RuleContext["sourceCode"]["getScope"]
>[0];

/** Await and then can read the same imported promise through a local binding. */
export function importSource(
  node: ImportSyntaxNode,
  context: Rule.RuleContext,
  seen = new Set<Scope.Variable>(),
): string | undefined {
  if (node.type === "ImportExpression") {
    const source = getStringIfConstant(
      node.source,
      context.sourceCode.getScope(node),
    );
    return typeof source === "string" ? source : undefined;
  }
  if (node.type === "AwaitExpression")
    return importSource(node.argument, context, seen);
  if (node.type === "ConditionalExpression")
    return (
      importSource(node.consequent, context, seen) ??
      importSource(node.alternate, context, seen)
    );
  if (node.type === "LogicalExpression")
    return (
      importSource(node.left, context, seen) ??
      importSource(node.right, context, seen)
    );
  if (node.type !== "Identifier") return undefined;
  const variable = findVariable(context.sourceCode.getScope(node), node);
  if (variable === null || seen.has(variable)) return undefined;
  seen.add(variable);
  return sourceOfBinding(variable, context, seen);
}

function sourceOfBinding(
  variable: Scope.Variable,
  context: Rule.RuleContext,
  seen: Set<Scope.Variable>,
): string | undefined {
  for (const definition of variable.defs) {
    if (
      definition.type === "Variable" &&
      definition.node.init !== null &&
      definition.node.init !== undefined
    ) {
      const source = importSource(definition.node.init, context, seen);
      if (source !== undefined) return source;
    }
  }
  for (const reference of variable.references) {
    if (reference.writeExpr !== undefined && reference.writeExpr !== null) {
      const source = importSource(reference.writeExpr, context, seen);
      if (source !== undefined) return source;
    }
  }
  return undefined;
}
