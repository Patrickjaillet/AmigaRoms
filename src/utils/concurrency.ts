import pLimit from "p-limit";

export type Limiter = <T>(fn: () => Promise<T>) => Promise<T>;

export function createLimiter(maxConcurrent: number): Limiter {
  const limit = pLimit(maxConcurrent);
  return <T>(fn: () => Promise<T>): Promise<T> => limit(fn);
}
