export function parseBrowserslistVersion(version: string) {
  // happens in op_mini all
  if (version === 'all') {
    return 0;
  }

  return version.includes('-')
    ? // e.g. "15.2-15.3", which happens in safari
      parseFloat(version.split('-')[0])
    : // other browserslist versions are major.minor, so they can be parseFloat'ed directly
      parseFloat(version);
}

/**
 * Parses a list of versions, as provided by browserslist.
 *
 * @example
 * ```ts
 * getLowestBrowserAndVersionFromTargets(['chrome 50', 'safari 15.4'])
 *
 * [{
 *   target: 'chrome',
 *   parsedVersion: 50,
 *   version: '50'
 * },
 * {
 *   target: 'safari',
 *   parsedVersion: 15.4,
 *   version: '15.4'
 * }]
 * ```
 * @param targets - List of targets from browserslist api
 * @returns - The lowest version version of each target
 */
export function getLowestSupportedBrowsersFromTargets(targets: string[]) {
  return (
    // Sort the targets by target name and then version number in ascending order
    targets
      .map((e) => {
        const [target, version] = e.split(' ');
        const parsedVersion = parseBrowserslistVersion(version);

        return {
          target,
          version,
          parsedVersion,
        };
      })
      // Sort the targets by target name and then version number in descending order
      // ex. [a@3, b@3, a@1] => [a@3, a@1, b@3]
      .sort((a, b) => {
        if (b.target === a.target) {
          // If any version === 'all', return 0. The only version of op_mini is 'all'
          // Otherwise, compare the versions
          return typeof b.parsedVersion === 'string' ||
            typeof a.parsedVersion === 'string'
            ? 0
            : b.parsedVersion - a.parsedVersion;
        }
        return b.target > a.target ? 1 : -1;
      })
      .filter(
        (e, i, items) =>
          // Check if the current target is the last of its kind.
          // If it is, then it's the lowest supported version.
          i + 1 === items.length || e.target !== items[i + 1].target,
      )
  );
}
