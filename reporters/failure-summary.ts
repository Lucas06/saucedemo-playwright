import fs from 'node:fs';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

/**
 * Writes a compact digest of every failed test to `reports/failure-summary.md`
 * plus a machine-readable twin, `reports/failure-summary.json`.
 *
 * For each failure it answers, without opening the HTML report:
 *   - which step failed (marked `✘ ... <-- FAILED HERE`),
 *   - which steps ran before it, nested, with durations,
 *   - the error message and source snippet,
 *   - where the trace / screenshot / video / browser events live.
 *
 * With retries enabled, only the last attempt of each test is reported (with the attempt count),
 * and tests that failed but then passed on retry are listed separately as flaky.
 *
 * Meant to be the first thing a human (in CI logs) or an AI agent reads when a run goes red.
 */

const STEP_CATEGORIES = new Set(['test.step', 'pw:api', 'expect']);
const ANSI = /\u001b\[[0-9;]*m/g;

interface StepLine {
  depth: number;
  title: string;
  /** `interrupted` = the step never finished (timeout, crash, worker exit). */
  status: 'passed' | 'failed' | 'interrupted';
  durationMs: number;
  location?: string;
}

interface FailureRecord {
  test: string;
  file: string;
  project: string;
  attempts: number;
  status: TestResult['status'];
  failedStep?: StepLine;
  steps: StepLine[];
  error: string;
  snippet?: string;
  attachments: Record<string, string>;
}

export default class FailureSummaryReporter implements Reporter {
  private readonly outputDir: string;
  private readonly redact: string[];
  /** Keyed by test id so a retry replaces the previous attempt instead of duplicating it. */
  private readonly failures = new Map<string, FailureRecord>();
  private readonly flaky: { test: string; file: string; attempts: number }[] = [];
  private rootDir = process.cwd();

  /**
   * @param options.outputDir where the summary files are written (default `reports`).
   * @param options.redact secret values to mask in step titles and errors (e.g. passwords typed by `fill`).
   */
  constructor(options: { outputDir?: string; redact?: string[] } = {}) {
    this.outputDir = options.outputDir ?? 'reports';
    this.redact = (options.redact ?? []).filter(Boolean);
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig): void {
    this.rootDir = config.configFile ? path.dirname(config.configFile) : config.rootDir;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const title = test.titlePath().filter(Boolean).slice(2).join(' › ');
    const file = this.relative(test.location.file, test.location.line);

    if (result.status === test.expectedStatus) {
      if (this.failures.delete(test.id)) {
        this.flaky.push({ test: title, file, attempts: result.retry + 1 });
      }
      return;
    }

    const steps: StepLine[] = [];
    const walk = (list: TestStep[], depth: number) => {
      for (const s of list) {
        if (!STEP_CATEGORIES.has(s.category)) {
          // Hooks and fixtures are flattened, but what happened inside them is kept.
          walk(s.steps, depth);
          continue;
        }
        steps.push({
          depth,
          title: this.mask(s.title),
          status: s.error ? 'failed' : s.duration < 0 ? 'interrupted' : 'passed',
          durationMs: Math.max(s.duration, 0),
          location: s.location ? this.relative(s.location.file, s.location.line) : undefined,
        });
        walk(s.steps, depth + 1);
      }
    };
    walk(result.steps, 0);

    // The deepest failed (or, failing that, unfinished) step is the most precise point of failure.
    const failedStep =
      steps.findLast((s) => s.status === 'failed') ??
      steps.findLast((s) => s.status === 'interrupted');
    const error = result.errors[0] ?? result.error;

    this.failures.set(test.id, {
      test: title,
      file,
      project: test.parent.project()?.name ?? '',
      attempts: result.retry + 1,
      status: result.status,
      failedStep,
      steps,
      error: this.mask(strip(error?.message ?? error?.value ?? 'Unknown error')),
      snippet: error?.snippet ? this.mask(strip(error.snippet)) : undefined,
      attachments: Object.fromEntries(
        result.attachments.flatMap((a) => (a.path ? [[a.name, this.relative(a.path)]] : [])),
      ),
    });
  }

  onEnd(result: FullResult): void {
    fs.mkdirSync(this.outputDir, { recursive: true });
    const mdPath = path.join(this.outputDir, 'failure-summary.md');
    fs.writeFileSync(
      path.join(this.outputDir, 'failure-summary.json'),
      JSON.stringify(
        { status: result.status, failures: [...this.failures.values()], flaky: this.flaky },
        null,
        2,
      ),
    );
    fs.writeFileSync(mdPath, this.toMarkdown(result));

    if (this.failures.size > 0) {
      console.log(`\n${this.failures.size} failure(s) summarised in ${mdPath}`);
    }
  }

  private toMarkdown(result: FullResult): string {
    const flaky = this.flaky.length
      ? [
          '## Flaky (failed, then passed on retry)',
          '',
          ...this.flaky.map((f) => `- ${f.test} (\`${f.file}\`, ${f.attempts} attempts)`),
          '',
        ].join('\n')
      : '';
    if (this.failures.size === 0) {
      return `# Test run: ${result.status}\n\nNo failures.\n${flaky ? `\n${flaky}` : ''}`;
    }

    const sections = [...this.failures.values()].map((f, i) => {
      const steps = f.steps
        .map((s) => {
          const marker = { passed: '✔', failed: '✘', interrupted: '⏸' }[s.status];
          const timing = s.status === 'interrupted' ? 'did not finish' : `${s.durationMs}ms`;
          const here = s === f.failedStep ? '   <-- FAILED HERE' : '';
          return `${'  '.repeat(s.depth)}${marker} ${s.title} (${timing})${here}`;
        })
        .join('\n');
      const attachments = Object.entries(f.attachments)
        .map(([name, p]) => `- **${name}**: \`${p}\``)
        .join('\n');
      const failedAt = f.failedStep
        ? `${f.failedStep.title}${f.failedStep.location ? ` (\`${f.failedStep.location}\`)` : ''}`
        : '(outside any step — check hooks/fixtures)';

      return [
        `## ${i + 1}. ${f.test}`,
        '',
        `- **File**: \`${f.file}\``,
        `- **Project**: ${f.project} · **Attempts**: ${f.attempts} · **Status**: ${f.status}`,
        `- **Failed step**: ${failedAt}`,
        '',
        '### Steps',
        '```',
        steps || '(no steps recorded)',
        '```',
        '',
        '### Error',
        '```',
        f.error,
        '```',
        ...(f.snippet ? ['', '### Source', '```', f.snippet, '```'] : []),
        '',
        '### Artifacts',
        attachments || '(none)',
        ...(f.attachments.trace
          ? ['', `Open the trace: \`npx playwright show-trace ${f.attachments.trace}\``]
          : []),
        '',
      ].join('\n');
    });

    const body = sections.join('\n---\n\n');
    return `# Test run: ${result.status} — ${this.failures.size} failure(s)\n\n${body}${flaky ? `\n---\n\n${flaky}` : ''}`;
  }

  private mask(text: string): string {
    return this.redact.reduce((acc, secret) => acc.split(secret).join('***'), text);
  }

  private relative(file: string, line?: number): string {
    const rel = path.relative(this.rootDir, file).split(path.sep).join('/');
    return line ? `${rel}:${line}` : rel;
  }
}

function strip(text: string): string {
  return text.replace(ANSI, '');
}
