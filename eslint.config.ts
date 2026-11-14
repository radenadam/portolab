import { readdirSync } from "node:fs";
import { join } from "node:path";
import eslintJs from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import typescriptEslint from "typescript-eslint";
import { fileNamedAfterExport } from "./lint/file-named-after-export.ts";
import { testLanguageConfig } from "./lint/test-language-config.ts";

// Abbreviations that read as noise. Names use full words instead.
const abbreviations = [
  "acc",
  "amt",
  "arr",
  "btn",
  "cb",
  "cfg",
  "cnt",
  "conf",
  "ctx",
  "curr",
  "desc",
  "e",
  "el",
  "elem",
  "err",
  "evt",
  "fn",
  "idx",
  "msg",
  "num",
  "obj",
  "pct",
  "prev",
  "px",
  "qty",
  "req",
  "res",
  "str",
  "tmp",
  "val",
];

// ESLint has no rule that checks a signature by the name of a function, so these selectors check the parser standard in the section Code of AGENTS.md.
const parserSignature =
  "A function named parse... takes (value: unknown, source: string) as its first parameters and returns Result<T, string>, as the section Code of AGENTS.md states.";
const parserName = "/^parse[A-Z]/";
// A name can be an identifier, a quoted string, or a computed key, and these are the attributes that hold it in each node that can carry a name.
const nameAttributes = [
  "id.name",
  "key.name",
  "key.value",
  "key.quasis.0.value.cooked",
  "left.name",
  "left.property.name",
  "left.property.value",
  "left.property.quasis.0.value.cooked",
];
const hasParserName = `:matches(${nameAttributes.map((attribute) => `[${attribute}=${parserName}]`).join(", ")})`;
// A parser can be any node that carries a name together with a function or the type of a function, so the rule checks each of them.
const parserForms = [
  `:matches(FunctionDeclaration, TSDeclareFunction, FunctionExpression, TSMethodSignature)${hasParserName}`,
  `${hasParserName} > :matches(:function, TSEmptyBodyFunctionExpression)`,
  `${hasParserName} > TSTypeAnnotation > TSFunctionType`,
  `Identifier[name=${parserName}] > TSTypeAnnotation > TSFunctionType`,
];
const parser = `:matches(${parserForms.join(", ")})`;

const contextName =
  "A context of React Router keeps a name that ends in Context from the constant that creates it to each call of get or set that takes it, so that the check of the contexts of features finds every context. So createContext comes only from a named import under its own name, a module creates a context only as a constant that it exports at its top level, an import or an export of a context keeps the suffix, and a context stands nowhere else.";
// A constant that a module exports at its top level, which is the one place where a module creates a context.
const contextDeclarator =
  'Program > ExportNamedDeclaration > VariableDeclaration[kind="const"] > VariableDeclarator[id.name=/Context$/]';
// The callee of the call that creates a context, alone or as the member of a namespace, which is the one place where createContext may stand besides its import.
const contextCall = `${contextDeclarator} > CallExpression`;
const contextCallee = `${contextCall} > Identifier.callee, ${contextCall} > MemberExpression.callee > .property`;
// A name of a context starts with a lowercase letter, unlike a type such as EntryContext, and createContext is no context.
const contextNamePattern = "/^[a-z][A-Za-z0-9]*Context$/";
// The positions where the name of a context may stand: the constant that creates it, an import or an export, a type that takes its type, the first argument of a call of get or set, and a method that only ends in Context, such as newContext of Playwright.
const contextPlaces = [
  `${contextDeclarator} > Identifier.id`,
  "ImportSpecifier > *",
  "ExportSpecifier > *",
  "TSTypeQuery > Identifier",
  "CallExpression[callee.property.name=/^(get|set)$/] > Identifier.arguments:first-child",
  "CallExpression > MemberExpression.callee > Identifier.property",
  ":matches(Property[method=true], MethodDefinition) > Identifier.key",
];

const restrictedSyntax = [
  {
    selector:
      "MemberExpression:matches([property.name=/^reduce(Right)?$/], [property.value=/^reduce(Right)?$/], [property.quasis.0.value.cooked=/^reduce(Right)?$/]), ObjectPattern > Property:matches([key.name=/^reduce(Right)?$/], [key.value=/^reduce(Right)?$/])",
    message: "Write a plain loop, which states each step explicitly.",
  },
  { selector: `${parser}[params.length<2]`, message: parserSignature },
  {
    selector: `${parser} > .params:first-child:not(Identifier[name="value"][typeAnnotation.typeAnnotation.type="TSUnknownKeyword"])`,
    message: parserSignature,
  },
  {
    selector: `${parser} > .params:nth-child(2):not(Identifier[name="source"][typeAnnotation.typeAnnotation.type="TSStringKeyword"])`,
    message: parserSignature,
  },
  {
    selector: `${parser}:not([returnType.typeAnnotation.typeName.name="Result"][returnType.typeAnnotation.typeArguments.params.1.type="TSStringKeyword"])`,
    message: parserSignature,
  },
  {
    selector: `:matches(Identifier[name="createContext"], Literal[value="createContext"], TemplateLiteral[quasis.0.value.cooked="createContext"]):not(ImportSpecifier > *, ${contextCallee})`,
    message: contextName,
  },
  {
    selector:
      'ImportSpecifier:matches([imported.name="createContext"], [imported.value="createContext"]):not([local.name="createContext"])',
    message: contextName,
  },
  {
    selector: `Identifier[name=${contextNamePattern}][name!="createContext"]:not(${contextPlaces.join(", ")})`,
    message: contextName,
  },
  {
    selector: `:matches(Literal[value=${contextNamePattern}][value!="createContext"], TemplateLiteral[quasis.0.value.cooked=${contextNamePattern}][quasis.0.value.cooked!="createContext"]):not(ImportSpecifier > *, ExportSpecifier > *)`,
    message: contextName,
  },
  {
    selector:
      "ExportSpecifier:matches([local.name=/Context$/], [local.value=/Context$/]):not([exported.name=/Context$/], [exported.value=/Context$/])",
    message: contextName,
  },
  {
    selector:
      "ImportSpecifier:matches([imported.name=/Context$/], [imported.value=/Context$/]):not([local.name=/Context$/])",
    message: contextName,
  },
];

const featureContextImport =
  "A feature never reads a context of React Router that another feature defines, as the section Structure of AGENTS.md states. Call a function of that feature that reads it, such as readPriceSourceDescription. A namespace import or an export of everything from another feature is refused too, because the check cannot see whether it takes a context.";
const featureDynamicImport =
  "A feature loads another feature with a static import, because the check of contexts cannot see what a dynamic import takes.";

const featureNames = readdirSync(join(import.meta.dirname, "app", "features"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** The paths with which a module in the folder of a feature loads another feature: the alias, a path to a sibling folder, and a path that climbs to the folder of the features or of the app. A path that climbs back into the folder of the feature stays in it. */
function otherFeaturePath(feature: string): string {
  return `^(~/features/|(\\.\\./)+(app/)?features/|\\.\\./)(?!${feature}/|\\.\\./)`;
}

/** The rules that keep the contexts of other features out of a feature. Tests and their helpers set contexts as the server does, so they may import them. */
function featureContextRules(feature: string): Linter.Config {
  const otherFeature = otherFeaturePath(feature);
  // A selector writes a pattern between slashes, so each slash in it is escaped.
  const selectorPattern = otherFeature.replaceAll("/", "\\/");
  return {
    files: [`app/features/${feature}/**/*.{ts,tsx}`],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*-for-test.{ts,tsx}",
      "**/*-for-test.server.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: otherFeature,
              importNamePattern: "Context$",
              message: featureContextImport,
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntax,
        {
          selector: `ImportExpression:matches([source.value=/${selectorPattern}/], [source.quasis.0.value.cooked=/${selectorPattern}/])`,
          message: featureDynamicImport,
        },
      ],
    },
  };
}

const featureImport =
  "A module outside the features never imports from a feature, as the section Structure of AGENTS.md states. Only app/root.tsx, app/routes.ts, server/app.ts, and server/account.ts compose the app from its features.";

export default defineConfig(
  globalIgnores([
    "build/",
    ".react-router/",
    "app/paraglide/",
    "coverage/",
    "playwright-report/",
    "test-results/",
  ]),
  eslintJs.configs.recommended,
  typescriptEslint.configs.strictTypeChecked,
  typescriptEslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      portolab: { rules: { "file-named-after-export": fileNamedAfterExport } },
    },
    rules: {
      "portolab/file-named-after-export": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      // A loader, an action, or a middleware of React Router stops with a response, such as a redirect to the sign-in page, by throwing it.
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            { from: "lib", name: "Response" },
            {
              from: "package",
              package: "react-router",
              name: "DataWithResponseInit",
            },
          ],
        },
      ],
      complexity: ["error", 12],
      eqeqeq: "error",
      "id-denylist": ["error", ...abbreviations],
      "id-length": ["error", { min: 2, properties: "never" }],
      "max-depth": ["error", 3],
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", 3],
      "no-console": "error",
      // A type import stays on its own line, as consistent-type-imports writes it.
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "no-param-reassign": "error",
      "no-restricted-syntax": ["error", ...restrictedSyntax],
      "no-warning-comments": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["app/**/*.tsx"],
    extends: [
      eslintReact.configs["strict-type-checked"],
      eslintReact.configs["disable-conflict-eslint-plugin-react-hooks"],
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.configs.strict,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: {
      "max-lines": "off",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "server/**/*.ts"],
    // The root route, the route table, the services of the server, and the account command compose the app from its features, so they are the only modules outside the features that may import them.
    ignores: [
      "app/features/**",
      "app/root.tsx",
      "app/routes.ts",
      "server/app.ts",
      "server/account.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features/**", "~/features/**"],
              message: featureImport,
            },
          ],
        },
      ],
      // A dynamic import loads a module too, and no-restricted-imports does not look at it.
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntax,
        {
          selector:
            "ImportExpression:matches([source.value=/(^|\\/)features\\//], [source.quasis.0.value.cooked=/(^|\\/)features\\//])",
          message: featureImport,
        },
      ],
    },
  },
  featureNames.map(featureContextRules),
  testLanguageConfig,
);
