import { posix } from "node:path";
import {
  ESM,
  READ,
  ReferenceTracker,
  getPropertyName,
} from "@eslint-community/eslint-utils";
import type { TraceMap } from "@eslint-community/eslint-utils";
import type { Rule } from "eslint";

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
    },
  },
  create(context) {
    const filename = context.filename.replaceAll("\\", "/");
    const path = /\/app\/features\/([^/]+\/.*)$/u.exec(filename)?.[1];
    if (path === undefined) return {};
    const feature = path.slice(0, path.indexOf("/"));
    const prefix = feature.replaceAll("-", "_");
    const keys = new Set<string>();
    const sources = new Set<string>();
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
        if (
          typeof node.source?.value === "string" &&
          isMessageModule(node.source.value, filename)
        )
          sources.add(node.source.value);
        for (const specifier of node.specifiers)
          keys.add(
            specifier.local.type === "Identifier"
              ? specifier.local.name
              : String(specifier.local.value),
          );
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
        const modules: TraceMap<string> = {};
        for (const source of sources)
          modules[source] = { ...messages, [ESM]: true, m: messages };
        const tracker = new ReferenceTracker(context.sourceCode.getScope(node));
        for (const reference of tracker.iterateEsmReferences(modules)) {
          const key = reference.info;
          if (
            key.startsWith(`${prefix}_`) ||
            key.startsWith("app_") ||
            existingUses.has(`${path}:${key}`)
          )
            continue;
          context.report({
            node: reference.node,
            messageId: "prefix",
            data: { key, feature, prefix },
          });
        }
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
