import { ESLint } from "eslint";
import { expect, test } from "vitest";

const eslint = new ESLint();

/** Lints code as if it were a file in scripts/, and returns the rules that report it. */
async function rulesReporting(code: string): Promise<string[]> {
  const results = await eslint.lintText(code, {
    filePath: "scripts/sentences.ts",
  });
  const rules: string[] = [];
  for (const result of results) {
    for (const message of result.messages) {
      // A syntax error has no rule, so its text is kept to show why the code failed to parse.
      rules.push(message.ruleId ?? message.message);
    }
  }
  return rules;
}

const imports = `import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
`;

test("accepts a parser with the standard signature in every form of function", async () => {
  expect(
    await rulesReporting(`${imports}
export function parseName(value: unknown, source: string): Result<string, string> {
  return typeof value === "string" ? succeed(value) : fail(source);
}

export function parseNameWith(
  value: unknown,
  source: string,
  suffix: string,
): Result<string, string> {
  return typeof value === "string" ? succeed(value + suffix) : fail(source);
}

export const parseCode = (value: unknown, source: string): Result<string, string> =>
  typeof value === "string" ? succeed(value) : fail(source);

export const parsers = {
  parseLabel(value: unknown, source: string): Result<string, string> {
    return typeof value === "string" ? succeed(value) : fail(source);
  },
};
`),
  ).toEqual([]);
}, 60_000);

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
      await rulesReporting(`${imports}
export function ${signature} {
  return succeed(String(arguments.length)) ?? fail("");
}
`),
      signature,
    ).toContain("no-restricted-syntax");
  }
}, 60_000);

test("rejects a parser with a wrong signature in every form of function", async () => {
  for (const declaration of [
    "export const parseName = (value: string): string => value;",
    "export const parseName = function (value: string): string { return value; };",
    "export const parsers = { parseName(value: string): string { return value; } };",
    "export const parsers = { parseName: (value: string): string => value };",
    "export class Parsers { parseName(value: string): string { return value; } }",
  ]) {
    expect(await rulesReporting(declaration), declaration).toContain(
      "no-restricted-syntax",
    );
  }
}, 60_000);
