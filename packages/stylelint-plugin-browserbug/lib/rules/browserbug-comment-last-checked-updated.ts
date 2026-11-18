import {
  getLastCheckedStatus,
  getVersionDriftStatus,
  isValidVersionDrift,
  isWebFeatureDescriptor,
  webFeatures,
  parseBrowserbug,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist';
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = '@woltapp/browserbug-comment-last-checked-updated';

export const messages = ruleMessages(ruleName, {
  updated: (browser, lastCheckedVersion, highestVersion) =>
    `Unexpected @browserbug declaration last checked in ${browser} ${lastCheckedVersion}, but browserslist targets ${browser} ${highestVersion}. Check whether the bug still exists, and update or remove the declaration.`,
});

const meta = {
  url: 'https://github.com/woltapp/browserbug/blob/main/packages/stylelint-plugin-browserbug/docs/rules/browserbug-comment-last-checked-updated.md',
};

export type SecondaryOptions = {
  browserslistQuery?: string;
  /**
   * How many browser releases the newest targeted version may be ahead of a
   * `last-checked` version before it is reported at the rule's severity.
   * Within the drift, it is reported as a warning. Defaults to `0`.
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

        // Same slicing as browserbug-comment-no-outdated: declarations end at
        // the end of the line (or the comment).
        const nextNewlinePos = commentNode.text.indexOf('\n', openerPos);
        const endPos =
          nextNewlinePos !== -1 ? nextNewlinePos : commentNode.text.length;

        const toParse = commentNode.text.slice(openerPos, endPos);

        const parseResult = parseBrowserbug(toParse, browserslist.data, {
          webFeatures,
        });

        // Parse errors are reported by browserbug-comment-no-outdated
        if (!parseResult.success) {
          continue;
        }

        for (const descriptor of parseResult.data) {
          if (isWebFeatureDescriptor(descriptor)) {
            continue;
          }

          const status = getLastCheckedStatus(descriptor, supportTargets);
          if (status.updated) {
            // Within the drift, the report is downgraded to a warning (same as
            // browserbug-comment-no-outdated)
            const { withinVersionDrift } = getVersionDriftStatus({
              browser: descriptor.browser,
              version: status.lastCheckedVersion,
              referenceVersion: status.highestVersion,
              versionDrift,
              browserslistData: browserslist.data,
            });

            report({
              node: commentNode,
              message: messages.updated,
              messageArgs: [
                descriptor.browser,
                status.lastCheckedVersion,
                status.highestVersion,
              ] satisfies Parameters<typeof messages.updated>,
              index: openerPos,
              endIndex: endPos,
              result,
              ruleName,
              ...(withinVersionDrift && { severity: 'warning' }),
            });
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

function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}
