/**
 * Benchmarks for `parseBrowserbug`, which the lint rules call for every
 * `@browserbug` comment in every linted file.
 *
 * Run with `pnpm --filter @woltapp/browserbug-core bench`. See
 * CONTRIBUTING.md.
 */
import browserslist from 'browserslist';
import { expect, test } from 'vitest';
import grammar from './grammar/browserbug.ohm-bundle.js';
import { parseBrowserbug } from './parser.js';
import { webFeatures } from '../webFeaturesData.js';

/** Inputs as the rules pass them: from the opener to the end of the line. */
const inputs = {
  'simple descriptor': '@browserbug safari lower-than 17',
  'major.minor version': '@browserbug safari lte 16.4',
  'version range': '@browserbug safari between 15.4 16.1',
  'last-checked': '@browserbug firefox last-checked 128',
  'web-feature': '@browserbug web-feature container-queries',
  'several descriptors, with comment':
    '@browserbug safari lower-than 17, chrome lte 120, firefox last-checked 128, web-feature has -- Layout jumps when the keyboard opens',
  'syntax error': '@browserbug safari lesser-than 17',
  'unknown browser': '@browserbug netscape lower-than 4',
} as const;

const parse = (input: string) =>
  parseBrowserbug(input, browserslist.data, { webFeatures });

test('benchmark inputs parse as expected', () => {
  for (const [name, input] of Object.entries(inputs)) {
    const shouldFail = name === 'syntax error' || name === 'unknown browser';
    expect(parse(input).success, name).toBe(!shouldFail);
  }
});

test('parseBrowserbug', async ({ bench }) => {
  await bench.compare(
    ...Object.entries(inputs).map(([name, input]) =>
      bench(name, () => {
        parse(input);
      }),
    ),
  );
});

// Splits one parse into its stages, to show where the time goes. The
// difference between `grammar.match` and a full parse is semantics plus
// validation against browserslist.data and web-features.
test('parseBrowserbug stages', async ({ bench }) => {
  const simple = inputs['simple descriptor'];
  const input = inputs['several descriptors, with comment'];
  const failing = inputs['syntax error'];

  await bench.compare(
    bench('grammar.match only (simple)', () => {
      grammar.match(simple);
    }),
    bench('full parse (simple)', () => {
      parse(simple);
    }),
    bench('grammar.match only (several)', () => {
      grammar.match(input);
    }),
    bench('full parse (several)', () => {
      parse(input);
    }),
    bench('grammar.match only (syntax error)', () => {
      grammar.match(failing);
    }),
    bench('full parse (syntax error)', () => {
      parse(failing);
    }),
  );
});
