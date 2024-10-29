import { getLowestSupportedBrowsersFromTargets } from './browserslistUtils.js';
import { BrowserbugDescriptor } from './parser/parser.js';

type SupportStatus =
  | {
      supported: false;
      lowestVersion?: number;
    }
  | {
      supported: true;
      lowestVersion: number;
    };

export function getBrowserSupportStatus(
  descriptor: BrowserbugDescriptor,
  supportTargets: string[],
): SupportStatus {
  const browsers = getLowestSupportedBrowsersFromTargets(supportTargets);

  const supportedBrowser = browsers.find(
    (b) => b.target === descriptor.browser,
  );

  if (!supportedBrowser) {
    return { supported: false };
  }

  const isDescriptorUpToDate = () => {
    const { comparator } = descriptor;
    switch (comparator) {
      case 'lt':
      case 'lower-than':
        return supportedBrowser.parsedVersion < descriptor.version;
      case 'lte':
      case 'lower-than-or-equal':
      case 'equal':
      case 'last-checked':
        return supportedBrowser.parsedVersion <= descriptor.version;
      case 'between':
        return supportedBrowser.parsedVersion <= descriptor.version[1];
      /* v8 ignore next 2 */
      default:
        assertUnreachable(comparator);
    }
  };

  if (isDescriptorUpToDate()) {
    return { supported: true, lowestVersion: supportedBrowser.parsedVersion };
  }

  return {
    supported: false,
    lowestVersion: supportedBrowser.parsedVersion,
  };
}

/* v8 ignore next 4 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertUnreachable(_: never): never {
  throw new Error('unreachable!');
}
