import { expect, test } from '@fixtures';
import { loginErrors, users } from '@data';

test.describe('Login', { tag: '@auth' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test(
    'standard user can log in and lands on the inventory',
    { tag: ['@smoke', '@positive'] },
    async ({ page, loginPage, inventoryPage }) => {
      await loginPage.login(users.standard);

      await expect(page).toHaveURL(inventoryPage.url);
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.inventoryList).toBeVisible();
    },
  );

  test(
    'locked out user is rejected with an explanatory error',
    { tag: ['@smoke', '@negative'] },
    async ({ page, loginPage }) => {
      await loginPage.login(users.lockedOut);

      await expect(loginPage.errorMessage).toHaveText(loginErrors.lockedOut);
      await expect(page).not.toHaveURL(/inventory/);
    },
  );

  // Data-driven negative coverage: one test per row, each with its own report entry.
  const invalidInputs = [
    {
      name: 'unknown credentials',
      credentials: users.invalid,
      error: loginErrors.invalidCredentials,
    },
    {
      name: 'empty username',
      credentials: { ...users.standard, username: '' },
      error: loginErrors.usernameRequired,
    },
    {
      name: 'empty password',
      credentials: { ...users.standard, password: '' },
      error: loginErrors.passwordRequired,
    },
  ];

  for (const { name, credentials, error } of invalidInputs) {
    test(`shows a validation error for ${name}`, { tag: '@negative' }, async ({ loginPage }) => {
      await loginPage.login(credentials);

      await expect(loginPage.errorMessage).toHaveText(error);
    });
  }
});
