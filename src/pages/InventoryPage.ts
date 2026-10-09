import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html';

  readonly title: Locator;
  readonly inventoryList: Locator;
  readonly menuButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.inventoryList = page.getByTestId('inventory-list');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
  }

  /** URL matcher for `expect(page).toHaveURL(...)`. */
  readonly url = /\/inventory\.html$/;
}
