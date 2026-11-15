import { posix } from "node:path";
import {
  ESM,
  READ,
  ReferenceTracker,
  findVariable,
  getPropertyName,
} from "@eslint-community/eslint-utils";
import type {
  TraceMap,
  TrackedReferences,
} from "@eslint-community/eslint-utils";
import type { Rule } from "eslint";
import { importSource } from "./import-source.ts";
import type { ImportSyntaxNode } from "./import-source.ts";

// Issue #189 tracks the existing account label that the class form uses until a separate change gives shared messages their app prefix.
const existingUses = new Set([
  "classes/join-class-page.tsx:accounts_username_label",
]);

/** Generated messages have named exports and a namespace, so the check follows their bindings rather than one spelling of an import. */
export const messageFeature: Rule.RuleModule = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      prefix:
        'The message "{{key}}" is used by {{feature}}, so its key must start with "{{prefix}}_", or with "app_" when the whole app shares it. AGENTS.md "Interface text" states this standard.',
      namespace:
        'The message namespace includes keys of other features, so {{feature}} must re-export only named messages with its own prefix or "app_". AGENTS.md "Interface text" states this standard.',
    },
  },
  create(context) {
    const filename = context.filename.replaceAll("\\", "/");
    const path = /\/app\/features\/([^/]+\/.*)$/u.exec(filename)?.[1];
    if (path === undefined) return {};
    const featurePath = path;
    const feature = path.slice(0, path.indexOf("/"));
    const prefix = feature.replaceAll("-", "_");
    const keys = new Set<string>();
    const sources = new Set<string>();
    const awaited: Extract<Rule.Node, { type: "AwaitExpression" }>[] = [];
    const callbacks: ImportSyntaxNode[] = [];
    const reported = new Map<ImportSyntaxNode, Set<string>>();
    function checkKey(node: ImportSyntaxNode, key: string): void {
      if (
        key.startsWith(`${prefix}_`) ||
        key.startsWith("app_") ||
        existingUses.has(`${featurePath}:${key}`)
      )
        return;
      const found = reported.get(node) ?? new Set<string>();
      if (found.has(key)) return;
      found.add(key);
      reported.set(node, found);
      context.report({
        node,
        messageId: "prefix",
        data: { key, feature, prefix },
      });
    }
    function checkReferences(
      references: Iterable<TrackedReferences<string>>,
    ): void {
      for (const reference of references)
        checkKey(reference.node, reference.info);
    }
    return {
      ImportDeclaration(node) {
        if (
          typeof node.source.value === "string" &&
          isMessageModule(node.source.value, filename)
        )
          sources.add(node.source.value);
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier")
            keys.add(
              specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : String(specifier.imported.value),
            );
        }
      },
      ExportNamedDeclaration(node) {
        const source = node.source?.value;
        if (typeof source === "string" && isMessageModule(source, filename)) {
          sources.add(source);
          for (const specifier of node.specifiers) {
            const name =
              specifier.local.type === "Identifier"
                ? specifier.local.name
                : specifier.local.value;
            if (name === "m")
              context.report({
                node: specifier,
                messageId: "namespace",
                data: { feature },
              });
          }
        }
        for (const specifier of node.specifiers)
          keys.add(
            specifier.local.type === "Identifier"
              ? specifier.local.name
              : String(specifier.local.value),
          );
      },
      ExportAllDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string" || !isMessageModule(source, filename))
          return;
        // A compiled single-message module is named after its exported message.
        const name = posix.basename(source, ".js");
        if (name.startsWith(`${prefix}_`) || name.startsWith("app_")) return;
        context.report({ node, messageId: "namespace", data: { feature } });
      },
      AwaitExpression(node) {
        const source = importSource(node.argument, context);
        if (source !== undefined && isMessageModule(source, filename))
          awaited.push(node);
      },
      CallExpression(node) {
        if (
          node.callee.type !== "MemberExpression" ||
          getPropertyName(node.callee) !== "then"
        )
          return;
        const source = importSource(node.callee.object, context);
        if (source === undefined || !isMessageModule(source, filename)) return;
        const callback = node.arguments[0];
        if (
          callback?.type !== "ArrowFunctionExpression" &&
          callback?.type !== "FunctionExpression"
        )
          return;
        const parameter = callback.params[0];
        if (parameter !== undefined) callbacks.push(parameter);
      },
      MemberExpression(node) {
        const key = getPropertyName(node);
        if (typeof key === "string") keys.add(key);
      },
      Property(node) {
        const key = getPropertyName(node);
        if (typeof key === "string") keys.add(key);
      },
      "Program:exit"(node) {
        const messages: TraceMap<string> = {};
        for (const key of keys)
          if (key !== "m") messages[key] = { [READ]: key };
        const module: TraceMap<string> = {
          ...messages,
          [ESM]: true,
          m: messages,
        };
        const modules: TraceMap<string> = {};
        for (const source of sources) modules[source] = module;
        const tracker = new ReferenceTracker(context.sourceCode.getScope(node));
        checkReferences(tracker.iterateEsmReferences(modules));
        for (const expression of awaited)
          checkReferences(
            tracker.iteratePropertyReferences(expression, module),
          );
        function checkIdentifier(
          pattern: Extract<ImportSyntaxNode, { type: "Identifier" }>,
          trace: TraceMap<string>,
        ): void {
          const variable = findVariable(
            context.sourceCode.getScope(pattern),
            pattern,
          );
          if (variable === null) return;
          for (const reference of variable.references) {
            if (
              reference.isRead() &&
              reference.identifier.type === "Identifier"
            )
              checkReferences(
                tracker.iteratePropertyReferences(reference.identifier, trace),
              );
          }
        }
        function checkObjectPattern(
          pattern: Extract<ImportSyntaxNode, { type: "ObjectPattern" }>,
          trace: TraceMap<string>,
        ): void {
          const used = new Set<string>();
          for (const property of pattern.properties) {
            if (property.type === "RestElement") continue;
            const key = getPropertyName(
              property,
              context.sourceCode.getScope(property),
            );
            if (typeof key !== "string" || !Object.hasOwn(trace, key)) continue;
            used.add(key);
            const next = trace[key];
            if (next === undefined) continue;
            const name = next[READ];
            if (typeof name === "string") checkKey(property, name);
            else checkPattern(property.value, next);
          }
          const rest = Object.fromEntries(
            Object.entries(trace).filter(([key]) => !used.has(key)),
          );
          for (const property of pattern.properties)
            if (property.type === "RestElement")
              checkPattern(property.argument, rest);
        }
        function checkPattern(
          pattern: ImportSyntaxNode,
          trace: TraceMap<string>,
        ): void {
          if (pattern.type === "AssignmentPattern")
            checkPattern(pattern.left, trace);
          else if (pattern.type === "Identifier")
            checkIdentifier(pattern, trace);
          else if (pattern.type === "ObjectPattern")
            checkObjectPattern(pattern, trace);
        }
        for (const parameter of callbacks) checkPattern(parameter, module);
      },
    };
  },
};

function isMessageModule(source: string, filename: string): boolean {
  const path = source.startsWith("~/")
    ? posix.normalize(`/app/${source.slice(2)}`)
    : posix.resolve(posix.dirname(filename), source);
  return (
    path.endsWith("/app/paraglide/messages.js") ||
    path.includes("/app/paraglide/messages/")
  );
}
