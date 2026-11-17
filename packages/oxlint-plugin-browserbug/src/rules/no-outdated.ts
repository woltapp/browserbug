import {
  type BrowserDescriptor,
  type BrowserbugSyntaxError,
  type SourceRange,
  parseBrowserbug,
  getBrowserSupportStatus,
  getVersionDriftStatus,
  getWebFeatureSupportStatus,
  isWebFeatureDescriptor,
  webFeatures,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist';
import { createRule } from '../rule.js';

export type Options = [
  {
    /**
     * How many browser releases a `last-checked` version may fall behind the
     * lowest supported version before it is reported. Defaults to `0`.
     */
    versionDrift?: number;
  },
];

export default createRule<Options, MessageIds>({
  name: 'no-outdated',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ensures that no browser workarounds exist, if browserslist support for that browser is outside the specified range.',
      recommended: true,
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
              'How many browser releases a `last-checked` version may fall behind the lowest supported version before it is reported.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ versionDrift: 0 }],
    messages: {
      outdated:
        'Outdated @browserbug declaration. The lowest supported version for {{ browser }} is {{ lowestSupportedVersion }}, but the declaration resolves to {{ actualVersion }}.',
      unsupported:
        'Outdated @browserbug declaration. Browser {{ browser }} is not in the list of supported browsers.',
      webFeatureOutdated:
        'Outdated @browserbug declaration. Every supported browser supports the web-feature {{ feature }}.',
      parseError: '@browserbug parsing error: {{ errorMessage }}',
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
            const { loc } = comment;

            // The parser starts at the start token, so we slice the string
            // manually
            let toParse: string;

            if (comment.type === 'Line') {
              toParse = comment.value
                .slice(openerPos, comment.value.length)
                .trim();
            } else {
              // Split off at newlines. This keeps the browserbug grammar agnostic
              // of JS comment end-of-line rules. In practice, this means that
              // browserbug declarations all have to be on one line. This is similar
              // to eslint-disable comments, so there is some precedent.
              const nextNewlinePos = comment.value.indexOf('\n', openerPos);

              toParse =
                nextNewlinePos !== -1
                  ? comment.value.slice(openerPos, nextNewlinePos).trim()
                  : comment.value.slice(openerPos, comment.value.length).trim();
            }

            const parseResult = parseBrowserbug(toParse, browserslist.data, {
              webFeatures,
            });

            if (!parseResult.success) {
              // `comment.value` starts after the `//` or `/*` marker, and the
              // parser input starts at the opener. Every position the parser
              // reports is relative to that.
              const inputStart = comment.range[0] + 2 + openerPos;
              const locOf = (range: SourceRange) => ({
                start: context.sourceCode.getLocFromIndex(
                  inputStart + range.start,
                ),
                end: context.sourceCode.getLocFromIndex(inputStart + range.end),
              });

              const errors = Array.isArray(parseResult.error)
                ? parseResult.error.map((error) => ({
                    range: error.range,
                    errorMessage: error.shortMessage,
                  }))
                : [
                    {
                      range: parseResult.error.range,
                      errorMessage: describeSyntaxError(
                        toParse,
                        parseResult.error,
                      ),
                    },
                  ];

              for (const { range, errorMessage } of errors) {
                context.report({
                  loc: locOf(range),
                  messageId: 'parseError',
                  data: { errorMessage },
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
                  context.report({
                    loc: loc!,
                    messageId: 'webFeatureOutdated',
                    data: { feature: descriptor.webFeature },
                  });
                }
                continue;
              }

              const status = getBrowserSupportStatus(
                descriptor,
                supportTargets,
              );
              if (!status.supported) {
                // ESLint cannot lower the severity of a single report, so a
                // `last-checked` declaration within the allowed drift is not
                // reported at all.
                if (
                  descriptor.comparator === 'last-checked' &&
                  status.lowestVersion !== undefined &&
                  getVersionDriftStatus({
                    browser: descriptor.browser,
                    version: descriptor.version,
                    referenceVersion: status.lowestVersion,
                    versionDrift,
                    browserslistData: browserslist.data,
                  }).withinVersionDrift
                ) {
                  continue;
                }

                if (!status.lowestVersion) {
                  context.report({
                    loc: loc!, // gotta figure this one out
                    messageId: 'unsupported',
                    data: {
                      browser: descriptor.browser,
                    },
                  });
                } else {
                  context.report({
                    loc: loc!, // gotta figure this one out
                    messageId: 'outdated',
                    data: {
                      browser: descriptor.browser,
                      lowestSupportedVersion: status.lowestVersion.toString(),
                      actualVersion: getDescriptorVersionBound(descriptor),
                    },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
});

type MessageIds =
  | 'outdated'
  | 'unsupported'
  | 'webFeatureOutdated'
  | 'parseError';

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
