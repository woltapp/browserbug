# `@woltapp/browserbug-core`

Parser and core comparison utilities for the browserbug syntax.

This is useful if you want to recreate the ESLint and Stylelint rules, but in a
different linter.

## Installation

```sh
npm install @woltapp/browserbug-core
```

## Usage

```ts
import {
  parseBrowserbug,
  getBrowserSupportStatus,
  type BrowserbugDescriptor,
} from '@woltapp/browserbug-core';
import browserslist from 'browserslist',

// Read targets from environment
const targets = browserslist()

const parseResult = parseBrowserbug(
  '@browserbug chrome equal 120 -- Some comment',
  browserslist.data // used to validate the list and available versions of browsers
);

if (!parseResult.success) {
  // Do something with the error here :)
  console.error(parseResult.error.message);
}

// Do something with data here
for (const descriptor of parseResult.data) {
  const supportStatus = getBrowserSupportStatus(data)
}
```

## About the grammar

[The grammar](./src/grammar/browserbug.ohm) is currently written with
[Ohm](https://ohmjs.org/). Earlier versions of the grammar were built with
sticky RegExp and a stack, but that seemed a bit ad-hoc.

If you have a compelling case for alternatives, including speed and quality of
error messages, we would love to hear them!
