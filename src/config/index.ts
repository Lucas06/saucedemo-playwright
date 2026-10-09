import 'dotenv/config';

/**
 * Single source of truth for runtime configuration.
 * Everything environment-dependent is read here — never call `process.env` elsewhere.
 */
export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://www.saucedemo.com',
  password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
  isCI: !!process.env.CI,
  /** Parallel workers. Each one runs a browser, so lower it on memory-constrained machines. */
  workers: parseWorkers(process.env.WORKERS),
} as const;

/** Accepts `4` or `50%`; anything else falls back to Playwright's default (half the CPU cores). */
function parseWorkers(value: string | undefined): number | string | undefined {
  if (!value) return undefined;
  if (/^\d+%$/.test(value)) return value;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
