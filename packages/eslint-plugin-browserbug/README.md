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

### Step 1: Install ESLint

```sh
npm i @woltapp/eslint-plugin-browserbug --save-dev
```

### Step 2: Configure rules

Add browserbug to your
[ESLint configuration file](https://eslint.org/docs/latest/use/configure/configuration-files).

If you use the recommended config:

```js
import browserbug from '@woltapp/eslint-plugin-browserbug';

export default [
  browserbug.configs.recommended,
  {
    rules: {
      // customise any rules here
      'browserbug/no-outdated': 'error',
    },
  },
];
```

This sets you up with the recommended set of rules. You can configure the rules
you want to use under the rules section.

Alternatively, you can specify only the plugin, and set each rule separately

```js
import browserbug from '@woltapp/eslint-plugin-browserbug';

export default [
  {
    plugins: {
      browserbug: browserbug.plugin,
    },
    rules: {
      'browserbug/no-outdated': 'error',
    },
  },
];
```

Note: for the rules to practically work, you must also specify a
[browserslist config](https://browsersl.ist/) in you repository. Any of the
supported browserslist methods would work, for example a `browserslist` entry in
`package.json`.

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
// These descriptors are equivalent to 'equal' and 'between' for the purposes of no-outdated.
// Additionally, the last-checked-updated rule will report an error if there is a newer version of the specified versions available.
//
// @browserbug chrome last-checked 121
// @browserbug chrome last-checked-between 117 121 -- Same as last-checked, but documents when a workaround started
```

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

| Name                                     | Description                                                                                                         | 💼  |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-- |
| [no-outdated](docs/rules/no-outdated.md) | Ensures that no browser workarounds exist, if browserslist support for that browser is outside the specified range. | ✅  |

<!-- end auto-generated rules list -->
