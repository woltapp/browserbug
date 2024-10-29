import dedent from 'dedent';
import { getTestRule } from 'jest-preset-stylelint';
import { Rule } from 'stylelint';
import plugin, {
  messages as pluginMessages,
  type SecondaryOptions,
} from '../../../lib/rules/browserbug-comment-no-outdated';

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
  ],

  reject: [
    {
      // FIXME: We have to specify the error here, but that's pretty annoying.
      // Maybe there is a way to specify an id instead? We can revisit this when
      // we decide how the parser will be exposing errors.
      code: '/* @browserbug chrome 120 */ .my-class {}',
      description: 'Invalid syntax',
      message: messages.parseError(
        `Line 1, col 20: expected "between", "last-checked", "equal", "lower-than", "lower-than-or-equal", "lt", or "lte"`,
      ),
      line: 1,
      endLine: 1,
      column: 1,
      endColumn: 20,
    },
    {
      code: '/* @browserbug opera lower-than 100 */ .my-class {}',
      description: 'Unsupported browser',
      message: messages.unsupported('opera'),
      line: 1,
      endLine: 1,
      column: 1,
      endColumn: 33,
    },
    {
      code: '/* @browserbug chrome lower-than 100 */ .my-class {}',
      description: 'Outdated browser',
      message: messages.outdated('chrome', '100', '109'),
      line: 1,
      endLine: 1,
      column: 1,
      endColumn: 34,
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
            `Line 1, col 20: expected "between", "last-checked", "equal", "lower-than", "lower-than-or-equal", "lt", or "lte"`,
          ),
          line: 1,
          endLine: 1,
          column: 1,
          endColumn: 20,
        },
        {
          message: messages.unsupported('opera'),
          line: 2,
          endLine: 2,
          column: 1,
          endColumn: 33,
        },
        {
          message: messages.outdated('chrome', '100', '109'),
          line: 3,
          endLine: 3,
          column: 1,
          endColumn: 34,
        },
      ],
    },
  ],
});
