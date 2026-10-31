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

test("accepts a parser with the standard signature and further parameters", async () => {
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
`),
  ).toEqual([]);
}, 60_000);

test("rejects a parser whose value, source, or result breaks the signature", async () => {
  for (const signature of [
    "parseName(text: unknown, source: string): Result<string, string>",
    "parseName(value: string, source: string): Result<string, string>",
    "parseName(value: unknown, where: string): Result<string, string>",
  ]) {
    expect(
      await rulesReporting(`${imports}
export function ${signature} {
  return typeof arguments[0] === "string" ? succeed("") : fail("");
}
`),
      signature,
    ).toContain("no-restricted-syntax");
  }
  expect(
    await rulesReporting(`export function parseName(value: unknown): string {
  return String(value);
}
`),
  ).toContain("no-restricted-syntax");
}, 60_000);
