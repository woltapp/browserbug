import browserslist from 'browserslist';
import dedent from 'dedent';
import { getTestRule } from 'jest-preset-stylelint';
import stylelint, { type Rule } from 'stylelint';
import { describe, expect, test } from 'vitest';
import plugin, {
  messages as pluginMessages,
  type SecondaryOptions,
} from '../../../lib/rules/browserbug-comment-no-outdated.js';

const plugins = [plugin];

const {
  ruleName,
  rule: { messages },
} = plugin as {
  ruleName: string;
  rule: Rule & { messages: typeof pluginMessages };
};

const testRule = getTestRule({ plugins });

const unknownBrowserMessage = (browser: string) =>
  `Unknown browser named ${browser}. Must be one of ${Object.keys(browserslist.data).join(', ')}.`;

testRule({
  plugins,
  ruleName,
  config: [
    true,
    {
      browserslistQuery: 'chrome 109, firefox 107, safari 15.4',
    } satisfies SecondaryOptions,
  ],
  accept: [
    {
      code: '/* Nothing to do here */ .my-class {}',
      description: 'No @browserbug comment',
    },
    {
      code: '/* @browserbug chrome lower-than 110 -- Some API */ .my-class {}',
      description: 'Valid syntax, supported browser, comment',
    },
    {
      code: '/* @browserbug chrome lower-than 110 */ .my-class {}',
      description: 'Valid syntax, supported browser, no comment',
    },
    {
      code: '/* @browserbug chrome equal 120, safari equal 16, firefox equal 109 -- This API does not exist */ .my-class {}',
      description: 'Valid syntax, multiple supported browsers, comment',
    },
    {
      code: '/* @browserbug chrome equal 120, safari equal 16, firefox equal 109 */ .my-class {}',
      description: 'Valid syntax, multiple supported browsers, no comment',
    },
    {
      code: dedent`
        /* 
         * @browserbug chrome equal 120 */ .my-class {}
        `,
      description: 'Valid syntax, multiline, no comment, end same line',
    },
    {
      code: dedent`
        /* 
         * @browserbug chrome equal 120*/ .my-class {}
        `,
      description:
        'Valid syntax, multiline, no comment, end same line, after descriptor',
    },
    {
      code: dedent`
        /* @browserbug chrome equal 120, safari equal 16, firefox equal 109
         * Some other comments here
        */ .my-class {}
        `,
      description:
        'Valid syntax, multiline, multiple supported browsers, no comment',
    },
    {
      code: dedent`
        /* @browserbug chrome equal 120
         * @browserbug safari equal 16
         * @browserbug firefox equal 109
        */ .my-class {}
        `,
      description: 'Valid syntax, mulitline, multiple @browserbug statements',
    },
    {
      code: '/* @browserbug web-feature scroll-driven-animations -- Fade */ .my-class {}',
      description: 'web-feature still lacking in a target',
    },
  ],

  reject: [
    {
      code: '/* @browserbug web-feature grid */ .my-class {}',
      description: 'web-feature supported by every target',
      message: messages.webFeatureOutdated('grid'),
      line: 1,
      endLine: 1,
      column: 4,
      endColumn: 32,
    },
    {
      code: '/* @browserbug web-feature not-a-real-feature */ .my-class {}',
      description: 'Unknown web-feature',
      message: messages.parseError(
        'Unknown web-feature not-a-real-feature. See https://web-platform-dx.github.io/web-features-explorer/ for feature ids.',
      ),
      line: 1,
      endLine: 1,
      column: 28,
      endColumn: 46,
    },
    {
      // FIXME: We have to specify the error here, but that's pretty annoying.
      // Maybe there is a way to specify an id instead? We can revisit this when
      // we decide how the parser will be exposing errors.
      code: '/* @browserbug chrome 120 */ .my-class {}',
      description: 'Invalid syntax',
      message: messages.parseError(
        `expected "between", "last-checked", "equal", "lower-than", "lower-than-or-equal", "lt", or "lte", but found "120".`,
      ),
      line: 1,
      endLine: 1,
      column: 23,
      endColumn: 26,
    },
    {
      code: '/* @browserbug opera lower-than 100 */ .my-class {}',
      description: 'Unsupported browser',
      message: messages.unsupported('opera'),
      line: 1,
      endLine: 1,
      column: 4,
      endColumn: 36,
    },
    {
      code: '/* @browserbug chrome lower-than 100 */ .my-class {}',
      description: 'Outdated browser',
      message: messages.outdated('chrome', '100', '109'),
      line: 1,
      endLine: 1,
      column: 4,
      endColumn: 37,
    },
    {
      // TODO: To implement this one, we must first track the match intervals in
      // the parser; might not be worth it
      skip: true,
      code: `/* @browserbug opera lower-than 100, chrome lower-than 100 */ .my-class {}`,
      description: 'Multiple warnings (single line)',
    },
    {
      code: dedent`
        /* @browserbug chrome 120
         * @browserbug opera lower-than 100
         * @browserbug chrome lower-than 100
        */
        .my-class {}`,
      description: 'Multiple warnings (multiline)',
      message: messages.outdated('chrome', '100', '109'),
      warnings: [
        {
          message: messages.parseError(
            `expected "between", "last-checked", "equal", "lower-than", "lower-than-or-equal", "lt", or "lte", but found "120".`,
          ),
          line: 1,
          endLine: 1,
          column: 23,
          endColumn: 26,
        },
        {
          message: messages.unsupported('opera'),
          line: 2,
          endLine: 2,
          column: 4,
          endColumn: 36,
        },
        {
          message: messages.outdated('chrome', '100', '109'),
          line: 3,
          endLine: 3,
          column: 4,
          endColumn: 37,
        },
      ],
    },
    {
      code: '/* @browserbug chrome lower-than */ .my-class {}',
      description: 'Invalid syntax, declaration ends early',
      message: messages.parseError(
        'expected a number, but the declaration ended.',
      ),
      line: 1,
      endLine: 1,
      column: 33,
      // Stylelint widens the empty range at the end of the declaration
      endColumn: 34,
    },
    {
      code: '/* @browserbug notabrowser lt 3, alsonot lt 4 */ .my-class {}',
      description: 'Several validation errors on one line',
      warnings: [
        {
          message: messages.parseError(unknownBrowserMessage('notabrowser')),
          line: 1,
          endLine: 1,
          column: 16,
          endColumn: 27,
        },
        {
          message: messages.parseError(unknownBrowserMessage('alsonot')),
          line: 1,
          endLine: 1,
          column: 34,
          endColumn: 41,
        },
      ],
    },
    {
      code: dedent`
        .my-class {
          /**
           * Some context first
           *   @browserbug chrome lower-than 120, firefox between 107
           */
          color: red;
        }`,
      description: 'Invalid syntax, indented multi-line comment',
      message: messages.parseError(
        'expected a number, but the declaration ended.',
      ),
      line: 4,
      endLine: 4,
      column: 62,
      endColumn: 63,
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
            { browserslistQuery: 'chrome 110', ...secondaryOptions },
          ],
        },
      },
    });
    return result;
  }

  test('reports last-checked within the drift as a warning', async () => {
    // 109 and 110 are newer than 108, so the drift is 2
    const result = await lint('/* @browserbug chrome last-checked 108 */', {
      versionDrift: 2,
    });
    expect(result.warnings).toMatchObject([
      {
        text: messages.outdated('chrome', '108', '110'),
        severity: 'warning',
      },
    ]);
  });

  test('reports last-checked beyond the drift at the rule severity', async () => {
    const result = await lint('/* @browserbug chrome last-checked 108 */', {
      versionDrift: 1,
    });
    expect(result.warnings).toMatchObject([
      {
        text: messages.outdated('chrome', '108', '110'),
        severity: 'error',
      },
    ]);
  });

  test('defaults to no tolerated drift', async () => {
    const result = await lint('/* @browserbug chrome last-checked 109 */', {});
    expect(result.warnings).toMatchObject([{ severity: 'error' }]);
  });

  test('does not apply to explicit upper bounds', async () => {
    const result = await lint('/* @browserbug chrome lower-than 109 */', {
      versionDrift: 5,
    });
    expect(result.warnings).toMatchObject([{ severity: 'error' }]);
  });

  test.each([-1, 1.5, '2'])('rejects versionDrift: %j', async (value) => {
    const result = await lint('/* @browserbug chrome last-checked 108 */', {
      versionDrift: value as number,
    });
    expect(result.invalidOptionWarnings).toHaveLength(1);
  });
});
