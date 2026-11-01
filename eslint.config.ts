import eslintJs from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import typescriptEslint from "typescript-eslint";
import { fileNamedAfterExport } from "./lint/file-named-after-export.ts";

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
];

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
);
