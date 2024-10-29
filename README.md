# browserbug

> Lint rules for documenting, and eventually removing, browser bug workarounds

In active development! Follow
[the eslint plugin directory for more information](./packages/eslint-plugin-browserbug/).

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

## Installation

- [ESLint](./packages/eslint-plugin-browserbug/#Installation)

## Usage

- [ESLint](./packages/eslint-plugin-browserbug/#Usage)

## Contributing
