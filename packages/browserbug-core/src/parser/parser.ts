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

export type BrowserbugDescriptor = {
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
  const normalised = declarations.map(
    (desc) => normaliseDescriptor(desc, browserslistData),
    browserslistData,
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

function normaliseDescriptor(
  raw: BrowserbugDescriptor,
  browserslistData: BrowserslistData,
): Result<BrowserbugDescriptor, ValidationError> {
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
