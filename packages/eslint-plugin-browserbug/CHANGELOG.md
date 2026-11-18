# @woltapp/eslint-plugin-browserbug

## 1.0.0

### Major Changes

- The packages are now ESM-only, built with `tsc` alone (TypeScript 7) instead
  of tsup.

  - The CommonJS builds are gone. Configs that `import` the packages keep
    working. `require()` still works on the supported Node versions (22.12+),
    through `require(esm)`, but the plugin is now the `.default` export:
    `require('@woltapp/eslint-plugin-browserbug').default`.
  - `@woltapp/eslint-plugin-browserbug` no longer depends on
    `@typescript-eslint/utils` at runtime.
  - `@woltapp/browserbug-core` now publishes only `dist/`. Before, its package
    had no `files` list, so `dist/` (ignored by git) was left out of the
    tarball.

- Node 20 is no longer supported, since it reached end of life. The packages now
  need Node 22.12 or later, the first Node 22 release where `require(esm)` works
  without a flag. `@woltapp/browserbug-core` now declares this in `engines` as
  well.
- Add `web-feature <id>` descriptors, resolved against the web-features dataset.
  The no-outdated rules report them once every browserslist target supports the
  feature.

  Core: `BrowserbugDescriptor` is now `BrowserDescriptor | WebFeatureDescriptor`
  (narrow with `isWebFeatureDescriptor`); `parseBrowserbug` takes an optional
  `{ webFeatures }`; new `getWebFeatureSupportStatus` and `webFeatures` exports.
  `web-features` (^3.0.0) is a new peer dependency of all three packages, like
  `browserslist`. The CommonJS builds now need Node 20.19+ / 22.12+
  (require(esm)), since web-features is ESM-only.

### Minor Changes

- Ship a `browserbug` agent skill under `skills/browserbug`, which teaches
  coding agents when and how to add `@browserbug` annotations. pnpm links it
  into your agent's skills directory once approved
  (https://pnpm.io/agent-skills).
- Make the plugin a first-class flat config plugin, and support ESLint 10.

  - `peerDependencies.eslint` is now `^9 || ^10`.
  - The default export (`module.exports`) is now the plugin object itself, with
    `meta` (`name`, `version`, `namespace: 'browserbug'`), `rules` and
    `configs.recommended`. Use it as `plugins: { browserbug }`.
    `configs.recommended` references this same object, so combining the two no
    longer risks a "Cannot redefine plugin" error.
  - `browserbug.plugin` still works, and refers to the same object.
  - The plugin and configs are typed with ESLint's own types, so they type-check
    in `eslint.config.ts` with `defineConfig()`.
  - Breaking: ESM named imports (`import { configs, plugin } from ...`) no
    longer work, because Node cannot detect them on the new export. Use the
    default import (`import browserbug from ...`) instead.
  - No legacy (`.eslintrc`) configs are shipped, as ESLint 10 removed eslintrc.
    On ESLint 9 with eslintrc, the rules can now be loaded with
    `plugins: ['@woltapp/browserbug']`, since `rules` is exported at the top
    level.

- Add a `last-checked-updated` rule (`browserbug/last-checked-updated` in
  ESLint, `@woltapp/browserbug-comment-last-checked-updated` in Stylelint). It
  reports a `last-checked <version>` descriptor once your browserslist targets
  include a newer version of that browser, prompting you to re-check whether the
  bug is still there. It is not part of the `recommended` config, since it fires
  on every new browser release. `@woltapp/browserbug-core` exports the
  comparison as `getLastCheckedStatus`.

  Like `no-outdated`, it takes a `versionDrift` option: how many releases the
  newest targeted version may be ahead of the checked one before it is reported.
  Within the drift, ESLint does not report and Stylelint reports a warning.

- The rules now live in `@woltapp/oxlint-plugin-browserbug`, written with
  oxlint's
  [`createOnce`](https://oxc.rs/docs/guide/usage/linter/js-plugins#alternative-api)
  API, so oxlint sets each rule up once instead of once per file.
  `@woltapp/eslint-plugin-browserbug` now depends on the oxlint plugin and runs
  the same rules on ESLint through `eslintCompatPlugin` from `@oxlint/plugins`.
  ESLint behaves as before, and does not need oxlint installed.

- Report `@browserbug` parse errors at the offending part of the declaration,
  instead of the whole comment.

  - `parseBrowserbug` errors now carry a `kind` (`'syntax'` or `'validation'`)
    and a `range`: the `[start, end)` offsets of the problem within the input.
    Syntax errors also carry `expected`, what the grammar expected there. The
    error types are exported as `BrowserbugSyntaxError`,
    `BrowserbugValidationError` and `SourceRange`.
  - Both plugins point syntax errors at the unexpected token, and validation
    errors at the unknown browser, version or web-feature id. Each validation
    error is now its own report, instead of one report joining them all.
  - Syntax error messages read `expected …, but found "…".`, instead of carrying
    a line and column relative to the declaration rather than the file.
  - The Stylelint rule's reports no longer start at the `/*` of the comment;
    they start at the `@browserbug` opener.

- Add a `versionDrift` option to the no-outdated rules: how many browser
  releases a `last-checked` version may fall behind the lowest supported version
  before it is reported. Stylelint reports declarations within the drift as
  warnings; ESLint does not report them. Drift is counted in browser releases,
  so it works the same for Chrome major versions and Safari point releases. It
  does not change other comparators, and the default (`0`) keeps today's
  behaviour.

  Core: new `getVersionDriftStatus` and `isValidVersionDrift` exports, for rules
  that compare `last-checked` versions against a reference version.

### Patch Changes

- Update `@typescript-eslint/utils` to 8.72.1.
- Updated dependencies
  - @woltapp/oxlint-plugin-browserbug@1.0.0

## 0.1.0

### Minor Changes

- 344950d: Initial public release
