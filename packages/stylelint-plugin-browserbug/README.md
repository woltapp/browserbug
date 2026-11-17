# `@woltapp/stylelint-plugin-browserbug`

> Lint rules for documenting, and eventually removing, browser bug workarounds.

## Usage

You'll first need to install
[Stylelint](https://stylelint.io/user-guide/get-started). The plugin supports
Stylelint 16, 17 and 18.

```sh
npm i stylelint --save-dev
```

### Step 1: Installation

```sh
npm i @woltapp/stylelint-plugin-browserbug browserslist web-features --save-dev
```

`browserslist` and `web-features` are peer dependencies, so you choose (and
update) their versions.

### Step 2: Configuration

Add `browserbug` to the plugins section of your
[stylelint configuration file](https://stylelint.io/user-guide/configure).

```json
{
  "plugins": ["@woltapp/stylelint-plugin-browserbug"],
  "rules": {
    "@woltapp/browserbug-comment-no-outdated": true
  }
}
```

Listing the plugin by name works in every config format. The package is
ESM-only, which Stylelint 16 and later load natively.

To import the plugin in a JavaScript or TypeScript config instead, spread it
into `plugins`, since the package exports an array of plugins:

```js
// stylelint.config.mjs (or stylelint.config.ts, on Stylelint 18)
import browserbug from '@woltapp/stylelint-plugin-browserbug';

/** @type {import('stylelint').Config} */
export default {
  plugins: [...browserbug],
  rules: {
    '@woltapp/browserbug-comment-no-outdated': true,
  },
};
```

In a CommonJS config, `require('@woltapp/stylelint-plugin-browserbug')` works
through Node's `require(esm)` (Node 22.12+), and the array is its `.default`
export.

Note: for the rules to practically work, you must also specify a
[browserslist config](https://browsersl.ist/). Any of the supported browserslist
methods would work, for example a `browserslist` entry in `package.json`.

### Step 3: Usage in code

The plugin works via code comments.

Comments are prefixed as `@browserbug`, and include a list of descriptors.
Descriptors can be comma separated. A comment can follow the list of
descriptors, starting with `--`.

```css
/* The no-outdated rule will report an error if the specified range is no longer supported. */
/* @browserbug safari lower-than-or-equal 15.4 -- Some comment here */
/* @browserbug safari lte 15.4 */
/* @browserbug safari lower-than 16.0 */
/* @browserbug safari lt 16.0 */
/* @browserbug chrome equal 117 */
/* @browserbug chrome between 117 120 -- Inclusive range */

/* last-checked is equivalent to 'equal' for the purposes of no-outdated, but documents the version the workaround was last verified against. The last-checked-updated rule reports it once browserslist targets a newer version. */
/* @browserbug chrome last-checked 121 */
```

#### Tolerating drift in `last-checked`

Some bugs take a while to be fixed upstream, so a `last-checked` version can
fall behind your support targets without the workaround being obsolete. The
[`versionDrift` option](docs/rules/browserbug-comment-no-outdated.md#versiondrift)
sets how many browser releases a `last-checked` version may lag behind the
lowest supported version; within that drift, the rule reports it as a warning
instead of an error.

#### `web-feature` descriptors

Instead of writing out browser versions, a descriptor can name a feature from
the [web-features](https://github.com/web-platform-dx/web-features) dataset,
using its id (see the
[web-features explorer](https://web-platform-dx.github.io/web-features-explorer/)).
The `no-outdated` rule reports it once every browser in your browserslist
targets supports that feature.

```css
/* @browserbug web-feature scrollend -- Settle on a debounced scroll instead */
/* @browserbug web-feature scroll-driven-animations, safari last-checked 18.0 */
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

## Rules

💼 Configurations enabled in.\
✅ Set in the `recommended` configuration.

| Name                                                                          | Description                                                                                                               | 💼  |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :-- |
| [last-checked-updated](docs/rules/browserbug-comment-last-checked-updated.md) | Reports `last-checked` browserbug comments, if browserslist targets a newer version of that browser than the one checked. |     |
| [no-outdated](docs/rules/browserbug-comment-no-outdated.md)                   | Ensures that no browserbug comment exists, if browserslist support for that browser is outside the specified range.       | ✅  |

<!-- end auto-generated rules list -->
