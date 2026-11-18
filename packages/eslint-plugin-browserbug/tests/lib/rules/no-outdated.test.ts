import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';
import plugin from '../../../lib/index.js';

// Tested through the ESLint plugin, so these cover the `create` that
// `eslintCompatPlugin` derives from the rule's `createOnce`.
const rule = plugin.rules['no-outdated'] as unknown as RuleModule<
  string,
  unknown[]
>;

const ruleTester = new RuleTester();

ruleTester.run('no-outdated', rule, {
  valid: [
    {
      code: 'function helloWorld() {}',
      name: 'No comment',
    },
    {
      code: '// Some other comment',
      name: 'No @browserbug declaration in comment',
    },
    // No parsing errors
    // Declarations for still-supported browsers
    {
      code: '//@browserbug chrome lower-than 110',
      name: 'Opener in first position',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      name: 'Block comment with single annotation (newline)',
      code: `
/**
 * 
 * @browserbug chrome lower-than 110
 * 
 */`,
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      // We have to be careful with how we slice the block comments
      name: 'Block comment with single annotation (end same line)',
      code: `
/**
 * @browserbug chrome lower-than 110 */`,
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      // We have to be careful with how we slice the block comments
      name: 'Block comment with single annotation (end same line, right after descriptor)',
      code: `
/**
 * @browserbug chrome lower-than 110*/`,
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome lower-than 110 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug safari lower-than-or-equal 15.4 -- This API is not available',
      settings: {
        browserslistQuery: 'safari 15.4',
      },
    },
    {
      code: '// @browserbug chrome lower-than 110',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome lower-than 110, firefox lower-than 107',
      settings: {
        browserslistQuery: 'chrome 109, firefox 106',
      },
    },
    {
      code: '// @browserbug chrome lower-than 110, firefox lower-than 107 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109, firefox 106',
      },
    },
    {
      code: '// @browserbug chrome lt 110 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome lower-than-or-equal 109 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome lte 109 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome equal 109 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome last-checked 109 -- This API is not available',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      name: 'Multiline block with unrelated @browserbug declaration',
      code: `
/**
 *
 * @browserbug chrome last-checked 120, safari last-checked 17.1
 *
 * // Eventually, we could do this:
 * @browserbug-feature mdn-api_htmlelement_focus_options_focusvisible_parameter -- When this is supported, we won't need the workaround
 */
`,
      settings: {
        browserslistQuery: 'chrome 120, safari 17.1',
      },
    },
    {
      name: 'Multiple browserbug declarations (block comment)',
      code: `
/*
 * @browserbug chrome lower-than 110 -- Some stuff
 * @browserbug firefox lower-than 107
*/`,
      settings: {
        browserslistQuery: 'chrome 109, firefox 106',
      },
    },
    // web-feature descriptors
    {
      name: 'web-feature still lacking in a target',
      code: '// @browserbug web-feature scrollend -- Debounced scroll fallback',
      settings: {
        browserslistQuery: 'chrome 109, firefox 130',
      },
    },
    {
      name: 'web-feature mixed with a browser descriptor',
      code: '// @browserbug web-feature scrollend, chrome lower-than 114',
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      name: 'versionDrift: last-checked within the allowed drift',
      // 109 and 110 are newer than 108, so the drift is 2
      code: '// @browserbug chrome last-checked 108',
      options: [{ versionDrift: 2 }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      name: 'versionDrift: counts point releases',
      // 15.5 and 15.6 are newer than 15.4
      code: '// @browserbug safari last-checked 15.4',
      options: [{ versionDrift: 2 }],
      settings: {
        browserslistQuery: 'safari 15.6',
      },
    },
  ],

  invalid: [
    // web-feature descriptors
    {
      code: '// @browserbug web-feature scrollend -- Debounced scroll fallback',
      errors: [{ messageId: 'webFeatureOutdated' }],
      settings: {
        browserslistQuery: 'chrome 120, firefox 130',
      },
    },
    {
      code: '// @browserbug web-feature not-a-real-feature',
      errors: [{ messageId: 'parseError' }],
      settings: {
        browserslistQuery: 'chrome 120',
      },
    },
    // Errors about outdated declaration
    {
      code: '// @browserbug chrome lower-than 109 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome lt 109 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      code: '// @browserbug chrome lower-than-or-equal 109 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      code: '// @browserbug chrome lte 109 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      code: '// @browserbug chrome equal 109 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      code: '// @browserbug chrome last-checked 109 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      name: 'versionDrift: last-checked beyond the allowed drift',
      // 109 and 110 are newer than 108, so the drift is 2
      code: '// @browserbug chrome last-checked 108',
      options: [{ versionDrift: 1 }],
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      name: 'versionDrift: does not apply to explicit upper bounds',
      code: '// @browserbug chrome lower-than 109',
      options: [{ versionDrift: 5 }],
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      name: 'versionDrift: does not apply to unsupported browsers',
      code: '// @browserbug opera last-checked 100',
      options: [{ versionDrift: 5 }],
      errors: [{ messageId: 'unsupported' }],
      settings: {
        browserslistQuery: 'chrome 110',
      },
    },
    {
      name: 'versionDrift: only the descriptor beyond the drift is reported',
      code: '// @browserbug chrome last-checked 109, safari last-checked 15.2',
      options: [{ versionDrift: 1 }],
      // safari: 15.4 and 15.5 are newer than "15.2-15.3", so the drift is 2
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 110, safari 15.5',
      },
    },
    {
      code: '// @browserbug safari lower-than 15.4 -- This API is not available',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'safari 15.4',
      },
    },
    {
      name: 'Multiple descriptors, one of which is invalid',
      code: '// @browserbug chrome lower-than 110, firefox lower-than 107',
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 109, firefox 116',
      },
    },
    {
      name: 'Multiple browserbug declarations, one of which is invalid (line comment)',
      code: `
// @browserbug chrome lower-than 110 -- Some quirk
// @browserbug firefox lower-than 107 -- Some other quirk`,
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 109, firefox 116',
      },
    },
    {
      name: 'Multiple browserbug declarations, one of which is invalid (block comment)',
      code: `
/*
 * @browserbug chrome lower-than 110
 * @browserbug firefox lower-than 107
*/`,
      errors: [{ messageId: 'outdated' }],
      settings: {
        browserslistQuery: 'chrome 109, firefox 116',
      },
    },
    // The browser is not in the query list
    {
      code: '// @browserbug chrome lower-than 117 -- This API is not available',
      errors: [{ messageId: 'unsupported' }],
      settings: {
        browserslistQuery: 'firefox 120',
      },
    },
    // Parsing errors
    // TODO: rename these to validationErrors, to allow switching some off in the future
    {
      code: '// @browserbug unknownBrowser lower-than 80 -- This API is not available',
      errors: [
        {
          messageId: 'parseError',
          line: 1,
          column: 16,
          endLine: 1,
          endColumn: 30,
        },
      ],
    },
    // Parsing errors point at the offending part of the declaration
    {
      name: 'Syntax error (line comment)',
      code: '// @browserbug chrome 120 -- reason',
      errors: [
        {
          messageId: 'parseError',
          data: {
            errorMessage:
              'expected "between", "last-checked", "equal", "lower-than", "lower-than-or-equal", "lt", or "lte", but found "120".',
          },
          line: 1,
          column: 23,
          endLine: 1,
          endColumn: 26,
        },
      ],
    },
    {
      name: 'Syntax error at the end of the declaration (block comment)',
      code: 'const a = 1; /* @browserbug chrome lower-than */',
      errors: [
        {
          messageId: 'parseError',
          data: {
            errorMessage: 'expected a number, but the declaration ended.',
          },
          line: 1,
          column: 46,
          endLine: 1,
          endColumn: 46,
        },
      ],
    },
    {
      name: 'Syntax error (multi-line JSDoc comment)',
      code: `
function f() {
  /**
   * Some context first
   * @browserbug chrome lower-than 110, firefox between 107
   */
}`,
      errors: [
        {
          messageId: 'parseError',
          line: 5,
          column: 60,
          endLine: 5,
          endColumn: 60,
        },
      ],
    },
    {
      name: 'Several validation errors (multi-line block comment)',
      code: `
/*
 * @browserbug chrome lower-than 110
 * @browserbug notabrowser lt 3, chrome lt 20000
 */`,
      errors: [
        {
          messageId: 'parseError',
          line: 4,
          column: 16,
          endLine: 4,
          endColumn: 27,
        },
        {
          messageId: 'parseError',
          line: 4,
          column: 44,
          endLine: 4,
          endColumn: 49,
        },
      ],
      settings: {
        browserslistQuery: 'chrome 109',
      },
    },
    {
      // Not yet released
      code: '// @browserbug chrome lower-than 20000 -- This API is not available',
      errors: [{ messageId: 'parseError' }],
    },
    {
      // Never existed
      code: '// @browserbug safari lower-than 14.9 -- This API is not available',
      errors: [{ messageId: 'parseError' }],
    },
  ],
});
