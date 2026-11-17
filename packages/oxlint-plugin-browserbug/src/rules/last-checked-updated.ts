import {
  parseBrowserbug,
  getLastCheckedStatus,
  getVersionDriftStatus,
  isWebFeatureDescriptor,
  webFeatures,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist';
import { createRule } from '../rule.js';

export type Options = [
  {
    /**
     * How many browser releases the newest targeted version may be ahead of a
     * `last-checked` version before it is reported. Defaults to `0`.
     */
    versionDrift?: number;
  },
];

export default createRule<Options, 'updated'>({
  name: 'last-checked-updated',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Reports `last-checked` browser workarounds, if browserslist targets a newer version of that browser than the one checked.',
      recommended: false,
      requiresTypeChecking: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          versionDrift: {
            type: 'integer',
            minimum: 0,
            description:
              'How many browser releases the newest targeted version may be ahead of a `last-checked` version before it is reported.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ versionDrift: 0 }],
    messages: {
      updated:
        '@browserbug declaration was last checked in {{ browser }} {{ lastCheckedVersion }}, but browserslist targets {{ browser }} {{ highestVersion }}. Check whether the bug still exists, and update or remove the declaration.',
    },
  },
  createOnce(context, getOptions) {
    return {
      // Per-file work happens here rather than in a `before` hook, which
      // oxlint skips for files without any matching nodes.
      Program(node) {
        const [{ versionDrift }] = getOptions();
        const supportTargets = browserslist(context.settings.browserslistQuery);

        for (const comment of node.comments ?? []) {
          const allOpenerMatches = comment.value.matchAll(/@browserbug /g);

          for (const match of allOpenerMatches) {
            const openerPos = match.index!; // always defined if we have a match

            // Same slicing as no-outdated: declarations end at the end of the
            // line (or the comment).
            const nextNewlinePos =
              comment.type === 'Block'
                ? comment.value.indexOf('\n', openerPos)
                : -1;
            const toParse = comment.value
              .slice(
                openerPos,
                nextNewlinePos !== -1 ? nextNewlinePos : comment.value.length,
              )
              .trim();

            const parseResult = parseBrowserbug(toParse, browserslist.data, {
              webFeatures,
            });

            // Parse errors are reported by no-outdated
            if (!parseResult.success) {
              continue;
            }

            for (const descriptor of parseResult.data) {
              if (isWebFeatureDescriptor(descriptor)) {
                continue;
              }

              const status = getLastCheckedStatus(descriptor, supportTargets);
              if (!status.updated) {
                continue;
              }

              // ESLint takes severity from config, so declarations within the
              // drift are not reported at all (same as no-outdated)
              const { withinVersionDrift } = getVersionDriftStatus({
                browser: descriptor.browser,
                version: status.lastCheckedVersion,
                referenceVersion: status.highestVersion,
                versionDrift,
                browserslistData: browserslist.data,
              });
              if (!withinVersionDrift) {
                context.report({
                  loc: comment.loc,
                  messageId: 'updated',
                  data: {
                    browser: descriptor.browser,
                    lastCheckedVersion: status.lastCheckedVersion.toString(),
                    highestVersion: status.highestVersion.toString(),
                  },
                });
              }
            }
          }
        }
      },
    };
  },
});
