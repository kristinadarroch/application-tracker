/** Compile-time exhaustiveness check for `switch` statements over unions. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
