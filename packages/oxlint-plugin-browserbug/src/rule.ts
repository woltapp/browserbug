import type {
  Context,
  CreateOnceRule,
  DiagnosticData,
  Location,
  RuleMeta,
  VisitorWithHooks,
} from '@oxlint/plugins';

/** Shared settings, for both oxlint (`settings`) and ESLint (`settings`). */
export interface BrowserbugSettings {
  browserslistQuery?: string;
}

/**
 * oxlint's `Context`, narrowed to what these rules use: typed settings, and
 * `report` limited to the rule's own message ids.
 */
export type BrowserbugContext<MessageIds extends string> = Omit<
  Context,
  'report' | 'settings'
> & {
  readonly settings: Readonly<BrowserbugSettings>;
  report(
    this: void,
    diagnostic: {
      messageId: MessageIds;
      loc: Location;
      data?: DiagnosticData;
    },
  ): void;
};

export interface RuleDefinition<
  Options extends readonly unknown[],
  MessageIds extends string,
> {
  name: string;
  meta: Omit<RuleMeta, 'messages' | 'defaultOptions' | 'docs'> & {
    docs: {
      description: string;
      recommended: boolean;
      requiresTypeChecking: boolean;
    };
    messages: Record<MessageIds, string>;
    defaultOptions: Options;
  };
  /**
   * Called once per rule, not per file, following oxlint's
   * [`createOnce`](https://oxc.rs/docs/guide/usage/linter/js-plugins#alternative-api)
   * API. Only the visitors may read per-file state, such as `context.settings`
   * or `context.sourceCode`. `getOptions` returns the current file's options,
   * merged with `meta.defaultOptions`.
   */
  createOnce: (
    context: BrowserbugContext<MessageIds>,
    getOptions: () => Options,
  ) => VisitorWithHooks;
}

const docsUrl = (name: string) =>
  `https://github.com/woltapp/browserbug/blob/main/packages/eslint-plugin-browserbug/docs/rules/${name}`;

/**
 * Defines a rule with oxlint's `createOnce` API, adding the docs URL and the
 * defaults for the options. `@woltapp/eslint-plugin-browserbug` runs the
 * same rules on ESLint, through `eslintCompatPlugin`.
 */
export function createRule<
  Options extends readonly unknown[],
  MessageIds extends string,
>({
  name,
  meta,
  createOnce,
}: RuleDefinition<Options, MessageIds>): CreateOnceRule {
  const { defaultOptions } = meta;

  return {
    meta: {
      ...meta,
      docs: { ...meta.docs, url: docsUrl(name) },
    } as unknown as RuleMeta,
    createOnce(context) {
      const browserbugContext = context as BrowserbugContext<MessageIds>;
      return createOnce(browserbugContext, () =>
        // oxlint, and ESLint since 9.15, already merge `meta.defaultOptions`
        // into `context.options`. Merging again keeps older ESLint 9 working.
        applyDefault(defaultOptions, context.options),
      );
    },
  };
}

function applyDefault<Options extends readonly unknown[]>(
  defaultOptions: Options,
  userOptions: readonly unknown[] | undefined,
): Options {
  return defaultOptions.map((defaultOption, i) => {
    const userOption = userOptions?.[i];
    if (userOption === undefined) {
      return defaultOption;
    }
    return isPlainObject(defaultOption) && isPlainObject(userOption)
      ? { ...defaultOption, ...userOption }
      : userOption;
  }) as unknown as Options;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
