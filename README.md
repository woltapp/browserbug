# browserbug 🌐🐛

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

To tackle this problem, **browserbug offers a set of lint rules to annotate such
forked codepaths and their associated browser versions versions, via code
comments**. The lint rules will then alert you when those browser versions
change.

The comment annotations look like this:

```tsx
/** @browserbug firefox lower-than 121 -- Need to support this */
if (!CSS.supports('selector(:has(a))')) {
  // some fallback, potentially quite convoluted
} else {
  // something else
}
```

The rules are backed by your project's
[browserslist config](https://github.com/browserslist/browserslist#browserslist-).
Browserslist is commonly used by similar tools, such as automated code
transpilation via Babel, SWC, and PostCSS, in order to avoid transpiling for
unsupported browsers. By using browserslist as the source of truth for the
rules, you are prompted to change things **at a pace dictated by your project's
browser support**, instead of arbitrary version numbers.

While automated tools and code transpilation go a long way, there are categories
of bugs, workarounds and manual feature detection, that require some manual
annotation. We hope that these rules help you keep your codebase tidy for years
to come.

## About the name

The name "browserbug" is tongue-in-cheek. It comes from "that's a browser bug"
being used as a catch-all phrase, which can mean anything from differing web API
support, occasional or long-standing browser quirks, manual workarounds, and
nest bugs. Since manual annotations fill a niche for many of these cases,
"browserbug" seemed like fun and visually distinct way to mark such code
sections, even if it is not strictly correct.

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
