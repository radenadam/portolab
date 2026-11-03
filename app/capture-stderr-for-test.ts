import { onTestFinished, vi } from "vitest";

/** Keeps what the code under test writes to stderr until the test finishes, such as a warning of the log, so that the test can read it and the output of the tests stays clean. */
export function captureStderrForTest(): string[] {
  const writes: string[] = [];
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    writes.push(String(chunk));
    return true;
  });
  return writes;
}
