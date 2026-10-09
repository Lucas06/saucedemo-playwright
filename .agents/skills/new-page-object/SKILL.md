---
name: new-page-object
description: Create a new Page Object for a saucedemo page and wire it as a fixture. Use when a test needs a page that has no class in src/pages yet.
---

# Add a page object

1. **Inspect the page** with the `playwright-test` MCP: navigate to it and take a `browser_snapshot`.
   Note the `data-test` attributes. They are the preferred hooks (`getByTestId`).
2. **Create `src/pages/<Name>Page.ts`**:
   ```ts
   import type { Locator, Page } from '@playwright/test';
   import { step } from '@utils';
   import { BasePage } from './BasePage';

   export class CartPage extends BasePage {
     protected readonly path = '/cart.html';

     readonly checkoutButton: Locator;

     constructor(page: Page) {
       super(page);
       this.checkoutButton = page.getByTestId('checkout');
     }

     @step('Proceed to checkout')
     async checkout(): Promise<void> {
       await this.checkoutButton.click();
     }
   }
   ```
   - Locators: `readonly` fields, assigned in the constructor.
   - Methods: intent-level, `async`, decorated with `@step('…')` (no secrets in titles).
   - No assertions inside page objects.
3. **Export it** from `src/pages/index.ts`.
4. **Register the fixture** in `src/fixtures/index.ts`: add it to the `Pages` interface and to
   `base.extend` (`cartPage: async ({ page }, use) => use(new CartPage(page))`).
5. Run `npm run check`.
