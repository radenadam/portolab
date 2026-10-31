import eslintJs from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

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
// A function can be declared, assigned to a variable, or written as a method or a property, so the selectors cover each form.
const parserName = "/^parse[A-Z]/";
const parser = `:matches(FunctionDeclaration[id.name=${parserName}], VariableDeclarator[id.name=${parserName}] > :function, Property[key.name=${parserName}] > :function, MethodDefinition[key.name=${parserName}] > :function)`;

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
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
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
      "no-restricted-syntax": [
        "error",
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
      ],
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
    files: ["**/*.test.ts", "e2e/**/*.ts"],
    rules: {
      "max-lines": "off",
    },
  },
);
