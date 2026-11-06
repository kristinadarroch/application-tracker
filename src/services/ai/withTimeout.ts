const TIMED_OUT = Symbol('timed-out');

/**
 * Resolves with the promise's value, or with `TIMED_OUT` after `ms`.
 * The on-device request keeps running natively; its late result is ignored.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | typeof TIMED_OUT> {
  const { promise: timeout, resolve } = Promise.withResolvers<typeof TIMED_OUT>();
  const timer = setTimeout(() => resolve(TIMED_OUT), ms);
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export function isTimedOut(value: unknown): value is typeof TIMED_OUT {
  return value === TIMED_OUT;
}
