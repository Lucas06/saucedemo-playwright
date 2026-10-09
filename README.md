# saucedemo-playwright

End-to-end test automation framework for [saucedemo.com](https://www.saucedemo.com), built with
**Playwright Test + TypeScript**. It is designed around three goals:

1. **Modular architecture with enforced conventions.** Page Objects injected as fixtures, centralised data/config, and lint rules that keep specs clean.
2. **Actionable reporting.** Each failure tells you _which step_ broke, _what ran before it_, and _where the evidence is_.
3. **AI-agent ready.** `AGENTS.md`, agent skills, Playwright's planner/generator/healer agents and an MCP server, all wired to the same conventions.

## Quick start

```bash
npm ci
npx playwright install chromium
cp .env.example .env          # optional, defaults target the public demo
npm test
npm run report                # opens the HTML report
```

| Script                                           | What it does                                      |
| ------------------------------------------------ | ------------------------------------------------- |
| `npm test`                                       | Run all tests                                     |
| `npm run test:smoke`                             | Only `@smoke` tests                               |
| `npm run test:headed` / `test:ui` / `test:debug` | Watch, explore or step through tests              |
| `npm run report`                                 | Open the HTML report                              |
| `npm run check`                                  | Typecheck + lint + format check (also runs in CI) |

## Architecture

```
src/
├── config/          # env-driven settings (BASE_URL, password, WORKERS): the only reader of process.env
├── data/            # users.ts (accounts), messages.ts (expected UI copy)
├── pages/           # Page Objects: BasePage, LoginPage, InventoryPage
├── fixtures/        # custom `test`: injects page objects, auto-captures browser events
└── utils/           # @step decorator
reporters/
└── failure-summary.ts   # custom reporter → reports/failure-summary.{md,json}
tests/
├── auth/login.spec.ts   # login: positive + negative (+ data-driven validations)
└── seed.spec.ts         # starting state for AI agents / sanity check
specs/                   # markdown test plans (human- or agent-written)
```

```
spec ──uses──▶ fixtures (@fixtures) ──inject──▶ page objects (@pages) ──wrap actions in──▶ @step
  │                                                      │
  └──reads──▶ data (@data) ◀──secrets from── config (@config)
```

**Key decisions**

- **Page objects as fixtures.** Specs ask for `loginPage` and `inventoryPage` in the test signature instead of constructing them. This removes boilerplate and makes page dependencies explicit.
- **`@step` decorator.** Every page-object action appears as a named step (`Log in as "standard_user"`) in the HTML report, the trace and the failure summary, with the Playwright actions nested inside it.
- **`data-test` as the test id.** `testIdAttribute: 'data-test'` makes `getByTestId()` hit saucedemo's stable hooks, and `getByRole` is the fallback.
- **Assertions live in specs**, so page objects stay reusable across positive and negative scenarios.
- **Data and expected copy are constants** (`src/data`). A copy change is a one-line fix.
- **Path aliases** (`@pages`, `@fixtures`, …) keep imports stable as the tree grows.

**Enforced by ESLint** (`eslint.config.mjs`). In specs it forbids raw locators, `new XPage()`, importing `test` from `@playwright/test`, `waitForTimeout`, `force: true` and `.only`, and it requires web-first assertions. Everywhere, it flags floating promises (missing `await`).

## Reporting & debugging

Every run produces:

| Output                                               | Purpose                                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Console (`list` locally, `github` annotations in CI) | Live progress                                                                                         |
| `reports/html/`                                      | Full interactive report with nested steps, screenshots, video and trace                               |
| `reports/junit.xml`                                  | CI/test-management integration                                                                        |
| **`reports/failure-summary.md` / `.json`**           | One-glance digest of every failure (below)                                                            |
| `test-results/<test>/`                               | On failure: `trace.zip`, screenshot, video, `error-context.md` (ARIA snapshot), `browser-events.json` |

The failure summary answers _where did it fail and what happened before?_ without opening anything else:

```
## 1. Login › locked out user is rejected with an explanatory error

- File: tests/auth/login.spec.ts:21
- Failed step: Expect "toHaveText" (tests/auth/login.spec.ts:27)

### Steps
✔ LoginPage.open (402ms)
  ✔ Navigate (387ms)
✔ Log in as "locked_out_user" (236ms)
  ✔ Fill "locked_out_user" (97ms)
  ✔ Fill "***" (51ms)
  ✔ Click (75ms)
✘ Expect "toHaveText" (5016ms)   <-- FAILED HERE

### Error
Expected: "Epic sadface: Sorry, this user has been ..."
Received: "Epic sadface: Sorry, this user has been locked out."

### Artifacts
- trace: test-results/…/trace.zip  →  npx playwright show-trace …
- screenshot, video, error-context
```

- Steps that never finished (timeouts, crashes) are marked `⏸ did not finish`.
- With retries (CI runs up to 3 attempts), each test appears once with its attempt count, and tests that passed on retry are listed under **Flaky**.
- Secrets (the password) are masked in step titles and errors.
- In CI the summary is also posted to the **GitHub job summary page**, and reports and traces are uploaded as artifacts.
- The `browserEvents` auto-fixture records console errors, uncaught exceptions, failed requests and HTTP ≥ 400 responses, and attaches them **only when the test fails**.

## AI agent support

| Asset                          | Purpose                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)       | Conventions, commands, layout, debugging order and definition of done. Read by most AI coding agents                                |
| `.agents/skills/`              | Step-by-step recipes: `new-test`, `new-page-object`, `debug-failure`                                                                |
| `.agents/agents/`              | Playwright's official **planner → generator → healer** agents (`npx playwright init-agents`), extended with this repo's conventions |
| `.mcp.json`                    | `playwright-test` MCP server. The agent can drive a real browser, read snapshots, generate locators and run/debug tests             |
| `reports/failure-summary.json` | Structured failure data an agent can parse directly                                                                                 |
| ESLint rules                   | Fast, deterministic feedback that keeps agent-written code within the conventions                                                   |

Typical agent loop: _plan_ (`specs/*.md`) → _generate_ a spec → refactor into page objects (lint guides it) → _run_ → on failure, read `failure-summary.md` → _heal_.

## Configuration

| Variable         | Default                     | Notes                                                    |
| ---------------- | --------------------------- | -------------------------------------------------------- |
| `BASE_URL`       | `https://www.saucedemo.com` | Target environment                                       |
| `SAUCE_PASSWORD` | `secret_sauce`              | Shared password for demo users                           |
| `WORKERS`        | 50% of CPU cores            | Use `1`/`2` on memory-constrained machines               |
| `CI`             | –                           | Enables retries (2), `forbidOnly` and GitHub annotations |

Only Chromium is enabled by default. Firefox/WebKit projects are ready to uncomment in `playwright.config.ts`.

## Test cases

| Test                                                                       | Type                   | Tags                     |
| -------------------------------------------------------------------------- | ---------------------- | ------------------------ |
| Standard user can log in and lands on the inventory                        | Positive               | `@auth @smoke @positive` |
| Locked out user is rejected with an explanatory error                      | Negative               | `@auth @smoke @negative` |
| Validation error for unknown credentials / empty username / empty password | Negative (data-driven) | `@auth @negative`        |
