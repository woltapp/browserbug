# `@woltapp/stylelint-plugin-browserbug`

> Lint rules for documenting, and eventually removing, browser bug workarounds.

## Usage

TODO: Ensure you have node and nvm. Ensure you have the package token.

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

/* These descriptors are equivalent to 'equal' and 'between' for the purposes of no-outdated. Additionally, the last-checked-updated rule will report an error if there is a newer version of the specified versions available. */
/* @browserbug chrome last-checked 121 */
/* @browserbug chrome last-checked-between 117 121 -- Same as last-checked, but documents when a workaround started */
```

## Rules

💼 Configurations enabled in.\
✅ Set in the `recommended` configuration.

| Name                                                        | Description                                                                                                         | 💼  |
| :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-- |
| [no-outdated](docs/rules/browserbug-comment-no-outdated.md) | Ensures that no browserbug comment exists, if browserslist support for that browser is outside the specified range. | ✅  |

<!-- end auto-generated rules list -->

## Running locally in another repository

At the moment, the package is not published on any registry. Thus, you must
clone the repo and link the package on your machine. This is also useful if you
are contributing to the development, and want to test with a real codebase.

(The following is adapted from
[typescript-eslint's excellent guide on local linking](https://typescript-eslint.io/contributing/local-development/local-linking/))

The general strategy is:

1. [Global linking](#global-linking): Use your package manager's global link
   command to make the `@woltapp/stylelint-plugin-browserbug` packages available
   as a global symlink.
2. [Repository linking](#repository-linking): Use your package manager's link
   command to reference that global symlink in the local downstream repository.
3. [Usage](#usage): Test your local rules and plugins by enabling them in the
   local downstream repository.

### Global Linking

To make `@woltapp/stylelint-plugin-browserbug` available globally, run the link
command from the **package root** (i.e. `packages/stylelint-plugin-browserbug`).
The command depends on your package manager:

- [npm](https://docs.npmjs.com/cli/v9/commands/npm-link 'npm link docs'):
  `npm link`
- [pnpm](https://pnpm.io/cli/link 'pnpm link docs'): `pnpm link --global`
- [Yarn v1 / classic](https://classic.yarnpkg.com/lang/en/docs/cli/link/ 'Yarn v1 / classic docs'):
  `yarn link`
- [Yarn v2 / v3 / berry](https://yarnpkg.com/cli/link 'Yarn v2 / v3 / berry docs'):
  _skip this step altogether_

### Repository Linking

Now that the package is available locally, you can link to it in the local
downstream repository.

Run that repository's package manager's link command:

- npm: `npm link @woltapp/stylelint-plugin-browserbug`
- pnpm: `pnpm link --global @woltapp/stylelint-plugin-browserbug`
- Yarn v1 / classic: `yarn link @woltapp/stylelint-plugin-browserbug`
- Yarn v2 / v3 / berry:
  `yarn link /path/to/your/browserbug/packages/stylelint-plugin-browserbug`
  - This will add a `resolutions` entry for each package in the local downstream
    repository's `package.json`

Now, you should be able to run stylelint in the local downstream repository as
you normally would, and have it reference the local
`@woltapp/stylelint-plugin-browserbug` package.
