import type { Page, TestInfo } from '@playwright/test';

interface BrowserEvent {
  type: 'console-error' | 'page-error' | 'request-failed' | 'http-error';
  message: string;
  url: string;
  timestamp: string;
}

/**
 * Records browser-side signals during a test and, only if the test failed,
 * attaches them as `browser-events.json`. These usually explain *why* a UI step failed
 * (JS exception, 500 from an API, blocked request) without opening the trace.
 */
export async function captureBrowserEvents(
  page: Page,
  testInfo: TestInfo,
  use: () => Promise<void>,
): Promise<void> {
  const events: BrowserEvent[] = [];
  const record = (type: BrowserEvent['type'], message: string, url = page.url()) =>
    events.push({ type, message, url, timestamp: new Date().toISOString() });

  page.on('console', (msg) => msg.type() === 'error' && record('console-error', msg.text()));
  page.on('pageerror', (error) => record('page-error', error.message));
  page.on('requestfailed', (req) =>
    record('request-failed', req.failure()?.errorText ?? 'unknown', req.url()),
  );
  page.on('response', (res) => {
    if (res.status() >= 400) record('http-error', `${res.status()} ${res.statusText()}`, res.url());
  });

  await use();

  if (testInfo.status !== testInfo.expectedStatus && events.length > 0) {
    await testInfo.attach('browser-events.json', {
      body: JSON.stringify(events, null, 2),
      contentType: 'application/json',
    });
  }
}
