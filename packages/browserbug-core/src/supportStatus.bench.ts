/**
 * Benchmarks for the work the lint rules do per `@browserbug` comment after
 * parsing, and once per file, against realistic browserslist targets.
 *
 * Run with `pnpm --filter @woltapp/browserbug-core bench`. See
 * CONTRIBUTING.md.
 */
import browserslist from 'browserslist';
import { expect, test } from 'vitest';
import { getBrowserSupportStatus } from './getBrowserSupportStatus.js';
import { getLastCheckedStatus } from './getLastCheckedStatus.js';
import { getWebFeatureSupportStatus } from './getWebFeatureSupportStatus.js';
import type {
  BrowserDescriptor,
  WebFeatureDescriptor,
} from './parser/parser.js';
import { webFeatures } from './webFeaturesData.js';

/** A typical application query, and a wide one with many more targets. */
const queries = {
  defaults: 'defaults',
  wide: '> 0.1%, last 4 versions, Firefox ESR, not dead',
} as const;

const targets = {
  defaults: browserslist(queries.defaults),
  wide: browserslist(queries.wide),
};

const browserDescriptor: BrowserDescriptor = {
  browser: 'safari',
  comparator: 'lower-than',
  version: 17,
};

const lastCheckedDescriptor: BrowserDescriptor = {
  browser: 'firefox',
  comparator: 'last-checked',
  version: 128,
};

const webFeatureDescriptor: WebFeatureDescriptor = {
  webFeature: 'container-queries',
};

test('benchmark targets are non-trivial', () => {
  expect(targets.defaults.length).toBeGreaterThan(10);
  expect(targets.wide.length).toBeGreaterThan(targets.defaults.length);
});

for (const [name, supportTargets] of Object.entries(targets)) {
  test(`per comment, ${name} targets (${supportTargets.length})`, async ({
    bench,
  }) => {
    await bench.compare(
      bench('getBrowserSupportStatus', () => {
        getBrowserSupportStatus(browserDescriptor, supportTargets);
      }),
      bench('getLastCheckedStatus', () => {
        getLastCheckedStatus(lastCheckedDescriptor, supportTargets);
      }),
      bench('getWebFeatureSupportStatus', () => {
        getWebFeatureSupportStatus(
          webFeatureDescriptor,
          supportTargets,
          webFeatures,
        );
      }),
    );
  });
}

// The rules resolve the query once per file (in `create`), not per comment.
// browserslist memoizes results by query, so this measures the cached path
// that every file after the first takes. The first call takes milliseconds.
test('per file, browserslist(query)', async ({ bench }) => {
  await bench.compare(
    ...Object.entries(queries).map(([name, query]) =>
      bench(name, () => {
        browserslist(query);
      }),
    ),
  );
});
