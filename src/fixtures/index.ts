import { test as base } from '@playwright/test';
import { InventoryPage, LoginPage } from '@pages';
import { captureBrowserEvents } from './debug-context';

interface Pages {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
}

interface AutoFixtures {
  browserEvents: void;
}

/**
 * The only `test` that specs should import. Page objects are injected as fixtures,
 * so specs never call `new XPage(page)` themselves.
 */
export const test = base.extend<Pages & AutoFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),

  browserEvents: [
    async ({ page }, use, testInfo) => captureBrowserEvents(page, testInfo, use),
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
