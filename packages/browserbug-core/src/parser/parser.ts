import {
  default as grammar,
  BrowserbugSemantics,
} from './grammar/browserbug.ohm-bundle.js';
import { parseBrowserslistVersion } from '../browserslistUtils.js';

type BrowserslistData = typeof import('browserslist').data;

export const singleComparators = [
  'lower-than',
  'lt',
  'lower-than-or-equal',
  'lte',
  'equal',
  'last-checked',
] as const;

export const multiComparators = ['between'] as const;

export const comparators = [...singleComparators, ...multiComparators] as const;

export type SingleComparator = (typeof singleComparators)[number];
export type MultiComparator = (typeof multiComparators)[number];
export type Comparator = SingleComparator & MultiComparator;

export type BrowserDescriptor = {
  browser: string;
} & (
  | {
      comparator: SingleComparator;
      version: number;
    }
  | {
      comparator: MultiComparator;
      version: [number, number];
    }
);

/** `web-feature <id>`: a feature from the web-features dataset. */
export type WebFeatureDescriptor = {
  webFeature: string;
};

export type BrowserbugDescriptor = BrowserDescriptor | WebFeatureDescriptor;

export function isWebFeatureDescriptor(
  descriptor: BrowserbugDescriptor,
): descriptor is WebFeatureDescriptor {
  return 'webFeature' in descriptor;
}

/** Browsers that web-features reports support for. */
export type WebFeaturesBrowser =
  | 'chrome'
  | 'chrome_android'
  | 'edge'
  | 'firefox'
  | 'firefox_android'
  | 'safari'
  | 'safari_ios';

/**
 * The subset of the web-features `features` export that browserbug reads.
 * Pass `features` from the `web-features` package.
 */
export type WebFeaturesData = Readonly<
  Record<
    string,
    | {
        kind: 'feature';
        status: { support: Partial<Record<WebFeaturesBrowser, string>> };
      }
    | { kind: 'moved'; redirect_target: string }
    | { kind: 'split'; redirect_targets: string[] }
  >
>;

export type ParseOptions = {
  /** Required to validate and resolve `web-feature` descriptors. */
  webFeatures?: WebFeaturesData;
};

type ExtractResult = {
  declarations: Array<BrowserbugDescriptor>;
  comment: string | null;
};

const semantics = grammar.createSemantics().addOperation('extract', {
  Exp: (opener, declarationsNode, comment) => {
    const declarations = declarationsNode
      .asIteration()
      .children.map((node) => node.extract());

    return {
      declarations,
      comment: comment.isOptional() ? comment.children[0]?.extract() : null,
    };
  },
  CommentExp(_commentStartNode, commentContentNode) {
    return commentContentNode.sourceString;
  },
  DescriptorExp: (node) => {
    return node.extract();
  },
  WebFeatureExp: (_webFeatureKeyword, featureId) => {
    return { webFeature: featureId.sourceString };
  },
  BrowserAndVersionExp: (browser, comparatorAndVersion) => {
    return {
      browser: browser.sourceString,
      ...comparatorAndVersion.extract(),
    };
  },
  CompExp: (node) => {
    return node.extract();
  },
  SingleComparatorExp: (comparator, version) => {
    return {
      comparator: comparator.sourceString.toLowerCase(),
      version: version.extract(),
    };
  },
  MultiComparatorExp: (comparator, versionStart, versionEnd) => {
    return {
      comparator: comparator.sourceString,
      version: [versionStart.extract(), versionEnd.extract()],
    };
  },
  Version_major(version) {
    return version.extract();
  },
  Version_majorminor(majorNode, _arg1, minorNode) {
    // TODO: return as structured data instead of floats
    // return [majorNode.extract(), minorNode.extract()];
    return parseFloat(`${majorNode.extract()}.${minorNode.extract()}`);
  },
  number(node) {
    return parseInt(node.sourceString);
  },
}) as BrowserbugSemantics & {
  extract: () => ExtractResult;
};

type Result<TSuccess, TError> =
  | {
      success: true;
      data: TSuccess;
    }
  | { success: false; error: TError };

type ParseError = {
  /* Contains a message indicating why the match failed. Does _not_ print any
   * source location information. If you want to augment the source information,
   * consider using `rightmostFailurePosition` */
  shortMessage: string;

  /* Contains a message indicating where and why the match failed. This message
   * is suitable for end users of a language (i.e., people who do not have
   * access to the grammar source). */
  message: string;

  /* Index in the input stream at which parsing failed */
  rightmostFailurePosition: number;
};

type ValidationError = {
  shortMessage: string;
};

export type ParseResult = Result<
  Array<BrowserbugDescriptor>,
  ParseError | ValidationError[]
>;

export function parseBrowserbug(
  input: string,
  browserslistData: BrowserslistData,
  options: ParseOptions = {},
): ParseResult {
  const match = grammar.match(input);

  if (match.failed()) {
    const rightmostFailurePosition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- https://ohmjs.org/docs/api-reference#matchfailure-objects
      (match as any).getRightmostFailurePosition() as number;
    return {
      success: false,
      error: {
        shortMessage: match.shortMessage!,
        message: match.message!,
        rightmostFailurePosition,
      },
    };
  }

  const { declarations } = semantics(match).extract() as ExtractResult;

  // Gather all validation errors into one message, for now
  const normalised = declarations.map((desc) =>
    isWebFeatureDescriptor(desc)
      ? validateWebFeatureDescriptor(desc, options.webFeatures)
      : normaliseDescriptor(desc, browserslistData),
  );

  const validationErrors = normalised
    .map((res) => !res.success && res.error)
    .filter(Boolean) as ValidationError[];

  if (validationErrors.length > 0) {
    return {
      success: false,
      error: validationErrors,
    };
  }

  return {
    success: true,
    data: normalised.map((res) => (res as { data: BrowserbugDescriptor }).data),
  };
}

function validateWebFeatureDescriptor(
  descriptor: WebFeatureDescriptor,
  webFeatures: WebFeaturesData | undefined,
): Result<WebFeatureDescriptor, ValidationError> {
  const id = descriptor.webFeature;

  if (!webFeatures) {
    return {
      success: false,
      error: {
        shortMessage: `Cannot resolve web-feature ${id}: no web-features data was provided.`,
      },
    };
  }

  const feature = Object.hasOwn(webFeatures, id) ? webFeatures[id] : undefined;

  if (!feature) {
    return {
      success: false,
      error: {
        shortMessage: `Unknown web-feature ${id}. See https://web-platform-dx.github.io/web-features-explorer/ for feature ids.`,
      },
    };
  }

  if (feature.kind === 'moved') {
    return {
      success: false,
      error: {
        shortMessage: `The web-feature ${id} has moved. Use ${feature.redirect_target} instead.`,
      },
    };
  }

  if (feature.kind === 'split') {
    return {
      success: false,
      error: {
        shortMessage: `The web-feature ${id} was split. Use one of ${feature.redirect_targets.join(', ')} instead.`,
      },
    };
  }

  return { success: true, data: descriptor };
}

function normaliseDescriptor(
  raw: BrowserDescriptor,
  browserslistData: BrowserslistData,
): Result<BrowserDescriptor, ValidationError> {
  const { version } = raw;

  // browserslist browser names are lowercase
  const browser = raw.browser.toLowerCase();
  const browserData = browserslistData[browser];

  if (!browserData) {
    return {
      success: false,
      error: {
        shortMessage: `Unknown browser named ${browser}. Must be one of ${Object.keys(browserslistData).join(', ')}.`,
      },
    };
  }

  const availableVersions = browserData.versions.map(parseBrowserslistVersion);

  if (
    !availableVersions || typeof version === 'number'
      ? !availableVersions.includes(version as number)
      : !version.every((v) => availableVersions.includes(v))
  ) {
    return {
      success: false,
      error: {
        shortMessage: `Unknown version ${raw.version} for browser ${browser}. Must be one of ${availableVersions}.`,
      },
    };
  }

  return { success: true, data: { ...raw, browser } };
}
