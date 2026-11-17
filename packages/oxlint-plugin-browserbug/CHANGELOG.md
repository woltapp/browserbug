# @woltapp/oxlint-plugin-browserbug

## 1.0.0

### Major Changes

- Initial release: run the browserbug rules under oxlint, as an oxlint JS plugin
  (`"jsPlugins": ["@woltapp/oxlint-plugin-browserbug"]`). It has the same
  `browserbug/<rule>` ids, options and `browserslistQuery` setting as
  `@woltapp/eslint-plugin-browserbug`, and does not need ESLint installed. It
  ships `browserbug/no-outdated` and the opt-in
  `browserbug/last-checked-updated`.

  The rules are written with oxlint's
  [`createOnce`](https://oxc.rs/docs/guide/usage/linter/js-plugins#alternative-api)
  API, so oxlint sets each rule up once instead of once per file.
  `@woltapp/eslint-plugin-browserbug` runs the same rules on ESLint, through
  `eslintCompatPlugin` from `@oxlint/plugins`.
  - Needs oxlint 1.93 or later, and Node 22.12 or later.
  - The `oxlint` peer dependency is optional, so ESLint users don't get oxlint
    installed through the ESLint plugin.
