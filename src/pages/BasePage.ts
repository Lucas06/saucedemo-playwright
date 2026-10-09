import type { Page } from '@playwright/test';
import { step } from '@utils';

/**
 * Common behaviour for every page object.
 * Subclasses declare their `path` and expose locators + intent-level actions.
 */
export abstract class BasePage {
  /** Path relative to `baseURL`, e.g. `/inventory.html`. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  @step()
  async open(): Promise<void> {
    await this.page.goto(this.path);
  }
}
