import {
  getBrowserSupportStatus,
  parseBrowserbug,
  type BrowserbugDescriptor,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist';
import stylelint, { Rule } from 'stylelint';

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
});

const meta = {
  url: 'https://github.com/woltapp/browserbug/packages/stylelint-plugin-browserbug/blob/main/README.md',
};

export type SecondaryOptions = {
  browserslistQuery?: string;
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
          // TODO: Consider `versionDrift`
        },
        optional: true,
      },
    );

    if (!validOptions) {
      return;
    }

    const supportTargets = browserslist(secondaryOptions.browserslistQuery);

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

        const parseResult = parseBrowserbug(toParse, browserslist.data);

        if (!parseResult.success) {
          report({
            node: commentNode,
            message: messages.parseError,
            messageArgs: [
              Array.isArray(parseResult.error)
                ? parseResult.error.map((e) => e.shortMessage).join(', ')
                : parseResult.error.shortMessage,
            ] satisfies Parameters<typeof messages.parseError>,
            index: openerPos,
            endIndex: Array.isArray(parseResult.error)
              ? endPos
              : parseResult.error.rightmostFailurePosition,
            result,
            ruleName,
          });

          // nothing else to do for this opener match
          continue;
        }

        for (const descriptor of parseResult.data) {
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
                index: openerPos,
                endIndex: endPos,
                result,
                ruleName,
              });
            } else {
              report({
                node: commentNode,
                message: messages.outdated,
                messageArgs: [
                  descriptor.browser,
                  getDescriptorVersionBound(descriptor),
                  status.lowestVersion,
                ] satisfies Parameters<typeof messages.outdated>,
                // TODO: It would be nice to know the index of each match in the
                // text, in order to highlight the specific one in case of
                // multi-matches. But maybe this is OK?
                index: openerPos,
                endIndex: endPos,
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

function getDescriptorVersionBound(descriptor: BrowserbugDescriptor) {
  return typeof descriptor.version === 'number'
    ? descriptor.version
    : descriptor.version[1];
}

function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}
