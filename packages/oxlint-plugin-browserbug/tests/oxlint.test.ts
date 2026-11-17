import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * These tests run the real `oxlint` binary against fixture projects, with the
 * built plugin (`dist/`) loaded through `jsPlugins`. Run `pnpm build` first.
 */

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const packageDir = fileURLToPath(new URL('..', import.meta.url));
const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));
const oxlintBin = path.join(
  path.dirname(require.resolve('oxlint/package.json')),
  'bin',
  'oxlint',
);

interface OxlintDiagnostic {
  message: string;
  code: string;
  severity: string;
  filename: string;
  labels: { span: { line: number; column: number } }[];
}

async function runOxlint(fixture: string, args: string[] = []) {
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [oxlintBin, '--format', 'json', ...args],
      { cwd: path.join(fixturesDir, fixture) },
    );
    return parse(stdout);
  } catch (error) {
    // oxlint exits with 1 when it reports errors; the JSON is still on stdout
    const { stdout, stderr } = error as { stdout?: string; stderr?: string };
    if (!stdout) {
      throw new Error(`oxlint failed without output:\n${stderr}`, {
        cause: error,
      });
    }
    return parse(stdout);
  }
}

function parse(stdout: string) {
  const { diagnostics } = JSON.parse(stdout) as {
    diagnostics: OxlintDiagnostic[];
  };
  return diagnostics
    .map((d) => ({
      code: d.code,
      severity: d.severity,
      filename: d.filename,
      line: d.labels[0]?.span.line,
      message: d.message,
    }))
    .sort((a, b) =>
      a.filename === b.filename
        ? (a.line ?? 0) - (b.line ?? 0)
        : a.filename.localeCompare(b.filename),
    );
}

beforeAll(() => {
  if (!existsSync(path.join(packageDir, 'dist', 'index.js'))) {
    throw new Error(
      'The oxlint tests load the built plugin. Run `pnpm build` first.',
    );
  }
});

describe('oxlint jsPlugins', () => {
  it('reports outdated declarations, using `settings.browserslistQuery`', async () => {
    const diagnostics = await runOxlint('settings');

    // Nothing from still-relevant.ts or disabled.js
    expect(diagnostics.map((d) => d.filename)).toEqual(
      Array(5).fill('outdated.js'),
    );
    expect(
      diagnostics.every(
        (d) => d.code === 'browserbug(no-outdated)' && d.severity === 'error',
      ),
    ).toBe(true);
    expect(diagnostics.map((d) => [d.line, d.message])).toEqual([
      [
        1,
        'Outdated @browserbug declaration. The lowest supported version for chrome is 120, but the declaration resolves to 110.',
      ],
      [
        4,
        'Outdated @browserbug declaration. The lowest supported version for firefox is 130, but the declaration resolves to 100.',
      ],
      [
        10,
        'Outdated @browserbug declaration. Browser safari is not in the list of supported browsers.',
      ],
      [
        13,
        'Outdated @browserbug declaration. Every supported browser supports the web-feature scrollend.',
      ],
      [16, expect.stringMatching(/^@browserbug parsing error: /)],
    ]);
  });

  it('resolves the browserslist config relative to the working directory', async () => {
    const diagnostics = await runOxlint('browserslistrc');

    expect(diagnostics).toEqual([
      {
        code: 'browserbug(no-outdated)',
        severity: 'error',
        filename: 'outdated.js',
        line: 1,
        message:
          'Outdated @browserbug declaration. The lowest supported version for chrome is 120, but the declaration resolves to 110.',
      },
    ]);
  });

  it('runs last-checked-updated, with its `versionDrift` option', async () => {
    const diagnostics = await runOxlint('last-checked');

    expect(diagnostics).toEqual([
      {
        code: 'browserbug(last-checked-updated)',
        severity: 'warning',
        filename: 'last-checked.js',
        line: 1,
        message:
          '@browserbug declaration was last checked in chrome 120, but browserslist targets chrome 122. Check whether the bug still exists, and update or remove the declaration.',
      },
    ]);
  });
});
