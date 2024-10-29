# browserbug

> Lint rules for documenting, and eventually removing, browser bug workarounds

## Motivation

### The core problem

As a web frontend codebase grows, it accumulates codepaths that work around
specific browser bugs, quirks, and implementation details. These workarounds are
often a pragmatic choice, in order to get things to work or look correct, or to
adopt new APIs in a progressively-enhanced way.

Over a long period of time, these forked codepaths end up looking mysterious at
best, and scary at worst. It often seems better to "leave them be", or risk
things breaking. This accumulation makes codepaths less efficient, leads to
larger bundle sizes, and makes the codebase less inviting.

### The core solution

To tackle this problem, these lint rules offer a way to document such forked
codepaths and their associated browser versions versions. The lint rules will
then alert you when those browser versions change.

The rules are backed by your project's
[browserslist config](https://github.com/browserslist/browserslist#browserslist-).
Browserslist is commonly used by similar tools, such as automated code
transpilation via Babel, SWC, and PostCSS, in order to avoid transpiling for
unsupported browsers.

Thus, by using browserslist as the source of truth for the rules, you are
prompted to change things **at a pace dictated by your project's browser
support**, instead of arbitrary version numbers.

While automated tools and code transpilation go a long way, there are categories
of bugs, workarounds and manual feature detection, that require some manual
annotation. We hope that these rules help you keep your codebase tidy for years
to come.

## Where to go from here

This is the repository root. To get started, consider
[reading about the core problem and solution](#motivation) that these packages
deal with.

Then, refer to these links:

- Refer to
  [@woltapp/eslint-plugin-browserbug](./packages/eslint-plugin-browserbug/) for
  the webpack loader
- Refer to
  [@woltapp/stylelint-plugin-browserbug](./packages/stylelint-plugin-browserbug/)
  for the webpack loader
- Refer to [@woltapp/browserbug-core](./packages/browserbug-core/) for the core
  logic behind the linter plugins.
- Refer to [Contributing](/CONTRIBUTING.md) for how to contribute to this
  project.
