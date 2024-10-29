import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../../lib/rules/no-outdated';

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
  ],

  invalid: [
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
      errors: [{ messageId: 'parseError' }],
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
