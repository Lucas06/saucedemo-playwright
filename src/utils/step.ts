import { test } from '@playwright/test';

/**
 * Wraps a page-object method in `test.step` so it shows up as a named, nested step
 * in the HTML report, the trace viewer and `reports/failure-summary.md`.
 *
 * The title may reference arguments by index and property path:
 * `@step('Log in as {0.username}')`. Only interpolate non-sensitive values — titles end up in reports.
 * Without a title, `ClassName.methodName` is used.
 */
export function step<This extends object, Args extends unknown[], Return>(title?: string) {
  return function decorator(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    return function replacement(this: This, ...args: Args): Promise<Return> {
      const name = title
        ? interpolate(title, args)
        : `${this.constructor.name}.${String(context.name)}`;
      return test.step(name, () => target.call(this, ...args));
    };
  };
}

function interpolate(template: string, args: unknown[]): string {
  return template.replace(/\{(\d+)((?:\.\w+)*)\}/g, (_, index: string, path: string) => {
    let value: unknown = args[Number(index)];
    for (const key of path.split('.').filter(Boolean)) {
      value = (value as Record<string, unknown> | undefined)?.[key];
    }
    return String(value);
  });
}
