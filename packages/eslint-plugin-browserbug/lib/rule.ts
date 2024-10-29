import { ESLintUtils } from '@typescript-eslint/utils';

export interface ESLintPluginBrowserbugSettings {
  browserslistQuery?: string;
}

// Using declaration merging to provide the default settings
declare module '@typescript-eslint/utils/ts-eslint' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface SharedConfigurationSettings
    extends ESLintPluginBrowserbugSettings {}
}

export interface PluginDocs {
  description: string;
  recommended?: boolean;
  requiresTypeChecking?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<PluginDocs>(
  (name) =>
    `https://github.com/woltapp/browserbug/blob/main/packages/eslint-plugin-browserbug/docs/rules/${name}`,
);
