import dedent from 'dedent';
import { getTestRule } from 'jest-preset-stylelint';
import stylelint, { type Rule } from 'stylelint';
import { describe, expect, test } from 'vitest';
import plugin, {
  messages as pluginMessages,
  type SecondaryOptions,
} from '../../../lib/rules/browserbug-comment-last-checked-updated.js';

const plugins = [plugin];

const {
  ruleName,
  rule: { messages },
} = plugin as {
  ruleName: string;
  rule: Rule & { messages: typeof pluginMessages };
};

const testRule = getTestRule({ plugins });

testRule({
  plugins,
  ruleName,
  config: [
    true,
    {
      browserslistQuery: 'chrome 120, chrome 121, chrome 122, safari 17.2',
    } satisfies SecondaryOptions,
  ],
  accept: [
    {
      code: '/* Nothing to do here */ .my-class {}',
      description: 'No @browserbug comment',
    },
    {
      code: '/* @browserbug chrome last-checked 122 */ .my-class {}',
      description: 'Checked against the newest targeted version',
    },
    {
      code: '/* @browserbug chrome last-checked 130 */ .my-class {}',
      description: 'Checked against a version newer than every target',
    },
    {
      code: '/* @browserbug safari last-checked 17.2, chrome last-checked 122 -- Some API */ .my-class {}',
      description: 'Multiple up-to-date descriptors',
    },
    {
      code: '/* @browserbug firefox last-checked 100 */ .my-class {}',
      description: 'Browser that is not targeted',
    },
    {
      code: '/* @browserbug chrome lower-than 121, chrome equal 120, chrome between 110 120 */ .my-class {}',
      description: 'Other comparators are ignored',
    },
    {
      code: '/* @browserbug web-feature scrollend */ .my-class {}',
      description: 'web-feature descriptors are ignored',
    },
    {
      code: '/* @browserbug Invalid syntax */ .my-class {}',
      description: 'Parse errors are left to no-outdated',
    },
  ],
  reject: [
    {
      code: '/* @browserbug chrome last-checked 120 -- Some API */ .my-class {}',
      description: 'Newer version targeted',
      message: messages.updated('chrome', 120, 122),
    },
    {
      code: '/* @browserbug safari last-checked 17.1, chrome last-checked 121 */ .my-class {}',
      description: 'Multiple descriptors, all updated',
      warnings: [
        { message: messages.updated('safari', 17.1, 17.2) },
        { message: messages.updated('chrome', 121, 122) },
      ],
    },
    {
      code: dedent`
        /*
         * @browserbug chrome last-checked 121
         * @browserbug safari last-checked 17.2
         * @browserbug chrome last-checked 119
         */ .my-class {}
        `,
      description: 'Multiline comment with multiple declarations',
      warnings: [
        { message: messages.updated('chrome', 121, 122) },
        { message: messages.updated('chrome', 119, 122) },
      ],
    },
  ],
});

// jest-preset-stylelint does not assert on severity, so lint directly
describe('versionDrift', () => {
  async function lint(code: string, secondaryOptions: SecondaryOptions) {
    const {
      results: [result],
    } = await stylelint.lint({
      code,
      config: {
        plugins,
        rules: {
          [ruleName]: [
            true,
            {
              browserslistQuery: 'chrome 120, chrome 121, chrome 122',
              ...secondaryOptions,
            },
          ],
        },
      },
    });
    return result;
  }

  test('reports within the drift as a warning', async () => {
    // 121 and 122 are newer than 120, so the drift is 2
    const result = await lint('/* @browserbug chrome last-checked 120 */', {
      versionDrift: 2,
    });
    expect(result.warnings).toMatchObject([
      { text: messages.updated('chrome', 120, 122), severity: 'warning' },
    ]);
  });

  test('reports beyond the drift at the rule severity', async () => {
    const result = await lint('/* @browserbug chrome last-checked 120 */', {
      versionDrift: 1,
    });
    expect(result.warnings).toMatchObject([
      { text: messages.updated('chrome', 120, 122), severity: 'error' },
    ]);
  });

  test.each([-1, 1.5, '2'])('rejects versionDrift: %j', async (value) => {
    const result = await lint('/* @browserbug chrome last-checked 120 */', {
      versionDrift: value as number,
    });
    expect(result.invalidOptionWarnings).toHaveLength(1);
  });
});
