import { expect, test, vi } from "vitest";
import { exitWithFailure } from "./exit-with-failure.server";

test("writes every failure in order and then exits with a failure", () => {
  const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new Error(`The program exited with code ${String(code)}.`);
  });
  const written: string[] = [];
  expect(() =>
    exitWithFailure(["PORT is wrong.", "--mode is wrong."], (failure) => {
      written.push(failure);
    }),
  ).toThrow("The program exited with code 1.");
  expect(written).toEqual(["PORT is wrong.", "--mode is wrong."]);
  exit.mockRestore();
});
