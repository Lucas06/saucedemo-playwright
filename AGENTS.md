# AGENTS.md

Context for AI coding agents working in this repo.
Humans: see [README.md](README.md). This file is the source of truth for conventions.

## What this is

End-to-end UI test framework for https://www.saucedemo.com, built on Playwright Test + TypeScript.
No application code lives here, only tests and the abstractions that support them.

## Commands

| Goal                                            | Command                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Run everything                                  | `npm test`                                                                              |
| Run one file / one test                         | `npx playwright test tests/auth/login.spec.ts` / `npx playwright test -g "locked out"`  |
| Run by tag                                      | `npx playwright test --grep @smoke` (tags: `@smoke`, `@auth`, `@positive`, `@negative`) |
| Static checks (run before finishing any change) | `npm run check` (typecheck + lint + format)                                             |
| Auto-fix lint/format                            | `npm run lint:fix && npm run format`                                                    |
| Open HTML report                                | `npm run report`                                                                        |
| Open a trace                                    | `npx playwright show-trace <path/to/trace.zip>`                                         |

On machines with little RAM, browsers can crash under parallelism ("Page crashed",
"worker process exited unexpectedly"). Set `WORKERS=1` or `WORKERS=2` in `.env`.

## Layout

```
src/
  config/     env-driven settings. The ONLY place that reads process.env
  data/       test data (users) and expected UI copy (messages)
  pages/      Page Objects: one class per page, extends BasePage
  fixtures/   custom `test` that injects page objects + auto-captures browser events
  utils/      cross-cutting helpers (`@step` decorator)
reporters/    custom failure-summary reporter
tests/        specs grouped by feature: tests/<feature>/<behaviour>.spec.ts
specs/        markdown test plans (written by the planner agent)
```

Path aliases (tsconfig): `@config`, `@data`, `@fixtures`, `@pages`, `@utils`. Use them instead of relative imports across folders.

## Conventions (lint enforces the ones marked ⚙)

**Specs (`tests/**`)**

- ⚙ Import `{ test, expect }` from `@fixtures`, never from `@playwright/test`.
- ⚙ No locators in specs (`page.locator`, `getBy*`): they go in page objects.
- ⚙ Never `new SomePage(page)` in a spec. Request the page object as a fixture (`async ({ loginPage }) => …`).
- ⚙ No `waitForTimeout`, no `{ force: true }`, no `.only`. Use web-first assertions (`await expect(locator).toBeVisible()`), not `expect(await locator.isVisible())`.
- Assertions live in specs, not in page objects.
- Test titles describe behaviour: `'<actor> <does/sees> <outcome>'`.
- Tag every test: a feature tag (`@auth`) on the describe, plus `@positive`/`@negative` and `@smoke` for critical paths.
- Data-driven cases: loop over an array of `{ name, input, expected }`, one `test()` per row.
- Tests must be independent and parallel-safe. No shared state, no ordering assumptions.

**Page objects (`src/pages/**`)**

- One class per page, `extends BasePage`, declares `protected readonly path`.
- Locators are `readonly` public fields set in the constructor.
- Locator priority: `getByTestId` (`data-test` attribute; configured as `testIdAttribute`) → `getByRole` → `getByText`. No CSS/XPath unless nothing else works, and leave a comment saying why.
- Actions are intent-level async methods (`login(credentials)`, not `clickLoginButton()`) decorated with `@step('…')` so they show up as named steps in reports. Never put secrets in a step title.
- Register every new page object in `src/pages/index.ts` and as a fixture in `src/fixtures/index.ts`.

**Data (`src/data/**`)**

- Users and expected copy are constants. Never hardcode an expected UI string in a spec.
- Secrets come from `env` (`src/config`), with public-demo defaults.

## Debugging a failure: read in this order

1. **`reports/failure-summary.md`**: per failed test: the step tree with `<-- FAILED HERE`, error, source snippet and artifact paths. `failure-summary.json` has the same data in machine-readable form. Start here.
2. **`test-results/<test>/error-context.md`**: ARIA snapshot of the page at the moment of failure. Use it to check whether a locator still matches the DOM.
3. **`browser-events.json`** attachment (when present): console errors, uncaught page errors, failed requests and HTTP ≥ 400 captured during the test.
4. **Trace**: `npx playwright show-trace test-results/<test>/trace.zip` for DOM snapshots, network and actions timeline.
5. Screenshot/video in the same `test-results/<test>/` folder.

Rules when fixing:

- Fix the root cause. Never weaken an assertion, add arbitrary waits, or add `force: true` to make a test pass.
- If the app behaviour legitimately changed, update the page object / data constant, not each spec.
- If the failure is environmental (crash, network), say so instead of changing the code.

## Agent tooling in this repo

- **MCP** (`.mcp.json`): `playwright-test` server. Drives a real browser, inspects the page, and runs/debugs tests.
- **Agent definitions** (`.agents/agents/`), generated by `npx playwright init-agents`:
  - `playwright-test-planner`: explores the app and writes a test plan in `specs/`.
  - `playwright-test-generator`: turns a plan item into a spec.
  - `playwright-test-healer`: runs failing tests and fixes them.
- **Skills** (`.agents/skills/`): `new-test`, `new-page-object`, `debug-failure`. Step-by-step recipes that follow the conventions above.
- To discover locators on the live app, use the MCP browser tools (`browser_snapshot`, `browser_generate_locator`) instead of guessing selectors.
- Code produced by `playwright-test-generator` uses raw `page.*` calls. Before finishing, move its locators into page objects and its imports to `@fixtures`. `npm run lint` points at every violation.

## Definition of done

- `npm run check` passes.
- The affected tests pass locally (`npx playwright test <file>`).
- New behaviour has at least one positive and one negative test where it makes sense.
