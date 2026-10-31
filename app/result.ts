/** The outcome of an operation that can fail for an expected reason, which every caller must handle. */
export type Result<Value, Failure> =
  { ok: true; value: Value } | { ok: false; failure: Failure };

export function succeed<Value>(value: Value): Result<Value, never> {
  return { ok: true, value };
}

export function fail<Failure>(failure: Failure): Result<never, Failure> {
  return { ok: false, failure };
}
