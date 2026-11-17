import {
  getBrowserSupportStatus,
  getVersionDriftStatus,
  getWebFeatureSupportStatus,
  isValidVersionDrift,
  isWebFeatureDescriptor,
  webFeatures,
  parseBrowserbug,
  type BrowserDescriptor,
  type BrowserbugSyntaxError,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist';
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = '@woltapp/browserbug-comment-no-outdated';

export const messages = ruleMessages(ruleName, {
  parseError: (err) => `Unexpected @browserbug parsing error: ${err}`,
  outdated: (browser, actualVersion, lowestSupportedVersion) =>
    `Unexpected outdated @browserbug declaration. The lowest supported version for ${browser} is ${lowestSupportedVersion}, but the declarations resolves to ${actualVersion}.`,
  unsupported: (browser) =>
    `Unexpected outdated @browserbug declaration. Browser '${browser}' is not in the list of supported browsers.`,
  webFeatureOutdated: (feature) =>
    `Unexpected outdated @browserbug declaration. Every supported browser supports the web-feature '${feature}'.`,
});

const meta = {
  url: 'https://github.com/woltapp/browserbug/packages/stylelint-plugin-browserbug/blob/main/README.md',
};

export type SecondaryOptions = {
  browserslistQuery?: string;
  /**
   * How many browser releases a `last-checked` version may fall behind the
   * lowest supported version before it is reported at the rule's severity.
   * Within that drift, it is reported as a warning. Defaults to `0`.
   */
  versionDrift?: number;
};

const ruleFunction: Rule = (
  primary,
  secondaryOptions: SecondaryOptions = {},
) => {
  return (root, result) => {
    const validOptions = validateOptions(
      result,
      ruleName,
      {
        actual: primary,
        possible: [true],
      },
      {
        actual: secondaryOptions,
        possible: {
          browserslistQuery: [isString],
          versionDrift: [isValidVersionDrift],
        },
        optional: true,
      },
    );

    if (!validOptions) {
      return;
    }

    const supportTargets = browserslist(secondaryOptions.browserslistQuery);
    const { versionDrift = 0 } = secondaryOptions;

    root.walkComments((commentNode) => {
      const allOpenerMatches = commentNode.text.matchAll(/@browserbug /g);

      for (const match of allOpenerMatches) {
        const openerPos = match.index!; // always defined if we have a match

        // Split off at newlines. This keeps the browserbug grammar agnostic
        // of JS comment end-of-line rules. In practice, this means that
        // browserbug declarations all have to be on one line. This is similar
        // to eslint-disable comments, so there is some precedent.
        const nextNewlinePos = commentNode.text.indexOf('\n', openerPos);

        const endPos =
          nextNewlinePos !== -1 ? nextNewlinePos : commentNode.text.length;

        const toParse = commentNode.text.slice(openerPos, endPos);

        // `index`/`endIndex` count from the start of the node's source, which
        // is the `/*` marker and the whitespace before `text`, not `text`.
        const textStart = 2 + (commentNode.raws.left ?? '').length;
        const declarationStart = textStart + openerPos;
        const declarationEnd = textStart + endPos;

        const parseResult = parseBrowserbug(toParse, browserslist.data, {
          webFeatures,
        });

        if (!parseResult.success) {
          const errors = Array.isArray(parseResult.error)
            ? parseResult.error.map((error) => ({
                range: error.range,
                errorMessage: error.shortMessage,
              }))
            : [
                {
                  range: parseResult.error.range,
                  errorMessage: describeSyntaxError(toParse, parseResult.error),
                },
              ];

          for (const { range, errorMessage } of errors) {
            report({
              node: commentNode,
              message: messages.parseError,
              messageArgs: [errorMessage] satisfies Parameters<
                typeof messages.parseError
              >,
              index: declarationStart + range.start,
              endIndex: declarationStart + range.end,
              result,
              ruleName,
            });
          }

          // nothing else to do for this opener match
          continue;
        }

        for (const descriptor of parseResult.data) {
          if (isWebFeatureDescriptor(descriptor)) {
            const status = getWebFeatureSupportStatus(
              descriptor,
              supportTargets,
              webFeatures,
            );
            if (!status.supported) {
              report({
                node: commentNode,
                message: messages.webFeatureOutdated,
                messageArgs: [descriptor.webFeature] satisfies Parameters<
                  typeof messages.webFeatureOutdated
                >,
                index: declarationStart,
                endIndex: declarationEnd,
                result,
                ruleName,
              });
            }
            continue;
          }

          const status = getBrowserSupportStatus(descriptor, supportTargets);
          if (!status.supported) {
            if (!status.lowestVersion) {
              report({
                node: commentNode,
                message: messages.unsupported,
                messageArgs: [descriptor.browser] satisfies Parameters<
                  typeof messages.unsupported
                >,
                // TODO: It would be nice to know the index of each match in the
                // text, in order to highlight the specific one in case of
                // multi-matches. But maybe this is OK?
                index: declarationStart,
                endIndex: declarationEnd,
                result,
                ruleName,
              });
            } else {
              // A `last-checked` declaration within the allowed drift is
              // downgraded to a warning, instead of the rule's severity.
              const withinVersionDrift =
                descriptor.comparator === 'last-checked' &&
                getVersionDriftStatus({
                  browser: descriptor.browser,
                  version: descriptor.version,
                  referenceVersion: status.lowestVersion,
                  versionDrift,
                  browserslistData: browserslist.data,
                }).withinVersionDrift;

              report({
                node: commentNode,
                message: messages.outdated,
                ...(withinVersionDrift && { severity: 'warning' }),
                messageArgs: [
                  descriptor.browser,
                  getDescriptorVersionBound(descriptor),
                  status.lowestVersion,
                ] satisfies Parameters<typeof messages.outdated>,
                // TODO: It would be nice to know the index of each match in the
                // text, in order to highlight the specific one in case of
                // multi-matches. But maybe this is OK?
                index: declarationStart,
                endIndex: declarationEnd,
                result,
                ruleName,
              });
            }
          }
        }
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

// NOTE: This must be an `export default`, for Stylelint 16 to pick it up
export default createPlugin(ruleName, ruleFunction);

// Helpers

function getDescriptorVersionBound(descriptor: BrowserDescriptor) {
  return typeof descriptor.version === 'number'
    ? descriptor.version
    : descriptor.version[1];
}

function describeSyntaxError(input: string, error: BrowserbugSyntaxError) {
  const found = input.slice(error.range.start, error.range.end);
  return found
    ? `${error.expected}, but found "${found}".`
    : `${error.expected}, but the declaration ended.`;
}

function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}
