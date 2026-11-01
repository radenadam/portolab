import { ESLint } from "eslint";
import { expect, test } from "vitest";

const eslint = new ESLint();

/** Lints code as if it were the file at the path, a file in scripts/ unless the test names another, and returns the rules that report it. The file must exist, because the type information that ESLint uses covers only files of the project. */
async function rulesReporting(
  code: string,
  filePath = "scripts/json.ts",
): Promise<string[]> {
  const results = await eslint.lintText(code, { filePath });
  const rules: string[] = [];
  for (const result of results) {
    for (const message of result.messages) {
      // A parsing error means that no rule ran, so a test that expects no report would pass without checking anything.
      expect(message.fatal ?? false, message.message).toBe(false);
      if (message.ruleId !== null) {
        rules.push(message.ruleId);
      }
    }
  }
  return rules;
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

test("accepts a parser with the standard signature in every form", async () => {
  for (const [form, write] of Object.entries(parserForms)) {
    expect(
      await rulesReporting(`${imports}${write(standardSignature)}\n`),
      form,
    ).not.toContain("no-restricted-syntax");
  }
}, 120_000);

test("rejects a parser with a wrong signature in every form", async () => {
  for (const [form, write] of Object.entries(parserForms)) {
    expect(await rulesReporting(`${write(wrongSignature)}\n`), form).toContain(
      "no-restricted-syntax",
    );
  }
}, 120_000);

test("rejects a parser whose value, source, or result breaks the signature", async () => {
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
      await rulesReporting(`${imports}export declare function ${signature};\n`),
      signature,
    ).toContain("no-restricted-syntax");
  }
}, 60_000);

test("accepts a parser that takes further parameters after the standard ones", async () => {
  expect(
    await rulesReporting(
      `${imports}export declare function parseName(value: unknown, source: string, suffix: string): Result<string, string>;\n`,
    ),
  ).not.toContain("no-restricted-syntax");
}, 60_000);

test("rejects reduce in every way to reach it, and accepts a plain loop", async () => {
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
    expect(await rulesReporting(code), code).toContain("no-restricted-syntax");
  }
  expect(
    await rulesReporting(
      "export function total(items: readonly number[]): number {\n  let sum = 0;\n  for (const item of items) {\n    sum += item;\n  }\n  return sum;\n}\n",
    ),
  ).not.toContain("no-restricted-syntax");
}, 60_000);

test("accepts throwing a response of React Router, and rejects throwing any other value that is not an error", async () => {
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
}, 60_000);

test("rejects abbreviated and one-letter names, and accepts full words", async () => {
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
}, 60_000);

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

test("rejects every way to load a feature from a module outside the features", async () => {
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
}, 120_000);

test("accepts loading a feature in the modules that compose the app and in the features", async () => {
  for (const [filePath, path] of [
    ["app/root.tsx", "./features/market-data/quote-change"],
    ["app/routes.ts", "~/features/market-data/quote-change"],
    ["server/app.ts", "~/features/market-data/quote-change"],
    ["server/account.ts", "../app/features/market-data/quote-change.ts"],
    [
      "app/features/market-data/prices-view.tsx",
      "~/features/language/language-switch",
    ],
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
}, 120_000);

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

test("rejects a module whose one export is not its file name, in every form of export and in every folder", async () => {
  for (const [form, code] of Object.entries(exportForms)) {
    for (const filePath of otherFiles) {
      expect(
        await rulesReporting(code, filePath),
        `${form} in ${filePath}`,
      ).toContain(fileNameRule);
    }
  }
}, 120_000);

test("accepts a module whose one export is its file name, in every form of export", async () => {
  for (const [form, code] of Object.entries(exportForms)) {
    expect(
      await rulesReporting(code, "app/features/market-data/quote-change.ts"),
      form,
    ).not.toContain(fileNameRule);
  }
}, 120_000);

test("compares the name with the file name before its first dot, in every folder", async () => {
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
}, 60_000);

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

test("leaves a module alone when its exports serve a concept or cannot be named", async () => {
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
}, 60_000);

test("counts values and not types or the names that React Router reads from a route", async () => {
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
}, 60_000);
