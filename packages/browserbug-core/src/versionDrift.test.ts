import { describe, expect, test } from 'vitest';
import browserslist from 'browserslist';
import {
  getVersionDriftStatus,
  isValidVersionDrift,
  type ReleasedVersionsData,
} from './versionDrift.js';

const data: ReleasedVersionsData = {
  chrome: { released: ['118', '119', '120', '121', '122', '123'] },
  safari: {
    released: ['17.0', '17.1', '17.2', '17.3', '17.4', '17.5', '17.6', '18.0'],
  },
  op_mini: { released: ['all'] },
};

describe('getVersionDriftStatus', () => {
  test('no drift when the version is the reference', () => {
    expect(
      getVersionDriftStatus({
        browser: 'chrome',
        version: 120,
        referenceVersion: 120,
        browserslistData: data,
      }),
    ).toEqual({ drift: 0, withinVersionDrift: true });
  });

  test('no drift when the version is newer than the reference', () => {
    expect(
      getVersionDriftStatus({
        browser: 'chrome',
        version: 122,
        referenceVersion: 120,
        browserslistData: data,
      }),
    ).toEqual({ drift: 0, withinVersionDrift: true });
  });

  test('defaults to no tolerated drift', () => {
    expect(
      getVersionDriftStatus({
        browser: 'chrome',
        version: 120,
        referenceVersion: 121,
        browserslistData: data,
      }),
    ).toEqual({ drift: 1, withinVersionDrift: false });
  });

  test.each([
    [1, false],
    [2, true],
    [3, true],
  ])('drift of 2 with versionDrift %i → within: %s', (versionDrift, within) => {
    expect(
      getVersionDriftStatus({
        browser: 'chrome',
        version: 120,
        referenceVersion: 122,
        versionDrift,
        browserslistData: data,
      }),
    ).toEqual({ drift: 2, withinVersionDrift: within });
  });

  test('counts point releases, not the numeric difference', () => {
    expect(
      getVersionDriftStatus({
        browser: 'safari',
        version: 17.2,
        referenceVersion: 18.0,
        versionDrift: 4,
        browserslistData: data,
      }),
    ).toEqual({ drift: 5, withinVersionDrift: false });
  });

  test('unknown browsers have no drift', () => {
    expect(
      getVersionDriftStatus({
        browser: 'netscape',
        version: 1,
        referenceVersion: 9,
        browserslistData: data,
      }),
    ).toEqual({ drift: 0, withinVersionDrift: true });
  });

  test('accepts browserslist.data, including ranged safari versions', () => {
    const status = getVersionDriftStatus({
      browser: 'safari',
      version: 15.4,
      referenceVersion: 16.0,
      browserslistData: browserslist.data,
    });
    // 15.5, 15.6, 16.0 (and "15.2-15.3" is before the range)
    expect(status.drift).toBe(3);
  });
});

describe('isValidVersionDrift', () => {
  test.each([0, 1, 10])('accepts %s', (value) => {
    expect(isValidVersionDrift(value)).toBe(true);
  });

  test.each([-1, 1.5, '2', NaN, Infinity, null, undefined])(
    'rejects %s',
    (value) => {
      expect(isValidVersionDrift(value)).toBe(false);
    },
  );
});
