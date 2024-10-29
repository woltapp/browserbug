import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';

import pkg from '../package.json';
import recommended from './configs/recommended';

import noOutdatedRule from './rules/no-outdated';

const plugin: FlatConfig.Plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: {
    'no-outdated': noOutdatedRule,
  },
};

const configs = {
  /* We do this little indirection to avoid issues with circular references in
   * CJS; the config requires the plugin, but the plugin also requires the
   * config. Inspired by:
   * https://github.com/typescript-eslint/typescript-eslint/blob/1edec1d56ccad98fa65f57ac54fe8abbb1d3a922/packages/typescript-eslint/src/index.ts#L9
   */
  recommended: recommended(plugin),
};

// `exports` is intentional, to allow using the default export in both Node and
// bundlers
exports = {
  configs,
  plugin,
};

// provide named exports for convenience
export { configs, plugin };
