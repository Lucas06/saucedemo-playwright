---
name: new-test
description: Add a new Playwright test (spec) to this framework following its conventions. Use when asked to automate a scenario, cover a feature, or add positive/negative cases.
---

# Add a new test

1. **Understand the scenario.** If the UI is unfamiliar, explore it with the `playwright-test` MCP
   (`browser_navigate` → `browser_snapshot`) rather than guessing.
2. **Locate or create the spec file**: `tests/<feature>/<behaviour>.spec.ts`. Reuse an existing
   `test.describe` for the feature when it fits.
3. **Make sure every element you need is exposed by a page object** in `src/pages/`.
   Missing page? Follow the `new-page-object` skill first. Missing locator? Add a `readonly` field
   to the existing page object (prefer `getByTestId`, then `getByRole`).
4. **Put data in `src/data/`**: new users in `users.ts`, expected UI copy in `messages.ts`.
5. **Write the test**:
   ```ts
   import { expect, test } from '@fixtures';
   import { users, loginErrors } from '@data';

   test.describe('<Feature>', { tag: '@<feature>' }, () => {
     test(
       '<actor> <does> <outcome>',
       { tag: ['@positive'] },
       async ({ loginPage, inventoryPage }) => {
         await loginPage.open();
         await loginPage.login(users.standard);

         await expect(inventoryPage.title).toHaveText('Products');
       },
     );
   });
   ```
   - Arrange/act through page-object methods, assert in the spec with web-first assertions.
   - Cover the negative path too (invalid input, forbidden action, error message).
   - For several similar negative inputs, use a data-driven loop (see `tests/auth/login.spec.ts`).
6. **Verify**: `npx playwright test tests/<feature>/<file>.spec.ts`, then `npm run check`.
   If it fails, follow the `debug-failure` skill. Do not weaken assertions.
