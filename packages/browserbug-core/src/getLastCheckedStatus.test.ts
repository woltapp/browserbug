import { describe, expect, test } from 'vitest';
import { getLastCheckedStatus } from './getLastCheckedStatus.js';
import type { BrowserDescriptor } from './parser/parser.js';

describe('getLastCheckedStatus', () => {
  test('reports a newer targeted version', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'chrome', comparator: 'last-checked', version: 120 },
        ['chrome 122', 'chrome 121', 'firefox 130'],
      ),
    ).toEqual({ updated: true, lastCheckedVersion: 120, highestVersion: 122 });
  });

  test('uses the highest version, regardless of target order', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'chrome', comparator: 'last-checked', version: 120 },
        ['chrome 119', 'chrome 123', 'chrome 121'],
      ),
    ).toEqual({ updated: true, lastCheckedVersion: 120, highestVersion: 123 });
  });

  test('does not report when the checked version is the newest target', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'chrome', comparator: 'last-checked', version: 122 },
        ['chrome 122', 'chrome 121'],
      ),
    ).toEqual({ updated: false });
  });

  test('does not report when the checked version is newer than every target', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'chrome', comparator: 'last-checked', version: 130 },
        ['chrome 122'],
      ),
    ).toEqual({ updated: false });
  });

  test('reports when every target is newer than the checked version', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'firefox', comparator: 'last-checked', version: 100 },
        ['firefox 120', 'firefox 119'],
      ),
    ).toEqual({ updated: true, lastCheckedVersion: 100, highestVersion: 120 });
  });

  test('does not report browsers that are not targeted', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'safari', comparator: 'last-checked', version: 17 },
        ['chrome 122'],
      ),
    ).toEqual({ updated: false });
  });

  test('compares minor versions', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'safari', comparator: 'last-checked', version: 17.2 },
        ['safari 17.4', 'safari 17.2'],
      ),
    ).toEqual({
      updated: true,
      lastCheckedVersion: 17.2,
      highestVersion: 17.4,
    });
    expect(
      getLastCheckedStatus(
        { browser: 'safari', comparator: 'last-checked', version: 17.4 },
        ['safari 17.4', 'safari 17.2'],
      ),
    ).toEqual({ updated: false });
  });

  test('handles version ranges and non-numeric versions', () => {
    expect(
      getLastCheckedStatus(
        { browser: 'ios_saf', comparator: 'last-checked', version: 15.2 },
        ['ios_saf 15.2-15.3'],
      ),
    ).toEqual({ updated: false });
    expect(
      getLastCheckedStatus(
        { browser: 'safari', comparator: 'last-checked', version: 18 },
        ['safari TP', 'safari 18.1'],
      ),
    ).toEqual({ updated: true, lastCheckedVersion: 18, highestVersion: 18.1 });
    expect(
      getLastCheckedStatus(
        { browser: 'safari', comparator: 'last-checked', version: 18 },
        ['safari TP'],
      ),
    ).toEqual({ updated: false });
  });

  test.each<BrowserDescriptor>([
    { browser: 'chrome', comparator: 'lower-than', version: 100 },
    { browser: 'chrome', comparator: 'lt', version: 100 },
    { browser: 'chrome', comparator: 'lower-than-or-equal', version: 100 },
    { browser: 'chrome', comparator: 'lte', version: 100 },
    { browser: 'chrome', comparator: 'equal', version: 100 },
    { browser: 'chrome', comparator: 'between', version: [90, 100] },
  ])('ignores the $comparator comparator', (descriptor) => {
    expect(getLastCheckedStatus(descriptor, ['chrome 122'])).toEqual({
      updated: false,
    });
  });
});
