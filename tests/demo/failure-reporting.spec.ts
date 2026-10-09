import { expect, test } from '@fixtures';
import { users } from '@data';

/**
 * ⚠️ INTENTIONALLY FAILING TEST: lives only on the `demo/failure-reporting` branch, never merged.
 *
 * It exists so reviewers can see the failure reporting working in a real CI run:
 * the login flow succeeds and the final assertion fails on purpose, so the report shows
 * the passed steps that led up to the failure and pinpoints the exact failing step.
 */
test.describe('Failure reporting demo', { tag: '@demo' }, () => {
  test(
    'standard user sees the product catalogue title',
    {
      annotation: {
        type: 'intentional-failure',
        description: 'Expected title is deliberately wrong (the real one is "Products").',
      },
    },
    async ({ page, loginPage, inventoryPage }) => {
      await loginPage.open();
      await loginPage.login(users.standard);
      await expect(page).toHaveURL(inventoryPage.url);

      // Deliberately wrong expectation, hardcoded on purpose for this demo only.
      await expect(inventoryPage.title).toHaveText('Product Catalogue');
    },
  );
});
