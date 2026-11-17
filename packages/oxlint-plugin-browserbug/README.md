# `@woltapp/oxlint-plugin-browserbug`

> Lint rules for documenting, and eventually removing, browser bug workarounds,
> for [oxlint](https://oxc.rs/docs/guide/usage/linter).

This is the
[oxlint JS plugin](https://oxc.rs/docs/guide/usage/linter/js-plugins) for
browserbug. It has the same rules, with the same ids (`browserbug/<rule>`),
options and messages, as
[`@woltapp/eslint-plugin-browserbug`](https://github.com/woltapp/browserbug/blob/main/packages/eslint-plugin-browserbug).
See that package for the motivation and the `@browserbug` comment syntax.

The rules are defined here, with oxlint's
[`createOnce`](https://oxc.rs/docs/guide/usage/linter/js-plugins#alternative-api)
API, so oxlint sets each rule up once instead of once per file. The ESLint
plugin runs the same rules on ESLint, through `eslintCompatPlugin`.

## Usage

### Step 1: Install

```sh
npm i -D oxlint @woltapp/oxlint-plugin-browserbug browserslist web-features
```

`oxlint` (1.93 or later), `browserslist` and `web-features` are peer
dependencies. Keep `web-features` updated, since its data is only as current as
the version you have installed.

### Step 2: Configure oxlint

Load the plugin through `jsPlugins` in your
[`.oxlintrc.json`](https://oxc.rs/docs/guide/usage/linter/config), and enable
its rules:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "jsPlugins": ["@woltapp/oxlint-plugin-browserbug"],
  "rules": {
    "browserbug/no-outdated": "error"
  }
}
```

oxlint reports the rule as `browserbug(no-outdated)`.

`browserbug/last-checked-updated` is opt-in, like in ESLint: it fires on every
new browser release, so it is usually run as a warning, optionally with a
`versionDrift`:

```json
{
  "rules": {
    "browserbug/no-outdated": "error",
    "browserbug/last-checked-updated": ["warn", { "versionDrift": 2 }]
  }
}
```

### Step 3: Point it at your browserslist config

Like the ESLint plugin, the rules compare annotations against your
[browserslist config](https://browsersl.ist/). There are two ways to provide it:

- A browserslist config in your project (`.browserslistrc`, or a `browserslist`
  entry in `package.json`). It is resolved from the directory oxlint runs in, so
  run oxlint from the project root.
- A `browserslistQuery` setting, which takes precedence:

  ```json
  {
    "jsPlugins": ["@woltapp/oxlint-plugin-browserbug"],
    "settings": {
      "browserslistQuery": "chrome 120, firefox 130, safari 17"
    },
    "rules": {
      "browserbug/no-outdated": "error"
    }
  }
  ```

### Step 4: Use browserbug comments in code

```ts
// @browserbug safari lower-than 17 -- Some comment here
// @browserbug web-feature scrollend -- Settle on a debounced scroll instead
```

See the
[ESLint plugin's documentation](https://github.com/woltapp/browserbug/blob/main/packages/eslint-plugin-browserbug/README.md#step-3-use-browserbug-comments-in-code)
for every descriptor.

Disable directives use the same rule id, for example
`// oxlint-disable-next-line browserbug/no-outdated`. oxlint also honours
`eslint-disable` directives, so existing ones keep working.

## Notes and limitations

- oxlint's JS plugin support is
  [in alpha](https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha). This
  package is tested against the oxlint version in its `devDependencies`.
- Using both oxlint and ESLint? Enable `browserbug/*` rules in only one of them,
  so that each annotation is reported once.

## Development

The rule modules live in `src/rules`. `@woltapp/eslint-plugin-browserbug`
imports them from this package, so a change to a rule ships through this
package; changesets bumps the ESLint plugin as a dependent. The ESLint plugin's
`RuleTester` tests run the rules through `eslintCompatPlugin`, and the rule docs
are generated in that package.

`pnpm test` runs the real `oxlint` binary against the fixture projects in
`tests/fixtures`, with the built plugin, so run `pnpm build` first.

## Agent skill

This package ships a `browserbug` agent skill, which teaches coding agents to
add and resolve `@browserbug` annotations. See
[Agent skill](https://github.com/woltapp/browserbug#agent-skill) for how to
install it.

## Rules

| Name                                                                                                                                         | Description                                                                                                               |
| :------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| [last-checked-updated](https://github.com/woltapp/browserbug/blob/main/packages/eslint-plugin-browserbug/docs/rules/last-checked-updated.md) | Reports `last-checked` browser workarounds, if browserslist targets a newer version of that browser than the one checked. |
| [no-outdated](https://github.com/woltapp/browserbug/blob/main/packages/eslint-plugin-browserbug/docs/rules/no-outdated.md)                   | Ensures that no browser workarounds exist, if browserslist support for that browser is outside the specified range.       |
