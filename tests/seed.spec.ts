import { expect, test } from '@fixtures';

/**
 * Seed for the Playwright test agents (`.agents/agents/playwright-test-*`).
 * The planner/generator run this test to get a page in a known starting state
 * before exploring. It doubles as a cheap "is the app up?" sanity check.
 */
test.describe('Seed', () => {
  test('login page is reachable', async ({ loginPage }) => {
    await loginPage.open();

    await expect(loginPage.loginButton).toBeVisible();
  });
});
