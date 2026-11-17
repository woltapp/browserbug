import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';
import plugin from '../../../lib/index.js';

// Tested through the ESLint plugin, so these cover the `create` that
// `eslintCompatPlugin` derives from the rule's `createOnce`.
const rule = plugin.rules['last-checked-updated'] as unknown as RuleModule<
  string,
  unknown[]
>;

const ruleTester = new RuleTester();

const settings = {
  browserslistQuery: 'chrome 120, chrome 121, chrome 122, safari 17.2',
};

ruleTester.run('last-checked-updated', rule, {
  valid: [
    {
      code: 'function helloWorld() {}',
      name: 'No comment',
      settings,
    },
    {
      code: '// @browserbug chrome last-checked 122',
      name: 'Checked against the newest targeted version',
      settings,
    },
    {
      code: '// @browserbug chrome last-checked 130',
      name: 'Checked against a version newer than every target',
      settings,
    },
    {
      code: '// @browserbug safari last-checked 17.2, chrome last-checked 122 -- Some API',
      name: 'Multiple up-to-date descriptors',
      settings,
    },
    {
      code: '// @browserbug firefox last-checked 100',
      name: 'Browser that is not targeted',
      settings,
    },
    {
      code: '// @browserbug chrome lower-than 121, chrome equal 120, chrome between 110 120',
      name: 'Other comparators are ignored',
      settings,
    },
    {
      code: '// @browserbug web-feature scrollend',
      name: 'web-feature descriptors are ignored',
      settings,
    },
    {
      code: '// @browserbug Invalid syntax',
      name: 'Parse errors are left to no-outdated',
      settings,
    },
    {
      // 121 and 122 are newer than 120, so the drift is 2
      code: '// @browserbug chrome last-checked 120',
      name: 'Within the versionDrift',
      settings,
      options: [{ versionDrift: 2 }],
    },
  ],
  invalid: [
    {
      code: '// @browserbug chrome last-checked 120 -- Some API',
      name: 'Newer version targeted',
      settings,
      errors: [
        {
          messageId: 'updated',
          data: {
            browser: 'chrome',
            lastCheckedVersion: '120',
            highestVersion: '122',
          },
        },
      ],
    },
    {
      code: '// @browserbug safari last-checked 17.1, chrome last-checked 121',
      name: 'Multiple descriptors, all updated',
      settings,
      errors: [
        {
          messageId: 'updated',
          data: {
            browser: 'safari',
            lastCheckedVersion: '17.1',
            highestVersion: '17.2',
          },
        },
        {
          messageId: 'updated',
          data: {
            browser: 'chrome',
            lastCheckedVersion: '121',
            highestVersion: '122',
          },
        },
      ],
    },
    {
      code: `
/**
 * @browserbug chrome last-checked 121
 * @browserbug safari last-checked 17.2
 * @browserbug chrome last-checked 119
 */`,
      name: 'Block comment with multiple declarations',
      settings,
      errors: [{ messageId: 'updated' }, { messageId: 'updated' }],
    },
    {
      code: '/* @browserbug chrome last-checked 121*/',
      name: 'Block comment ending right after the descriptor',
      settings,
      errors: [{ messageId: 'updated' }],
    },
    {
      code: '// @browserbug chrome last-checked 120',
      name: 'Beyond the versionDrift',
      settings,
      options: [{ versionDrift: 1 }],
      errors: [{ messageId: 'updated' }],
    },
  ],
});
