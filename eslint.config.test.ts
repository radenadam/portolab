import { ESLint } from "eslint";
import type { Linter } from "eslint";
import { expect, test } from "vitest";
import { minuteMilliseconds } from "./app/time-units.ts";

const eslint = new ESLint();

const testCalls = [
  "test",
  "it",
  "describe",
  "test.skip",
  "test.only",
  "test.todo",
  "test.fails",
  "test.concurrent",
  "test.sequential",
  "test.fixme",
  "test.step",
  "test.step.skip",
  "it.skip",
  "describe.only",
  "test.describe",
  "test.describe.parallel",
  "test.describe.serial",
  "test.describe.skip",
  'test["skip"]',
  'test.describe["parallel"]',
  "test.each([1])",
  "test.each`value`",
  "describe.each([1])",
  "test.skipIf(false)",
  "test.runIf(true)",
  "test.for([1])",
  "test.extend({})",
  "(test)",
  "(test as typeof test)",
  "test!",
  "test?.skip",
  "(test?.skip)",
  "check",
  "example",
  "suite",
  "browserTest",
  "playwrightTest",
  "quotedTest",
  "vitest.test",
  "vitest.describe.only",
  'vitest["it"]',
  "playwright.test.describe.parallel",
];
const testImports = [
  'import { test as check, it as example, describe as suite } from "vitest";',
  'import * as vitest from "vitest";',
  'import playwrightTest, { test as browserTest } from "@playwright/test";',
  'import * as playwright from "@playwright/test";',
  'import { "test" as quotedTest } from "vitest";',
];
const rejectedLanguageForms: string[] = [];
for (const operator of ["===", "!==", "==", "!="]) {
  for (const [left, right] of [
    ["locale", '"id"'],
    ['"en"', "locale"],
    ["locale", "`id`"],
    ["`en`", "locale"],
  ] as const) {
    rejectedLanguageForms.push(
      `{ const value = ${left} ${operator} ${right} ? "one" : "two"; }`,
    );
  }
}
rejectedLanguageForms.push(
  'switch (locale) { case "id": break; case "en": break; default: break; }',
  'if (locale !== "en") { expect(value).toBe("one"); }',
  'const value = locale === "id" && "one";',
);
for (const call of testCalls) {
  rejectedLanguageForms.push(
    `${call}(\`shows cash in \${locale}\`, () => {});`,
  );
}
rejectedLanguageForms.push(
  "test(`shows cash in ${String(locale)}`, () => {});",
  "test(`shows cash in ${locale.toUpperCase()}`, () => {});",
  "describe(`shows cash in ${`language ${locale}`}`, () => {});",
);
const acceptedLanguageForms = [
  'const texts: Record<"id" | "en", string> = { id: "satu", en: "one" };',
  "const input = texts[locale];",
  "const found = entries.find((entry) => entry.locale === locale);",
  'const filename = locale + ".json";',
  'switch (side) { case "buy": break; default: break; }',
  "switch (locale) { default: break; }",
  "format(`a file in ${locale}`);",
  "object.test(`a field in ${locale}`);",
  "vitest.expect(`a field in ${locale}`);",
  "test.info().outputPath(`home-${locale}.png`);",
];
for (const call of testCalls) {
  acceptedLanguageForms.push(
    `${call}(\`shows cash in \${languageNames[locale]}\`, () => {});`,
  );
}

const languageRule = "portolab-tests/language";

test(
  "checks locale branches and every test title form in each test location",
  async () => {
    const code = [
      ...testImports,
      ...rejectedLanguageForms,
      ...acceptedLanguageForms,
    ].join("\n");
    const expected = rejectedLanguageForms.map(
      (_form, index) => testImports.length + index + 1,
    );
    for (const filePath of [
      "app/formatting.test.ts",
      "app/features/trading/home-portfolio.test.tsx",
      "server/server-options.test.ts",
      "scripts/json.test.ts",
      "eslint.config.test.ts",
      "e2e/classes.test.ts",
      "e2e/frame.ts",
    ]) {
      const lines: number[] = [];
      for (const message of await lintMessages(code, filePath)) {
        if (message.ruleId === languageRule) lines.push(message.line);
      }
      expect(lines, filePath).toEqual(expected);
    }
  },
  2 * minuteMilliseconds,
);

test(
  "keeps production code and the tracked legacy files outside the locale check",
  async () => {
    const code = [...testImports, ...rejectedLanguageForms].join("\n");
    for (const filePath of [
      "app/formatting.ts",
      "server/server-options.ts",
      "scripts/json.ts",
      "eslint.config.ts",
      "app/change-text.test.tsx",
      "app/features/accounts/profile-menu.test.tsx",
      "app/features/market-data/stock-range.test.tsx",
      "app/features/trading/order-actions.server.test.ts",
      "app/features/trading/stock-position.test.tsx",
      "e2e/stock.test.ts",
    ]) {
      expect(await rulesReporting(code, filePath), filePath).not.toContain(
        languageRule,
      );
    }
  },
  2 * minuteMilliseconds,
);

/** Lints code as if it were the file at the path, a file in scripts/ unless the test names another, and returns the rules that report it. The file must exist, because the type information that ESLint uses covers only files of the project. */
async function rulesReporting(
  code: string,
  filePath = "scripts/json.ts",
): Promise<string[]> {
  const rules: string[] = [];
  for (const message of await lintMessages(code, filePath)) {
    if (message.ruleId !== null) rules.push(message.ruleId);
  }
  return rules;
}

async function lintMessages(
  code: string,
  filePath: string,
): Promise<Linter.LintMessage[]> {
  const results = await eslint.lintText(code, { filePath });
  const messages: Linter.LintMessage[] = [];
  for (const result of results) {
    for (const message of result.messages) {
      // A parsing error means that no rule ran, so a test that expects no report would pass without checking anything.
      expect(message.fatal ?? false, message.message).toBe(false);
      messages.push(message);
    }
  }
  return messages;
}

const imports = `import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
`;

interface Signature {
  /** The parameters and the result, as a declaration writes them. */
  declared: string;
  /** The same signature as the type of a function. */
  type: string;
  body: string;
  arrowBody: string;
}

const standardSignature: Signature = {
  declared: "(value: unknown, source: string): Result<string, string>",
  type: "(value: unknown, source: string) => Result<string, string>",
  body: 'return typeof value === "string" ? succeed(value) : fail(source);',
  arrowBody: 'typeof value === "string" ? succeed(value) : fail(source)',
};

const wrongSignature: Signature = {
  declared: "(value: string): string",
  type: "(value: string) => string",
  body: "return value;",
  arrowBody: "value",
};

type Write = (signature: Signature) => string;

// Forms whose name can only be an identifier.
const namedForms: Record<string, Write> = {
  "function declaration": (signature) =>
    `export function parseName${signature.declared} { ${signature.body} }`,
  "declared function": (signature) =>
    `export declare function parseName${signature.declared};`,
  "named function expression": (signature) =>
    `export const reader = function parseName${signature.declared} { ${signature.body} };`,
  "arrow function in a variable": (signature) =>
    `export const parseName = ${signature.declared} => ${signature.arrowBody};`,
  "function expression in a variable": (signature) =>
    `export const parseName = function ${signature.declared} { ${signature.body} };`,
  "assignment to a variable": (signature) =>
    `export let parseName: unknown;
parseName = ${signature.declared} => ${signature.arrowBody};`,
  "declared variable with a function type": (signature) =>
    `export declare const parseName: ${signature.type};`,
  "variable with a function type": (signature) =>
    `export let parseName: ${signature.type};`,
  "parameter with a function type": (signature) =>
    `export function apply(parseName: ${signature.type}): unknown { return parseName; }`,
};

// Forms whose name is a key, which can be written in each of the ways below.
const keyedForms: Record<
  string,
  (key: string, signature: Signature) => string
> = {
  "object method": (key, signature) =>
    `export const parsers = { ${key}${signature.declared} { ${signature.body} } };`,
  "object property": (key, signature) =>
    `export const parsers = { ${key}: ${signature.declared} => ${signature.arrowBody} };`,
  "class method": (key, signature) =>
    `export class Parsers { ${key}${signature.declared} { ${signature.body} } }`,
  "class field": (key, signature) =>
    `export class Parsers { ${key} = ${signature.declared} => ${signature.arrowBody}; }`,
  "declared class field": (key, signature) =>
    `export class Parsers { declare ${key}: ${signature.type}; }`,
  "accessor field": (key, signature) =>
    `export class Parsers { accessor ${key} = ${signature.declared} => ${signature.arrowBody}; }`,
  "abstract method": (key, signature) =>
    `export abstract class Parsers { abstract ${key}${signature.declared}; }`,
  "abstract field": (key, signature) =>
    `export abstract class Parsers { abstract ${key}: ${signature.type}; }`,
  "abstract accessor field": (key, signature) =>
    `export abstract class Parsers { abstract accessor ${key}: ${signature.type}; }`,
  "interface method": (key, signature) =>
    `export interface Parsers { ${key}${signature.declared}; }`,
  "interface property": (key, signature) =>
    `export interface Parsers { ${key}: ${signature.type}; }`,
};

const keyNames: Record<string, string> = {
  identifier: "parseName",
  "quoted name": '"parseName"',
  "computed name": '["parseName"]',
  "template name": "[`parseName`]",
};

const propertyAssignments: Record<string, string> = {
  identifier: "holder.parseName",
  "computed name": 'holder["parseName"]',
  "template name": "holder[`parseName`]",
};

// Every node that can carry the name of a parser, crossed with every way to write that name, as the section "Tests" of AGENTS.md requires.
const parserForms: Record<string, Write> = { ...namedForms };
for (const [form, write] of Object.entries(keyedForms)) {
  for (const [nameForm, key] of Object.entries(keyNames)) {
    parserForms[
      `${form} with ${nameForm === "identifier" ? "an identifier" : `a ${nameForm}`}`
    ] = (signature) => write(key, signature);
  }
}
for (const [nameForm, target] of Object.entries(propertyAssignments)) {
  parserForms[
    `assignment to a property with ${nameForm === "identifier" ? "an identifier" : `a ${nameForm}`}`
  ] = (signature) =>
    `export const holder: Record<string, unknown> = {};
${target} = ${signature.declared} => ${signature.arrowBody};`;
}

test(
  "accepts a parser with the standard signature in every form",
  async () => {
    for (const [form, write] of Object.entries(parserForms)) {
      expect(
        await rulesReporting(`${imports}${write(standardSignature)}\n`),
        form,
      ).not.toContain("no-restricted-syntax");
    }
  },
  2 * minuteMilliseconds,
);

test(
  "rejects a parser with a wrong signature in every form",
  async () => {
    for (const [form, write] of Object.entries(parserForms)) {
      expect(
        await rulesReporting(`${write(wrongSignature)}\n`),
        form,
      ).toContain("no-restricted-syntax");
    }
  },
  2 * minuteMilliseconds,
);

test(
  "rejects a parser whose value, source, or result breaks the signature",
  async () => {
    for (const signature of [
      "parseName(text: unknown, source: string): Result<string, string>",
      "parseName(value: string, source: string): Result<string, string>",
      "parseName(value: unknown = 1, source: string): Result<string, string>",
      "parseName(value: unknown, where: string): Result<string, string>",
      "parseName(value: unknown, source: string): Result<string, number>",
      "parseName(value: unknown, source: string): string",
      "parseName(value: unknown): Result<string, string>",
    ]) {
      expect(
        await rulesReporting(
          `${imports}export declare function ${signature};\n`,
        ),
        signature,
      ).toContain("no-restricted-syntax");
    }
  },
  minuteMilliseconds,
);

test(
  "accepts a parser that takes further parameters after the standard ones",
  async () => {
    expect(
      await rulesReporting(
        `${imports}export declare function parseName(value: unknown, source: string, suffix: string): Result<string, string>;\n`,
      ),
    ).not.toContain("no-restricted-syntax");
  },
  minuteMilliseconds,
);

test(
  "rejects a second import of values or of types that repeats the specifier of an earlier import, with the alias, a relative path, and a path that climbs out of its folder, and accepts one import of each",
  async () => {
    for (const code of [
      `import { fail } from "../app/result.ts";
import { succeed } from "../app/result.ts";
export const both = [fail, succeed];`,
      `import type { Result } from "../app/result.ts";
import type { Result as Outcome } from "../app/result.ts";
export type Both = [Result<1, 2>, Outcome<1, 2>];`,
      `import { parseJsonObject } from "./json.ts";
import { readJsonFile } from "./json.ts";
export const both = [parseJsonObject, readJsonFile];`,
      `import type { Parser } from "./json.ts";
import type { Parser as Reader } from "./json.ts";
export type Both = [Parser<string>, Reader<number>];`,
      `import { parseUsername } from "~/features/accounts/username";
import { isUsername } from "~/features/accounts/username";
export const both = [parseUsername, isUsername];`,
      `import type { Username } from "~/features/accounts/username";
import type { Username as Name } from "~/features/accounts/username";
export type Both = [Username, Name];`,
    ]) {
      expect(await rulesReporting(code), code).toContain(
        "no-duplicate-imports",
      );
    }
    expect(
      await rulesReporting(
        `${imports}export function parseName(value: unknown): Result<string, string> { return typeof value === "string" ? succeed(value) : fail("no name"); }`,
      ),
    ).not.toContain("no-duplicate-imports");
  },
  minuteMilliseconds,
);

test(
  "rejects reduce in every way to reach it, and accepts a plain loop",
  async () => {
    for (const code of [
      "export const total = [1, 2].reduce((sum, item) => sum + item, 0);",
      "export const total = [1, 2].reduceRight((sum, item) => sum + item, 0);",
      'export const total = [1, 2]["reduce"]((sum, item) => sum + item, 0);',
      "export const total = ([1, 2] as number[] | undefined)?.reduce((sum, item) => sum + item, 0);",
      "export const total = [1, 2][`reduce`]((sum, item) => sum + item, 0);",
      "export const total: unknown = Array.prototype.reduce.call([1, 2], (sum: number, item: number) => sum + item, 0);",
      "export const total: unknown = Array.prototype.reduceRight.apply([1, 2], [(sum: number, item: number) => sum + item, 0]);",
      "const items = [1, 2];\nexport const { reduce } = items;",
      'const items = [1, 2];\nexport const { "reduceRight": combine } = items;',
    ]) {
      expect(await rulesReporting(code), code).toContain(
        "no-restricted-syntax",
      );
    }
    expect(
      await rulesReporting(
        "export function total(items: readonly number[]): number {\n  let sum = 0;\n  for (const item of items) {\n    sum += item;\n  }\n  return sum;\n}\n",
      ),
    ).not.toContain("no-restricted-syntax");
  },
  minuteMilliseconds,
);

test(
  "accepts throwing a response of React Router, and rejects throwing any other value that is not an error",
  async () => {
    const throwsInRoute = (statement: string): string =>
      `import { data, redirect } from "react-router";
export function loader(): void {
  ${statement}
}
`;
    for (const statement of [
      `throw redirect("/sign-in");`,
      `throw data(null, { status: 404 });`,
      `throw new Response(null, { status: 404 });`,
      `throw new Error("A state that should never happen.");`,
    ]) {
      expect(
        await rulesReporting(throwsInRoute(statement), "app/root.tsx"),
        statement,
      ).not.toContain("@typescript-eslint/only-throw-error");
    }
    for (const statement of [
      `throw "/sign-in";`,
      `throw { status: 404 };`,
      `throw 404;`,
    ]) {
      expect(
        await rulesReporting(throwsInRoute(statement), "app/root.tsx"),
        statement,
      ).toContain("@typescript-eslint/only-throw-error");
    }
  },
  minuteMilliseconds,
);

test(
  "rejects abbreviated and one-letter names, and accepts full words",
  async () => {
    for (const code of [
      "export const msg = 1;",
      "export function handle(err: unknown): unknown { return err; }",
      "export const parsers = { cfg: 1 };",
    ]) {
      expect(await rulesReporting(code), code).toContain("id-denylist");
    }
    expect(await rulesReporting("export const x = 1;")).toContain("id-length");
    const fullWords = await rulesReporting(
      "export function handle(error: unknown): unknown { const message = error; return message; }",
    );
    expect(fullWords).not.toContain("id-denylist");
    expect(fullWords).not.toContain("id-length");
  },
  minuteMilliseconds,
);

// Every way to load a module, for a path that names a feature.
const loadingForms: Record<string, (path: string) => string> = {
  "static import": (path) =>
    `import { quoteChange } from "${path}";\nexport { quoteChange };`,
  "type import": (path) =>
    `import type { Quote } from "${path}";\nexport type { Quote };`,
  "export from": (path) => `export { quoteChange } from "${path}";`,
  "export all from": (path) => `export * from "${path}";`,
  "dynamic import": (path) =>
    `export const load = async (): Promise<unknown> => import("${path}");`,
};

// Each module outside the features, with the paths to a feature that it can write: the alias, a path inside its folder, and a path that climbs out of it.
const modulesOutsideFeatures: Record<string, readonly string[]> = {
  "app/formatting.ts": [
    "~/features/market-data/quote-change",
    "./features/market-data/quote-change",
  ],
  "app/database/database.server.ts": ["../features/market-data/quote-change"],
  "server/main.ts": ["../app/features/market-data/quote-change.ts"],
};

test(
  "rejects every way to load a feature from a module outside the features",
  async () => {
    for (const [filePath, paths] of Object.entries(modulesOutsideFeatures)) {
      for (const path of paths) {
        for (const [form, write] of Object.entries(loadingForms)) {
          const rules = await rulesReporting(write(path), filePath);
          expect(
            rules.includes("no-restricted-imports") ||
              rules.includes("no-restricted-syntax"),
            `${form} of ${path} in ${filePath}`,
          ).toBe(true);
        }
      }
    }
  },
  2 * minuteMilliseconds,
);

test(
  "accepts loading a feature in the modules that compose the app",
  async () => {
    for (const [filePath, path] of [
      ["app/root.tsx", "./features/market-data/quote-change"],
      ["app/routes.ts", "~/features/market-data/quote-change"],
      ["server/app.ts", "~/features/market-data/quote-change"],
      ["server/account.ts", "../app/features/market-data/quote-change.ts"],
    ] as const) {
      for (const [form, write] of Object.entries(loadingForms)) {
        const rules = await rulesReporting(write(path), filePath);
        expect(rules, `${form} in ${filePath}`).not.toContain(
          "no-restricted-imports",
        );
        expect(rules, `${form} in ${filePath}`).not.toContain(
          "no-restricted-syntax",
        );
      }
    }
  },
  2 * minuteMilliseconds,
);

/** Code that loads a module at a path, and takes a name of it or everything of it. */
type LoadingForm = (path: string, name: string) => string;

/** The name of a context with a stem. The test builds it, because the check rejects a string that holds the name of a context. */
function contextNamed(stem: string): string {
  return `${stem}Context`;
}

const priceSourceContextName = contextNamed("priceSource");

/** The name under which a form renames what it takes, which keeps the suffix of the name of a context. */
function renamed(name: string): string {
  return `loaded${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** Code that reads a context of a name through a provider of contexts, as a loader of React Router does. */
function readWith(name: string): string {
  return `export const read = (context: { get: (key: unknown) => unknown }): unknown => context.get(${name});`;
}

// Every way to load a module that names what it takes, each using it where a context may stand, which the check accepts for a name that is no context.
const namingForms: Record<string, LoadingForm> = {
  "static import": (path, name) =>
    `import { ${name} } from "${path}";\n${readWith(name)}`,
  "renamed import": (path, name) =>
    `import { ${name} as ${renamed(name)} } from "${path}";\n${readWith(renamed(name))}`,
  "type import": (path, name) =>
    `import type { ${name} } from "${path}";\nexport type Loaded = typeof ${name};`,
  "export from": (path, name) => `export { ${name} } from "${path}";`,
  "renamed export from": (path, name) =>
    `export { ${name} as ${renamed(name)} } from "${path}";`,
};

// Every way to load everything of a module, which the check refuses from another feature, because it cannot see whether it takes a context.
const wholeModuleForms: Record<string, LoadingForm> = {
  "export all from": (path) => `export * from "${path}";`,
  "export all as from": (path) => `export * as loaded from "${path}";`,
  "namespace import": (path) =>
    `import * as loaded from "${path}";\nexport { loaded };`,
  "dynamic import": (path) =>
    `export const load = async (): Promise<unknown> => import("${path}");`,
  "dynamic import of a template": (path) =>
    `export const load = async (): Promise<unknown> => import(\`${path}\`);`,
};

const contextLoadingForms = { ...namingForms, ...wholeModuleForms };

/** Whether a rule that restricts loading a module reports the code at the path. */
async function isLoadingRefused(
  code: string,
  filePath: string,
): Promise<boolean> {
  const rules = await rulesReporting(code, filePath);
  return (
    rules.includes("no-restricted-imports") ||
    rules.includes("no-restricted-syntax")
  );
}

// A module of trading, with the paths to the context of the price source of market-data that it can write: the alias, a path to a sibling folder, and paths that climb to the folder of the features and of the app.
const tradingModule = "app/features/trading/orders-page.tsx";
const otherFeatureContextPaths = [
  "~/features/market-data/price-source-context.server",
  "../market-data/price-source-context.server",
  "../../features/market-data/price-source-context.server",
  "../../../app/features/market-data/price-source-context.server.ts",
];

test(
  "rejects every way to load a context of another feature, or everything of another feature, in a feature",
  async () => {
    for (const path of otherFeatureContextPaths) {
      for (const [form, write] of Object.entries(contextLoadingForms)) {
        expect(
          await isLoadingRefused(
            write(path, priceSourceContextName),
            tradingModule,
          ),
          `${form} of ${path}`,
        ).toBe(true);
      }
    }
  },
  2 * minuteMilliseconds,
);

test(
  "accepts a context of the same feature or of no feature, a name of another feature that is no context, and a context of another feature in tests",
  async () => {
    const accepted: {
      filePath: string;
      paths: readonly string[];
      name: string;
      forms: Record<string, LoadingForm>;
    }[] = [
      {
        filePath: "app/features/market-data/prices-page.tsx",
        paths: [
          "./price-source-context.server",
          "~/features/market-data/price-source-context.server",
          "../market-data/price-source-context.server",
        ],
        name: priceSourceContextName,
        forms: contextLoadingForms,
      },
      {
        filePath: tradingModule,
        paths: [
          "~/database/database.server",
          "../../database/database.server.ts",
        ],
        name: contextNamed("database"),
        forms: contextLoadingForms,
      },
      {
        filePath: tradingModule,
        paths: otherFeatureContextPaths,
        name: "readPriceSourceDescription",
        forms: namingForms,
      },
      {
        filePath: "app/features/trading/order-actions.server.test.ts",
        paths: otherFeatureContextPaths,
        name: priceSourceContextName,
        forms: contextLoadingForms,
      },
      {
        filePath: "app/features/trading/orders-for-test.ts",
        paths: otherFeatureContextPaths,
        name: priceSourceContextName,
        forms: contextLoadingForms,
      },
    ];
    for (const { filePath, paths, name, forms } of accepted) {
      for (const path of paths) {
        for (const [form, write] of Object.entries(forms)) {
          expect(
            await isLoadingRefused(write(path, name), filePath),
            `${form} of ${name} from ${path} in ${filePath}`,
          ).toBe(false);
        }
      }
    }
  },
  4 * minuteMilliseconds,
);

// A module of market-data other than the one that the code of a test imports, because the type checker never finishes a module that imports itself and exports what it imports.
const contextModule = "app/features/market-data/prices-page.tsx";
const createContextImport = 'import { createContext } from "react-router";\n';
const namespaceImport = 'import * as Router from "react-router";\n';
// A module that creates a context as it may, which a test then passes on.
const sourceContextModule = `${createContextImport}export const sourceContext = createContext<string>();\n`;
const pricesImport =
  'import * as prices from "./price-source-context.server";\n';

/** Checks that no-restricted-syntax reports each code, or reports none of them, in a module of market-data. */
async function expectContextRule(
  codes: readonly string[],
  isReported: boolean,
): Promise<void> {
  for (const code of codes) {
    const rules = await rulesReporting(code, contextModule);
    expect(rules.includes("no-restricted-syntax"), code).toBe(isReported);
  }
}

test(
  "rejects a context that a module does not create as a constant that it exports at its top level under a name with the suffix Context, and createContext under another name",
  async () => {
    await expectContextRule(
      [
        `${createContextImport}export const source = createContext<string>();`,
        `${createContextImport}export const holder = { sourceContext: createContext<string>() };`,
        `${createContextImport}export let sourceContext = createContext<string>();`,
        `${createContextImport}const sourceContext = createContext<string>();\nexport { sourceContext };`,
        `${createContextImport}export function make(): unknown {\n  const localContext = createContext<string>();\n  return localContext;\n}`,
        `${createContextImport}export const contexts = [createContext<string>()];`,
        'import { createContext as makeContext } from "react-router";\nexport { makeContext };',
        'import { "createContext" as makeContext } from "react-router";\nexport { makeContext };',
        `${namespaceImport}export const source = Router.createContext<string>();`,
        `${namespaceImport}export const source = Router["createContext"]<string>();`,
        `${namespaceImport}export const source = Router[\`createContext\`]<string>();`,
        `${namespaceImport}export const make = Router.createContext;`,
        `${namespaceImport}const { createContext: make } = Router;\nexport const sourceContext = make<string>();`,
        `${namespaceImport}const { "createContext": make } = Router;\nexport const sourceContext = make<string>();`,
        `${createContextImport}const make = createContext;\nexport const sourceContext = make<string>();`,
        'export const load = async (): Promise<unknown> => {\n  const { createContext } = await import("react-router");\n  return createContext<string>();\n};',
      ],
      true,
    );
  },
  minuteMilliseconds,
);

test(
  "accepts a context that a module creates as a constant that it exports at its top level under a name with the suffix Context",
  async () => {
    await expectContextRule(
      [
        sourceContextModule,
        'import { "createContext" as createContext } from "react-router";\nexport const sourceContext = createContext<string>();',
        `${namespaceImport}export const sourceContext = Router.createContext<string>();`,
        `${namespaceImport}export const sourceContext = Router["createContext"]<string>();`,
      ],
      false,
    );
  },
  minuteMilliseconds,
);

test(
  "rejects a context under a name without the suffix Context, and a context anywhere but its declaration, an import, an export, a type, and the first argument of a call of get or set",
  async () => {
    const name = priceSourceContextName;
    await expectContextRule(
      [
        `${sourceContextModule}export { sourceContext as source };`,
        `${sourceContextModule}export { sourceContext as "source" };`,
        `${sourceContextModule}export { sourceContext as default };`,
        `${sourceContextModule}export default sourceContext;`,
        `${sourceContextModule}export const source = sourceContext;`,
        `${sourceContextModule}export function source(): unknown {\n  return sourceContext;\n}`,
        `${sourceContextModule}export const holder = { sourceContext };`,
        `${sourceContextModule}export const holder = { source: sourceContext };`,
        `${sourceContextModule}export const contexts = [sourceContext];`,
        `${sourceContextModule}export const text = String(sourceContext);`,
        `${sourceContextModule}export const read = (context: { get: (key: unknown, other: unknown) => unknown }): unknown => context.get(1, sourceContext);`,
        `export function read(sourceContext: unknown): unknown {\n  return sourceContext;\n}`,
        `import { ${name} as source } from "./price-source-context.server";\nexport { source };`,
        `export { ${name} as source } from "./price-source-context.server";`,
        `${pricesImport}export const source = prices.${name};`,
        `${pricesImport}export const source = prices["${name}"];`,
        `${pricesImport}export const source = prices[\`${name}\`];`,
        `${pricesImport}export const source: unknown = Reflect.get(prices, "${name}");`,
        `${pricesImport}const { ${name}: source } = prices;\nexport { source };`,
        `${pricesImport}const { "${name}": source } = prices;\nexport { source };`,
      ],
      true,
    );
  },
  2 * minuteMilliseconds,
);

test(
  "accepts a context in its declaration, an import and an export that keep the suffix Context, a type, and a call of get or set, and a method whose name ends in Context",
  async () => {
    const name = priceSourceContextName;
    await expectContextRule(
      [
        `${sourceContextModule}export { sourceContext as otherContext };`,
        `import { ${name} } from "./price-source-context.server";\nexport { ${name} };\nexport type Source = typeof ${name};\nexport const read = (context: { get: (key: unknown) => unknown; set: (key: unknown, value: unknown) => void }): unknown => {\n  context.set(${name}, 1);\n  return context.get(${name});\n};`,
        `import { ${name} as ${renamed(name)} } from "./price-source-context.server";\nexport { ${renamed(name)} as otherContext };`,
        "export const browser = {\n  newContext(): void {},\n};\nbrowser.newContext();",
        "export class Server {\n  getLoadContext(): void {}\n}",
      ],
      false,
    );
  },
  minuteMilliseconds,
);

const fileNameRule = "portolab/file-named-after-export";

// Every way to export one value, each named quoteChange or QuoteChange, so that quote-change is the file name that it asks for.
const exportForms: Record<string, string> = {
  "function declaration": "export function quoteChange(): number { return 1; }",
  "async function":
    "export async function quoteChange(): Promise<number> { return Promise.resolve(1); }",
  "declared function": "export declare function quoteChange(): number;",
  variable: "export const quoteChange = 1;",
  "destructured variable":
    "const holder = { quoteChange: 1 };\nexport const { quoteChange } = holder;",
  "destructured list":
    "const holder = [1];\nexport const [quoteChange] = holder;",
  class: "export class QuoteChange {}",
  "abstract class": "export abstract class QuoteChange {}",
  enum: "export enum QuoteChange { Rise }",
  namespace:
    "export namespace QuoteChange { export const rise = 1; export const fall = 2; }",
  "default function":
    "export default function quoteChange(): number { return 1; }",
  "default class": "export default class QuoteChange {}",
  "export of a local": "const quoteChange = 1;\nexport { quoteChange };",
  "renamed export": "const change = 1;\nexport { change as quoteChange };",
  "quoted export name":
    'const change = 1;\nexport { change as "quoteChange" };',
  "export from": 'export { quoteChange } from "./change";',
  "namespace export from": 'export * as quoteChange from "./change";',
  "import equals":
    "namespace Inner { export const value = 1; }\nexport import quoteChange = Inner.value;",
};

// A file of each kind in each folder that ESLint checks, and none of them is named quote-change.
const otherFiles = [
  "app/formatting.ts",
  "app/features/market-data/quote-store.server.ts",
  "app/features/market-data/prices-view.tsx",
  "scripts/json.ts",
  "server/server-options.ts",
  "e2e/choose-language.ts",
  "lint/file-named-after-export.ts",
];

test(
  "rejects a module whose one export is not its file name, in every form of export and in every folder",
  async () => {
    for (const [form, code] of Object.entries(exportForms)) {
      for (const filePath of otherFiles) {
        expect(
          await rulesReporting(code, filePath),
          `${form} in ${filePath}`,
        ).toContain(fileNameRule);
      }
    }
  },
  2 * minuteMilliseconds,
);

test(
  "accepts a module whose one export is its file name, in every form of export",
  async () => {
    for (const [form, code] of Object.entries(exportForms)) {
      expect(
        await rulesReporting(code, "app/features/market-data/quote-change.ts"),
        form,
      ).not.toContain(fileNameRule);
    }
  },
  2 * minuteMilliseconds,
);

test(
  "compares the name with the file name before its first dot, in every folder",
  async () => {
    for (const [filePath, code] of [
      [
        "app/features/market-data/quote-store.server.ts",
        "export function quoteStore(): number { return 1; }",
      ],
      [
        "app/features/market-data/prices-view.tsx",
        "export function PricesView(): null { return null; }",
      ],
      [
        "scripts/read-text-file.ts",
        'export function readTextFile(): string { return ""; }',
      ],
      [
        "e2e/expect-accessible-screen.ts",
        "export function expectAccessibleScreen(): number { return 1; }",
      ],
    ] as const) {
      expect(await rulesReporting(code, filePath), filePath).not.toContain(
        fileNameRule,
      );
    }
  },
  minuteMilliseconds,
);

test("names the export, the file name that it asks for, and the file name that it found", async () => {
  const results = await eslint.lintText(
    "export function quoteChange(): number { return 1; }\n",
    { filePath: "app/formatting.ts" },
  );
  const messages = results.flatMap((result) => result.messages);
  expect(
    messages.find((message) => message.ruleId === fileNameRule)?.message,
  ).toBe(
    "The one export of this module is quoteChange, so its file name must start with quote-change, but it starts with formatting. The section Structure of AGENTS.md states this standard.",
  );
});

test(
  "leaves a module alone when its exports serve a concept or cannot be named",
  async () => {
    for (const [module, code] of Object.entries({
      "several exports": "export const first = 1;\nexport const second = 2;",
      "only types":
        'export interface Change { value: number }\nexport type Kind = "rise";\nexport type { Other } from "./other";',
      "an anonymous default export": "export default { size: 1 };",
      "a default export named default":
        "const change = 1;\nexport { change as default };",
      "an export of every name of another module":
        'export const change = 1;\nexport * from "./other";',
      "the exports of a route":
        "export function loader(): null { return null; }\nexport function meta(): [] { return []; }",
    })) {
      expect(
        await rulesReporting(code, "app/formatting.ts"),
        module,
      ).not.toContain(fileNameRule);
    }
  },
  minuteMilliseconds,
);

test(
  "counts values and not types or the names that React Router reads from a route",
  async () => {
    expect(
      await rulesReporting(
        "export interface Change { value: number }\nexport function quoteChange(): number { return 1; }",
        "app/formatting.ts",
      ),
    ).toContain(fileNameRule);
    const route =
      "export function loader(): null { return null; }\nexport default function PricesPage(): null { return null; }";
    expect(
      await rulesReporting(route, "app/features/market-data/prices-page.tsx"),
    ).not.toContain(fileNameRule);
    expect(
      await rulesReporting(route, "app/features/market-data/prices-view.tsx"),
    ).toContain(fileNameRule);
  },
  minuteMilliseconds,
);
