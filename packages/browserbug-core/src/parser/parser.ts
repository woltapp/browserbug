import type { FailedMatchResult } from 'ohm-js';
import grammar, {
  type BrowserbugSemantics,
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

/**
 * A half-open range of character offsets, `[start, end)`, within the string
 * passed to `parseBrowserbug`. Linters add these to the offset of the
 * `@browserbug` opener, to point at the exact source location.
 */
export type SourceRange = {
  start: number;
  end: number;
};

type ExtractedDescriptor = {
  descriptor: BrowserbugDescriptor;
  /** Where the browser name or web-feature id appears in the input. */
  nameRange: SourceRange;
  /** Where the version(s) appear in the input, for browser descriptors. */
  versionRange?: SourceRange;
};

type ExtractResult = {
  declarations: Array<ExtractedDescriptor>;
  comment: string | null;
};

function rangeOf(node: { source: { startIdx: number; endIdx: number } }) {
  return { start: node.source.startIdx, end: node.source.endIdx };
}

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
  WebFeatureExp: (_webFeatureKeyword, featureId): ExtractedDescriptor => {
    return {
      descriptor: { webFeature: featureId.sourceString },
      nameRange: rangeOf(featureId),
    };
  },
  BrowserAndVersionExp: (
    browser,
    comparatorAndVersion,
  ): ExtractedDescriptor => {
    const { versionRange, ...rest } = comparatorAndVersion.extract();
    return {
      descriptor: { browser: browser.sourceString, ...rest },
      nameRange: rangeOf(browser),
      versionRange,
    };
  },
  CompExp: (node) => {
    return node.extract();
  },
  SingleComparatorExp: (comparator, version) => {
    return {
      comparator: comparator.sourceString.toLowerCase(),
      version: version.extract(),
      versionRange: rangeOf(version),
    };
  },
  MultiComparatorExp: (comparator, versionStart, versionEnd) => {
    return {
      comparator: comparator.sourceString,
      version: [versionStart.extract(), versionEnd.extract()],
      versionRange: {
        start: versionStart.source.startIdx,
        end: versionEnd.source.endIdx,
      },
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

/** The input does not match the `@browserbug` grammar. */
export type BrowserbugSyntaxError = {
  kind: 'syntax';

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

  /**
   * What the grammar expected at `rightmostFailurePosition`, without any
   * location information, e.g. `expected "between", "equal", or "lt"`.
   * Linters pair this with their own, absolute, source location.
   */
  expected: string;

  /**
   * The offending token: starts at `rightmostFailurePosition` and runs to the
   * next whitespace. Empty (`start === end`) when the input ended too early.
   */
  range: SourceRange;
};

/** The input is grammatical, but names an unknown browser, version or feature. */
export type BrowserbugValidationError = {
  kind: 'validation';
  shortMessage: string;
  /** The part of the input that failed validation. */
  range: SourceRange;
};

export type ParseResult = Result<
  Array<BrowserbugDescriptor>,
  BrowserbugSyntaxError | BrowserbugValidationError[]
>;

export function parseBrowserbug(
  input: string,
  browserslistData: BrowserslistData,
  options: ParseOptions = {},
): ParseResult {
  const match = grammar.match(input);

  if (match.failed()) {
    // https://ohmjs.org/docs/api-reference#matchfailure-objects
    const failure = match as unknown as FailedMatchResult;
    const rightmostFailurePosition = failure.getRightmostFailurePosition();
    return {
      success: false,
      error: {
        kind: 'syntax',
        shortMessage: failure.shortMessage,
        message: failure.message,
        rightmostFailurePosition,
        expected: `expected ${failure.getExpectedText()}`,
        range: {
          start: rightmostFailurePosition,
          end: tokenEnd(input, rightmostFailurePosition),
        },
      },
    };
  }

  const { declarations } = semantics(match).extract() as ExtractResult;

  const normalised = declarations.map((extracted) =>
    isWebFeatureDescriptor(extracted.descriptor)
      ? validateWebFeatureDescriptor(
          extracted.descriptor,
          extracted,
          options.webFeatures,
        )
      : normaliseDescriptor(extracted.descriptor, extracted, browserslistData),
  );

  const validationErrors = normalised
    .map((res) => !res.success && res.error)
    .filter(Boolean) as BrowserbugValidationError[];

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

/** The end of the whitespace-delimited token that starts at `start`. */
function tokenEnd(input: string, start: number): number {
  const rest = input.slice(start);
  const length = rest.search(/\s/);
  return length === -1 ? input.length : start + length;
}

function validateWebFeatureDescriptor(
  descriptor: WebFeatureDescriptor,
  { nameRange }: ExtractedDescriptor,
  webFeatures: WebFeaturesData | undefined,
): Result<WebFeatureDescriptor, BrowserbugValidationError> {
  const id = descriptor.webFeature;
  const range = nameRange;

  if (!webFeatures) {
    return {
      success: false,
      error: {
        kind: 'validation',
        range,
        shortMessage: `Cannot resolve web-feature ${id}: no web-features data was provided.`,
      },
    };
  }

  const feature = Object.hasOwn(webFeatures, id) ? webFeatures[id] : undefined;

  if (!feature) {
    return {
      success: false,
      error: {
        kind: 'validation',
        range,
        shortMessage: `Unknown web-feature ${id}. See https://web-platform-dx.github.io/web-features-explorer/ for feature ids.`,
      },
    };
  }

  if (feature.kind === 'moved') {
    return {
      success: false,
      error: {
        kind: 'validation',
        range,
        shortMessage: `The web-feature ${id} has moved. Use ${feature.redirect_target} instead.`,
      },
    };
  }

  if (feature.kind === 'split') {
    return {
      success: false,
      error: {
        kind: 'validation',
        range,
        shortMessage: `The web-feature ${id} was split. Use one of ${feature.redirect_targets.join(', ')} instead.`,
      },
    };
  }

  return { success: true, data: descriptor };
}

function normaliseDescriptor(
  raw: BrowserDescriptor,
  { nameRange, versionRange }: ExtractedDescriptor,
  browserslistData: BrowserslistData,
): Result<BrowserDescriptor, BrowserbugValidationError> {
  const { version } = raw;

  // browserslist browser names are lowercase
  const browser = raw.browser.toLowerCase();
  const browserData = browserslistData[browser];

  if (!browserData) {
    return {
      success: false,
      error: {
        kind: 'validation',
        range: nameRange,
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
        kind: 'validation',
        range: versionRange ?? nameRange,
        shortMessage: `Unknown version ${raw.version} for browser ${browser}. Must be one of ${availableVersions}.`,
      },
    };
  }

  return { success: true, data: { ...raw, browser } };
}
