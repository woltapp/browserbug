// Typed with ESLint's own types (rather than typescript-eslint's `FlatConfig`),
// so the configs are accepted by `defineConfig()` from `eslint/config`.
import type { ESLint, Linter, Rule } from 'eslint';

import { createRequire } from 'node:module';

import oxlintPlugin from '@woltapp/oxlint-plugin-browserbug';
import { eslintCompatPlugin } from '@oxlint/plugins';

import recommended from './configs/recommended.js';

// Read at runtime, from `dist/` or `lib/`, both one level below package.json
const pkg = createRequire(import.meta.url)('../package.json') as {
  name: string;
  version: string;
};

// The rules live in `@woltapp/oxlint-plugin-browserbug`, written against
// oxlint's `createOnce` API. `eslintCompatPlugin` gives each rule the `create`
// that ESLint calls, which delegates to `createOnce`. It converts the rule
// objects in place, so they are shared with the oxlint plugin; oxlint ignores
// `create` when a rule has `createOnce`.
//
// We expose the rules with ESLint's types, so that the plugin type-checks in
// `eslint.config.ts`. They are the same objects at runtime.
const rules = eslintCompatPlugin({
  meta: { name: 'browserbug' },
  rules: { ...oxlintPlugin.rules },
}).rules as unknown as Record<
  'last-checked-updated' | 'no-outdated',
  Rule.RuleModule
>;

interface BrowserbugPlugin extends ESLint.Plugin {
  meta: { name: string; version: string; namespace: string };
  rules: typeof rules;
  configs: { recommended: Linter.Config };
  /**
   * The plugin itself.
   * @deprecated Use the default export directly, for example
   * `plugins: { browserbug }`. Kept so that `browserbug.plugin` keeps working.
   */
  plugin: BrowserbugPlugin;
}

// The configs reference the plugin object, and the plugin exposes the configs,
// so we create the plugin first and fill in `configs` and `plugin` afterwards.
// The same pattern is recommended in
// https://eslint.org/docs/latest/extend/plugins#configs-in-plugins
const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
    namespace: 'browserbug',
  },
  rules,
  configs: {},
} as BrowserbugPlugin;

plugin.configs.recommended = recommended(plugin);
plugin.plugin = plugin;

// ESM-only: a default export of the plugin object. Every loader (a static or
// dynamic `import`, `require(esm)` on Node 22.12+, or jiti for
// `eslint.config.ts`) yields the same object, which ESLint needs to avoid
// "Cannot redefine plugin" errors when combining `configs.recommended` with
// `plugins: { browserbug }`.
export default plugin;
