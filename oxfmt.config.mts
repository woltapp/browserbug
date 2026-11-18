import { defineConfig } from 'oxfmt';

// Ported from the previous Prettier config. Options are scoped per language,
// like before, so that for example YAML keeps double quotes.
export default defineConfig({
  // oxfmt defaults to 100, Prettier to 80. Keep the existing line length.
  printWidth: 80,
  // Patterns are relative to this file, and apply when running from a package
  // directory as well.
  ignorePatterns: [
    '**/*.ohm-bundle.*',
    '**/dist/',
    // Copied from the root skills/ on prepack.
    'packages/*/skills/',
    '**/pnpm-lock.yaml',
    '.tsup',
  ],
  // VS Code does not support json5 (especially autocomplete/schemas), so we
  // need to associate those files as jsonc. Formatting it as JSON keeps it
  // compatible, for example avoiding unquoted properties and dangling commas,
  // which are only supported in json5.
  associations: [{ files: ['renovate.json5'], language: 'json' }],
  overrides: [
    {
      files: ['*.{ts,tsx,js,jsx,mjs,mts,cjs,cts}'],
      options: {
        singleQuote: true,
        quoteProps: 'consistent',
        trailingComma: 'all',
        arrowParens: 'always',
      },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'always',
      },
    },
  ],
});
