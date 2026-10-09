import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'reports', 'test-results', 'playwright-report'] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ['eslint.config.mjs'] } },
    },
    rules: {
      // A missing `await` is the #1 source of flaky Playwright tests.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-focused-test': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      // Conventions: specs talk to the app only through page objects and fixtures.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^(locator|\\$|\\$\\$|getBy\\w+)$/]',
          message:
            'Locators belong in page objects (src/pages). Expose them there and use the fixture.',
        },
        {
          selector: 'NewExpression[callee.name=/Page$/]',
          message:
            'Do not instantiate page objects in specs; request them as fixtures from @fixtures.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'expect'],
              message:
                "Import { test, expect } from '@fixtures' so page-object fixtures are available.",
            },
          ],
        },
      ],
    },
  },
);
