import { getLowestSupportedBrowsersFromTargets } from './browserslistUtils.js';
import type {
  WebFeatureDescriptor,
  WebFeaturesBrowser,
  WebFeaturesData,
} from './parser/parser.js';

/**
 * browserslist browser names → web-features browser keys. Browserslist
 * targets outside this map (e.g. samsung, opera, op_mini) have no
 * web-features data, and are not considered.
 */
export const browserslistToWebFeaturesBrowser: Readonly<
  Record<string, WebFeaturesBrowser>
> = {
  chrome: 'chrome',
  and_chr: 'chrome_android',
  edge: 'edge',
  firefox: 'firefox',
  and_ff: 'firefox_android',
  safari: 'safari',
  ios_saf: 'safari_ios',
};

export type WebFeatureBlocker = {
  /** browserslist browser name */
  browser: string;
  /** Lowest version of `browser` in the support targets */
  lowestVersion: number;
  /** First version of `browser` that supports the feature; null if none does */
  supportedSince: number | null;
};

export type WebFeatureSupportStatus = {
  /**
   * true while at least one support target lacks the feature, i.e. the
   * workaround is still needed. false means the annotation is outdated.
   */
  supported: boolean;
  /** Support targets that lack the feature */
  blockers: WebFeatureBlocker[];
};

export function getWebFeatureSupportStatus(
  descriptor: WebFeatureDescriptor,
  supportTargets: string[],
  webFeatures: WebFeaturesData,
): WebFeatureSupportStatus {
  const feature = webFeatures[descriptor.webFeature];

  if (feature?.kind !== 'feature') {
    // The parser rejects unknown, moved and split ids, so this only happens
    // if the data passed here differs from the data passed to the parser.
    throw new Error(
      `web-feature ${descriptor.webFeature} is not a feature in the provided web-features data`,
    );
  }

  const blockers: WebFeatureBlocker[] = [];

  for (const target of getLowestSupportedBrowsersFromTargets(supportTargets)) {
    const key = browserslistToWebFeaturesBrowser[target.target];
    if (!key) continue;

    const supportedSince = parseWebFeaturesVersion(feature.status.support[key]);

    if (supportedSince === null || target.parsedVersion < supportedSince) {
      blockers.push({
        browser: target.target,
        lowestVersion: target.parsedVersion,
        supportedSince,
      });
    }
  }

  return { supported: blockers.length > 0, blockers };
}

/**
 * web-features versions are "123", "15.4", or "≤80" (supported at least since
 * that version, exact version unknown). Treat "≤" as the version itself, which
 * errs towards keeping a workaround slightly longer.
 */
function parseWebFeaturesVersion(version: string | undefined): number | null {
  if (version === undefined) return null;
  const parsed = parseFloat(version.replace(/^≤/, ''));
  return Number.isNaN(parsed) ? null : parsed;
}
