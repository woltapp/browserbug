import { parseBrowserslistVersion } from './browserslistUtils.js';
import type { BrowserDescriptor } from './parser/parser.js';

export type LastCheckedStatus =
  | {
      /**
       * The descriptor is not `last-checked`, or none of the targets are for
       * its browser, or no target is newer than the checked version.
       */
      updated: false;
    }
  | {
      /**
       * The targets include a version of the browser that is newer than the
       * `last-checked` version, so the bug should be re-checked.
       */
      updated: true;
      /** The descriptor's `last-checked` version. */
      lastCheckedVersion: number;
      /** The newest targeted version of the descriptor's browser. */
      highestVersion: number;
    };

/**
 * Checks whether the support targets include a newer version of a browser
 * than the one a `last-checked` descriptor was checked against.
 *
 * @example
 * ```ts
 * getLastCheckedStatus(
 *   { browser: 'chrome', comparator: 'last-checked', version: 120 },
 *   ['chrome 122', 'chrome 121'],
 * );
 * // { updated: true, lastCheckedVersion: 120, highestVersion: 122 }
 * ```
 * @param descriptor - A parsed browser descriptor
 * @param supportTargets - List of targets from the browserslist api
 */
export function getLastCheckedStatus(
  descriptor: BrowserDescriptor,
  supportTargets: string[],
): LastCheckedStatus {
  if (descriptor.comparator !== 'last-checked') {
    return { updated: false };
  }

  const highestVersion = getHighestTargetVersion(
    descriptor.browser,
    supportTargets,
  );

  if (highestVersion === undefined || highestVersion <= descriptor.version) {
    return { updated: false };
  }

  return {
    updated: true,
    lastCheckedVersion: descriptor.version,
    highestVersion,
  };
}

function getHighestTargetVersion(browser: string, supportTargets: string[]) {
  let highest: number | undefined;

  for (const entry of supportTargets) {
    const [target, version] = entry.split(' ');
    if (target !== browser) {
      continue;
    }

    const parsedVersion = parseBrowserslistVersion(version);
    // Skip versions that are not numbers, such as Safari's "TP"
    if (!Number.isFinite(parsedVersion)) {
      continue;
    }

    if (highest === undefined || parsedVersion > highest) {
      highest = parsedVersion;
    }
  }

  return highest;
}
