# `@woltapp/stylelint-plugin-browserbug`

> Lint rules for documenting, and eventually removing, browser bug workarounds.

## Usage

You'll first need to install
[Stylelint](https://stylelint.io/user-guide/get-started):

```sh
npm i stylelint --save-dev
```

### Step 1: Installation

```sh
npm i @woltapp/stylelint-plugin-browserbug --save-dev
```

### Step 2: Configuration

Add `browserbug` to the plugins section of your
[stylelint configuration file](https://github.com/stylelint/stylelint/blob/main/docs/user-guide/configure.md).

```json
{
  "plugins": ["@woltapp/stylelint-plugin-browserbug"],
  "rules": {
    "@woltapp/browserbug-comment-no-outdated": true
  }
}
```

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

/* last-checked is equivalent to 'equal' for the purposes of no-outdated, but documents the version the workaround was last verified against. */
/* @browserbug chrome last-checked 121 */
```

## Rules

💼 Configurations enabled in.\
✅ Set in the `recommended` configuration.

| Name                                                        | Description                                                                                                         | 💼  |
| :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-- |
| [no-outdated](docs/rules/browserbug-comment-no-outdated.md) | Ensures that no browserbug comment exists, if browserslist support for that browser is outside the specified range. | ✅  |

<!-- end auto-generated rules list -->
