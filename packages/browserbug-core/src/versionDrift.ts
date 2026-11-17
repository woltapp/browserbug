import { parseBrowserslistVersion } from './browserslistUtils.js';

/**
 * The subset of `browserslist.data` that version drift reads. Pass
 * `browserslist.data`.
 */
export type ReleasedVersionsData = Readonly<
  Record<string, { released: readonly string[] } | undefined>
>;

export type VersionDriftStatus = {
  /**
   * How many releases of the browser are newer than the declared version, up
   * to and including the reference version. `0` means the declaration is
   * current.
   */
  drift: number;
  /**
   * Whether `drift` is within the allowed `versionDrift`. Always `true` when
   * `drift` is `0`.
   */
  withinVersionDrift: boolean;
};

/**
 * Measures how far a `last-checked` version lags behind a reference version,
 * in releases of that browser, and whether that lag is tolerated.
 *
 * The reference depends on the rule: `no-outdated` uses the lowest supported
 * version from browserslist, and a "last-checked is stale" rule would use the
 * latest released version.
 *
 * Drift counts releases rather than subtracting version numbers, so that a
 * threshold means the same thing for browsers with major versions (Chrome
 * 120 → 123 is 3) and browsers with point releases (Safari 17.2 → 18.0 is 5:
 * 17.3, 17.4, 17.5, 17.6, 18.0).
 *
 * @example
 * ```ts
 * getVersionDriftStatus({
 *   browser: 'chrome',
 *   version: 120,
 *   referenceVersion: 122,
 *   versionDrift: 2,
 *   browserslistData: browserslist.data,
 * });
 * // { drift: 2, withinVersionDrift: true }
 * ```
 */
export function getVersionDriftStatus({
  browser,
  version,
  referenceVersion,
  versionDrift = 0,
  browserslistData,
}: {
  browser: string;
  version: number;
  referenceVersion: number;
  /** Allowed number of releases behind the reference. Defaults to `0`. */
  versionDrift?: number;
  browserslistData: ReleasedVersionsData;
}): VersionDriftStatus {
  const released = browserslistData[browser]?.released ?? [];

  const drift = released
    .map(parseBrowserslistVersion)
    .filter((v) => v > version && v <= referenceVersion).length;

  return { drift, withinVersionDrift: drift <= versionDrift };
}

/**
 * Whether a value is a valid `versionDrift` option: a non-negative integer.
 */
export function isValidVersionDrift(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
