import { describe, expect, test } from 'vitest';
import browserslist from 'browserslist';
import {
  parseBrowserbug,
  type ParseResult,
  type WebFeaturesData,
} from './parser/parser.js';
import { getWebFeatureSupportStatus } from './getWebFeatureSupportStatus.js';
import { webFeatures as realWebFeatures } from './webFeaturesData.js';

const fixture: WebFeaturesData = {
  'scrollend': {
    kind: 'feature',
    status: {
      support: {
        chrome: '114',
        chrome_android: '114',
        edge: '114',
        firefox: '109',
        firefox_android: '109',
        safari: '26.2',
        safari_ios: '26.2',
      },
    },
  },
  'old-thing': {
    kind: 'feature',
    status: { support: { chrome: '≤80', safari: '≤13' } },
  },
  'chrome-only': {
    kind: 'feature',
    status: { support: { chrome: '120' } },
  },
  'renamed-thing': { kind: 'moved', redirect_target: 'scrollend' },
  'split-thing': {
    kind: 'split',
    redirect_targets: ['scrollend', 'chrome-only'],
  },
};

describe('parser: web-feature descriptors', () => {
  test('parses a web-feature descriptor', () => {
    expect(
      parseBrowserbug(
        '@browserbug web-feature scrollend -- Debounced scroll fallback',
        browserslist.data,
        { webFeatures: fixture },
      ),
    ).toEqual<ParseResult>({
      success: true,
      data: [{ webFeature: 'scrollend' }],
    });
  });

  test('mixes with browser descriptors', () => {
    expect(
      parseBrowserbug(
        '@browserbug web-feature scrollend, safari last-checked 18.0',
        browserslist.data,
        { webFeatures: fixture },
      ),
    ).toEqual<ParseResult>({
      success: true,
      data: [
        { webFeature: 'scrollend' },
        { browser: 'safari', comparator: 'last-checked', version: 18 },
      ],
    });
  });

  test('rejects unknown, moved and split ids with guidance', () => {
    const parse = (id: string) =>
      parseBrowserbug(`@browserbug web-feature ${id}`, browserslist.data, {
        webFeatures: fixture,
      });

    expect(parse('nope')).toMatchObject({
      success: false,
      error: [
        { shortMessage: expect.stringContaining('Unknown web-feature nope') },
      ],
    });
    expect(parse('renamed-thing')).toMatchObject({
      success: false,
      error: [
        { shortMessage: expect.stringContaining('Use scrollend instead') },
      ],
    });
    expect(parse('split-thing')).toMatchObject({
      success: false,
      error: [
        {
          shortMessage: expect.stringContaining(
            'Use one of scrollend, chrome-only instead',
          ),
        },
      ],
    });
  });

  test('rejects inherited object keys as ids', () => {
    expect(
      parseBrowserbug(
        '@browserbug web-feature constructor',
        browserslist.data,
        {
          webFeatures: fixture,
        },
      ),
    ).toHaveProperty('success', false);
  });

  test('requires web-features data', () => {
    expect(
      parseBrowserbug('@browserbug web-feature scrollend', browserslist.data),
    ).toMatchObject({
      success: false,
      error: [
        { shortMessage: expect.stringContaining('no web-features data') },
      ],
    });
  });

  test('requires a feature id', () => {
    expect(
      parseBrowserbug('@browserbug web-feature', browserslist.data, {
        webFeatures: fixture,
      }),
    ).toHaveProperty('success', false);
  });

  test('"web-feature" is not a browser name', () => {
    expect(
      parseBrowserbug('@browserbug web-feature equal 120', browserslist.data, {
        webFeatures: fixture,
      }),
    ).toHaveProperty('success', false);
  });
});

describe('getWebFeatureSupportStatus', () => {
  const status = (feature: string, targets: string[]) =>
    getWebFeatureSupportStatus({ webFeature: feature }, targets, fixture);

  test('still needed while a target lacks the feature', () => {
    expect(
      status('scrollend', ['chrome 120', 'chrome 109', 'ios_saf 18.5-18.7']),
    ).toEqual({
      supported: true,
      blockers: [
        { browser: 'ios_saf', lowestVersion: 18.5, supportedSince: 26.2 },
        { browser: 'chrome', lowestVersion: 109, supportedSince: 114 },
      ],
    });
  });

  test('outdated once every target supports the feature', () => {
    expect(
      status('scrollend', ['chrome 120', 'safari 26.2', 'firefox 140']),
    ).toEqual({
      supported: false,
      blockers: [],
    });
  });

  test('missing support data blocks', () => {
    expect(status('chrome-only', ['chrome 130', 'firefox 140'])).toEqual({
      supported: true,
      blockers: [
        { browser: 'firefox', lowestVersion: 140, supportedSince: null },
      ],
    });
  });

  test('treats "≤" versions as the version itself', () => {
    expect(status('old-thing', ['chrome 80', 'safari 13'])).toEqual({
      supported: false,
      blockers: [],
    });
    expect(status('old-thing', ['chrome 79'])).toMatchObject({
      supported: true,
    });
  });

  test('ignores targets that web-features has no data for', () => {
    expect(
      status('scrollend', ['samsung 20', 'op_mini all', 'chrome 120']),
    ).toEqual({
      supported: false,
      blockers: [],
    });
  });
});

describe('webFeatures', () => {
  test('loads the real dataset, which the parser and status accept', () => {
    const webFeatures = realWebFeatures;
    expect(webFeatures['scrollend']).toMatchObject({ kind: 'feature' });

    const parsed = parseBrowserbug(
      '@browserbug web-feature scrollend',
      browserslist.data,
      { webFeatures },
    );
    expect(parsed).toMatchObject({ success: true });

    expect(
      getWebFeatureSupportStatus(
        { webFeature: 'scrollend' },
        ['chrome 109'],
        webFeatures,
      ),
    ).toMatchObject({ supported: true });
  });
});
