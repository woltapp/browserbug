import { definePlugin } from '@oxlint/plugins';

import lastCheckedUpdated from './rules/last-checked-updated.js';
import noOutdated from './rules/no-outdated.js';

export type { BrowserbugSettings } from './rule.js';

// The rules are written against oxlint's `createOnce` API, so oxlint sets each
// rule up once rather than once per file.
// `@woltapp/eslint-plugin-browserbug` runs the same rules on ESLint, by
// wrapping them with `eslintCompatPlugin`.
const plugin = definePlugin({
  meta: {
    // Keep the rule ids identical to the ESLint plugin (`browserbug/<rule>`),
    // so that `eslint-disable browserbug/...` comments and configs carry over.
    name: 'browserbug',
  },
  rules: {
    'last-checked-updated': lastCheckedUpdated,
    'no-outdated': noOutdated,
  },
});

export default plugin;
