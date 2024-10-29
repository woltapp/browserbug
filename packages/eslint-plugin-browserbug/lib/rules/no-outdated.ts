import { AST_TOKEN_TYPES } from '@typescript-eslint/utils';
import {
  type BrowserbugDescriptor,
  parseBrowserbug,
  getBrowserSupportStatus,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist';
import { createRule } from '../rule';

export default createRule({
  name: 'no-outdated',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ensures that no browser workarounds exist, if browserslist support for that browser is outside the specified range.',
      recommended: true,
      requiresTypeChecking: false,
    },
    // TODO: Set `versionDrift` here
    schema: [], // Add a schema if the rule has options
    messages: {
      outdated:
        'Outdated @browserbug declaration. The lowest supported version for {{ browser }} is {{ lowestSupportedVersion }}, but the declaration resolves to {{ actualVersion }}.',
      unsupported:
        'Outdated @browserbug declaration. Browser {{ browser }} is not in the list of supported browsers.',
      parseError: '@browserbug parsing error: {{ errorMessage }}',
    },
  },
  defaultOptions: [],
  create(context) {
    const supportTargets = browserslist(context.settings.browserslistQuery);

    return {
      Program(node) {
        for (const comment of node.comments ?? []) {
          const allOpenerMatches = comment.value.matchAll(/@browserbug /g);

          for (const match of allOpenerMatches) {
            const openerPos = match.index!; // always defined if we have a match
            const { loc } = comment;

            // The parser starts at the start token, so we slice the string
            // manually
            let toParse: string;

            if (comment.type === AST_TOKEN_TYPES.Line) {
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

            const parseResult = parseBrowserbug(toParse, browserslist.data);

            if (!parseResult.success) {
              context.report({
                loc: loc!, // gotta figure this out
                messageId: 'parseError',
                data: {
                  errorMessage: Array.isArray(parseResult.error)
                    ? parseResult.error.map((e) => e.shortMessage).join(', ')
                    : parseResult.error.message,
                },
              });
              // nothing else to do for this opener match
              continue;
            }

            for (const descriptor of parseResult.data) {
              const status = getBrowserSupportStatus(
                descriptor,
                supportTargets,
              );
              if (!status.supported) {
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

function getDescriptorVersionBound(descriptor: BrowserbugDescriptor) {
  return typeof descriptor.version === 'number'
    ? descriptor.version
    : descriptor.version[1];
}
