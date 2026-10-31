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
        {
          selector: "CallExpression[callee.property.name=/^reduce(Right)?$/]",
          message: "Write a plain loop, which states each step explicitly.",
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
