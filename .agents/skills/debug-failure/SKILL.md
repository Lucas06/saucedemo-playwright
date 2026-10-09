---
name: debug-failure
description: Diagnose and fix a failing Playwright test in this repo using the failure summary, error context, browser events and trace. Use when a test run is red or the user pastes a failure.
---

# Debug a failing test

1. **Reproduce narrowly**: `npx playwright test <file> -g "<test title>"`.
   (If `reports/failure-summary.md` is already fresh from the failing run, you can skip this.)
2. **Read `reports/failure-summary.md`.** For each failure, note:
   - the step marked `<-- FAILED HERE` and its source location,
   - the steps that passed before it (how far the flow got),
   - the error type: assertion mismatch (expected vs received), `TimeoutError` waiting for a
     locator, navigation error, or crash.
3. **Gather context** from the paths listed under _Artifacts_:
   - `error-context.md`: ARIA snapshot at failure time. Does the element exist? Is the text different?
   - `browser-events.json` (if attached): JS errors, failed requests, HTTP 4xx/5xx.
   - Trace (`npx playwright show-trace …`) when the above is not enough.
   - If needed, open the live page with the `playwright-test` MCP and use `browser_generate_locator`.
4. **Classify the root cause, then act**:
   | Cause                                          | Fix                                                                 |
   | ---------------------------------------------- | ------------------------------------------------------------------- |
   | Locator no longer matches                      | Update the locator in the page object (`src/pages`)                 |
   | UI copy changed intentionally                  | Update the constant in `src/data/messages.ts`                       |
   | Test logic wrong / race                        | Fix the spec. Use web-first assertions, never `waitForTimeout`      |
   | Real app bug                                   | Do not "fix" the test. Report it with the failing step and evidence |
   | Environment (page crash, worker exit, network) | Report it. Suggest `WORKERS=1` for memory issues                    |
5. **Verify**: re-run the test (use `--repeat-each=3` for suspected flakiness) and `npm run check`.
6. **Report** in one short paragraph: failing step, root cause, the change made (or why none).
