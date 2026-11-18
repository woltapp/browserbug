import { describe, expect, it } from 'vitest';
import * as eslint10 from 'eslint';
import * as eslint9 from 'eslint9';
import plugin from '../../lib/index.js';
import pkg from '../../package.json' with { type: 'json' };

const outdatedCode = '// @browserbug chrome lower-than 110\n';
const settings = { browserslistQuery: 'chrome 120' };

describe('plugin object', () => {
  it('has meta', () => {
    expect(plugin.meta).toEqual({
      name: '@woltapp/eslint-plugin-browserbug',
      version: pkg.version,
      namespace: 'browserbug',
    });
  });

  it('exposes rules at the top level', () => {
    expect(Object.keys(plugin.rules)).toEqual([
      'last-checked-updated',
      'no-outdated',
    ]);
  });

  it('references itself from configs.recommended', () => {
    expect(plugin.configs.recommended.plugins?.browserbug).toBe(plugin);
  });

  it('keeps the `plugin` alias', () => {
    expect(plugin.plugin).toBe(plugin);
  });
});

// Run the plugin through each supported ESLint major, with the same configs a
// user would write. The rule's own behaviour is covered by RuleTester (which
// runs against the `eslint` devDependency, ESLint 10).
const majors = [
  {
    major: '9',
    version: eslint9.Linter.version,
    // The plugin's types come from the `eslint` devDependency (ESLint 10). For
    // ESLint 9 users, they resolve against ESLint 9's types instead.
    verify: (code: string, config: eslint10.Linter.Config[]) =>
      new eslint9.Linter({ configType: 'flat' }).verify(
        code,
        config as eslint9.Linter.Config[],
      ),
  },
  {
    major: '10',
    version: eslint10.Linter.version,
    verify: (code: string, config: eslint10.Linter.Config[]) =>
      new eslint10.Linter({ configType: 'flat' }).verify(code, config),
  },
];

describe.each(majors)('ESLint $major', ({ major, version, verify }) => {
  it('runs on the expected ESLint major', () => {
    expect(version.split('.')[0]).toBe(major);
  });

  it('reports with configs.recommended', () => {
    const messages = verify(outdatedCode, [
      plugin.configs.recommended,
      { settings },
    ]);
    expect(messages).toMatchObject([
      { ruleId: 'browserbug/no-outdated', messageId: 'outdated', severity: 2 },
    ]);
  });

  it('reports when combining configs.recommended with the plugin itself', () => {
    const messages = verify(outdatedCode, [
      plugin.configs.recommended,
      {
        plugins: { browserbug: plugin },
        rules: { 'browserbug/no-outdated': 'warn' },
        settings,
      },
    ]);
    expect(messages).toMatchObject([
      { ruleId: 'browserbug/no-outdated', severity: 1 },
    ]);
  });

  it('does not report supported workarounds', () => {
    const messages = verify(outdatedCode, [
      plugin.configs.recommended,
      { settings: { browserslistQuery: 'chrome 109' } },
    ]);
    expect(messages).toEqual([]);
  });
});
