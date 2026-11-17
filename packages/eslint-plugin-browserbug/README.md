# `@woltapp/eslint-plugin-browserbug`

> Lint rules for documenting, and eventually removing, browser bug workarounds.

## Motivation

As a web frontend codebase grows, it accumulates codepaths that work around
specific browser bugs, quirks, and implementation details. These workarounds are
often a pragmatic choice, in order to get things to work or look correct.

Over a long period of time, these browser bug workarounds end up looking
mysterious at best, and scary at worst. It often seems better to "leave them
be", or risk things breaking. This accumulation of workarounds can make
codepaths less efficient, leads to larger bundle sizes, and makes the codebase
less inviting.

To tackle this problem, these lint rules offer a way to document such browser
bugs and their versions, and to warn you when the browser versions change.

The rules are backed by your project's
[browserslist config](https://github.com/browserslist/browserslist#browserslist-).
Browserslist is commonly used by similar tools, such as automated code
transpilation via Babel, SWC, and PostCSS. Thus, you are prompted to change
things _at a pace dictated by your project's browser support_, instead of
arbitrary version numbers.

While automated tools and code transpilation go a long way, there are categories
of bugs, workarounds and manual feature detection, that require some manual
intervention. These lint rules tackle this space.

### Example

Imagine you are feature-detecting a specific browser API. When your support
targets change, the linter will notify you to re-evaluate, and change either the
code or the annotation.

```tsx
// @browserbug safari last-checked 17.2, chrome last-checked 120 -- Does not support {focusVisible} option
if (!supportsFocusVisibleOption()) {
  /* complex workaround */
} else {
  element.focus({ focusVisible: true });
}
```

## Usage

### Step 1: Install the plugin

The plugin supports ESLint 9 and 10, with
[flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
`browserslist` and `web-features` are peer dependencies.

```sh
npm i --save-dev eslint @woltapp/eslint-plugin-browserbug browserslist web-features
```

### Step 2: Configure rules

Add browserbug to your
[ESLint configuration file](https://eslint.org/docs/latest/use/configure/configuration-files)
(`eslint.config.js`, `eslint.config.mjs` or `eslint.config.ts`).

If you use the recommended config:

```js
// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import browserbug from '@woltapp/eslint-plugin-browserbug';

export default defineConfig(browserbug.configs.recommended, {
  rules: {
    // customise any rules here
    'browserbug/no-outdated': 'warn',
  },
});
```

This sets you up with the recommended set of rules. You can configure the rules
you want to use under the rules section. You can also use the config with
`extends`, for example to scope it to some files:

```js
export default defineConfig({
  files: ['src/**/*.{js,ts,tsx}'],
  extends: [browserbug.configs.recommended],
});
```

Alternatively, you can specify only the plugin, and set each rule separately

```js
import { defineConfig } from 'eslint/config';
import browserbug from '@woltapp/eslint-plugin-browserbug';

export default defineConfig({
  plugins: {
    browserbug,
  },
  rules: {
    'browserbug/no-outdated': 'error',
  },
});
```

The default export is the plugin object itself, with `meta`, `rules` and
`configs`. `browserbug.plugin` refers to the same object, and is kept for
existing configs.

The same works in `eslint.config.js` (in an ESM package), and in
`eslint.config.ts`, which the plugin's types support with both ESLint 9 and 10.
Loading `eslint.config.ts` needs [`jiti`](https://github.com/unjs/jiti) or
Node's native TypeScript support; see
[TypeScript configuration files](https://eslint.org/docs/latest/use/configure/configuration-files#typescript-configuration-files).

The plugin does not ship legacy (`.eslintrc`) configs, since ESLint 10 removed
eslintrc support. On ESLint 9 with eslintrc, you can still load the rules with
`"plugins": ["@woltapp/browserbug"]` and
`"rules": { "@woltapp/browserbug/no-outdated": "error" }`.

Note: for the rules to practically work, you must also specify a
[browserslist config](https://browsersl.ist/) in you repository. Any of the
supported browserslist methods would work, for example a `browserslist` entry in
`package.json`. You can also set the query in ESLint's shared settings, which
takes precedence:

```js
export default defineConfig(browserbug.configs.recommended, {
  settings: {
    browserslistQuery: 'defaults',
  },
});
```

### Step 3: Use browserbug comments in code

The plugin works via code comments.

Comments are prefixed as `@browserbug`, and include a list of descriptors.
Descriptors can be comma separated. A comment can follow the list of
descriptors, starting with `--`.

```ts
// The no-outdated rule will report an error if the specified range is no longer supported.
//
// @browserbug safari lower-than-or-equal 15.4 -- Some comment here
// @browserbug safari lte 15.4
// @browserbug safari lower-than 16.0
// @browserbug safari lt 16.0
// @browserbug chrome equal 117
// @browserbug chrome between 117 120 -- Inclusive range
//
// last-checked is equivalent to 'equal' for the purposes of no-outdated, but
// documents the version the workaround was last verified against. The
// last-checked-updated rule reports it once browserslist targets a newer version.
//
// @browserbug chrome last-checked 121
```

#### Tolerating drift in `last-checked`

Some bugs take a while to be fixed upstream, so a `last-checked` version can
fall behind your support targets without the workaround being obsolete. The
[`versionDrift` option](docs/rules/no-outdated.md#versiondrift) sets how many
browser releases a `last-checked` version may lag behind the lowest supported
version; within that drift, the rule stops reporting it.

#### `web-feature` descriptors

Instead of writing out browser versions, a descriptor can name a feature from
the [web-features](https://github.com/web-platform-dx/web-features) dataset,
using its id (see the
[web-features explorer](https://web-platform-dx.github.io/web-features-explorer/)).
The `no-outdated` rule reports it once every browser in your browserslist
targets supports that feature.

```ts
// @browserbug web-feature scrollend -- Settle on a debounced scroll instead
// @browserbug web-feature scroll-driven-animations, safari last-checked 18.0
```

- web-features has support data for Chrome, Chrome Android, Edge, Firefox,
  Firefox Android, Safari and Safari iOS (`chrome`, `and_chr`, `edge`,
  `firefox`, `and_ff`, `safari`, `ios_saf` in browserslist). Other browserslist
  targets, such as `samsung` or `op_mini`, are not considered.
- Versions given as "≤N" in the dataset are treated as N.
- Unknown ids are a parse error. Ids that web-features has moved or split are
  also a parse error, which names the replacement id(s).
- `web-features` is a peer dependency, like `browserslist`: install it yourself
  (`npm i -D web-features`, version 3 or later). Its data is only as current as
  the version you have installed, so keep it updated (it is released roughly
  weekly), for example with Renovate or Dependabot.

## Agent skill

This package ships a `browserbug` agent skill, which teaches coding agents to
add and resolve `@browserbug` annotations. See
[Agent skill](https://github.com/woltapp/browserbug#agent-skill) for how to
install it.

## Keeping browser data stable

Lint results depend on the installed versions of `browserslist`, `caniuse-lite`
and `web-features`, so a lockfile bump can introduce errors in unrelated PRs.
See
[Keeping browser data stable](https://github.com/woltapp/browserbug#keeping-browser-data-stable)
for how to pin and deliberately update them.

## Configurations

<!-- begin auto-generated configs list -->

|     | Name          |
| :-- | :------------ |
| ✅  | `recommended` |

<!-- end auto-generated configs list -->

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
✅ Set in the `recommended` configuration.

| Name                                                       | Description                                                                                                               | 💼  |
| :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :-- |
| [last-checked-updated](docs/rules/last-checked-updated.md) | Reports `last-checked` browser workarounds, if browserslist targets a newer version of that browser than the one checked. |     |
| [no-outdated](docs/rules/no-outdated.md)                   | Ensures that no browser workarounds exist, if browserslist support for that browser is outside the specified range.       | ✅  |

<!-- end auto-generated rules list -->
