# browserbug/no-outdated

📝 Ensures that no browser workarounds exist, if browserslist support for that
browser is outside the specified range.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Please describe the origin of the rule here.

## Rule Details

This rule aims to...

Examples of **incorrect** code for this rule:

Assuming a
[browserslist config](https://github.com/browserslist/browserslist#browserslist-)
like this:

```text
chrome 120
firefox 119
safari 16.4
```

```js
// @browserbug chrome lower-than 117 -- Work around bug
// @browserbug chrome between 117 120 -- Work around bug
// @browserbug firefox lower-than 80 -- Work around bug
// @browserbug unknown 123 -- Work around bug
```

Examples of **correct** code for this rule:

```js
// Outdated comments are removed, and only valid ones exist
// @browserbug chrome last-checked 122
// @browserbug firefox last-checked 122
// @browserbug safari between 15.4 17.2
```

## Options

### `versionDrift`

Type: non-negative integer. Default: `0`.

How many browser releases a `last-checked` version may fall behind the lowest
supported version before this rule reports it. Use it for workarounds you know
will take a while to fix upstream, so that every support-target bump does not
force you to re-check them straight away.

```js
export default [
  {
    rules: {
      '@woltapp/browserbug/no-outdated': ['error', { versionDrift: 2 }],
    },
  },
];
```

With the browserslist config above (`chrome 120`), `versionDrift: 2` accepts:

```js
// 119 and 120 are newer than 118: a drift of 2
// @browserbug chrome last-checked 118
```

and still reports:

```js
// 118, 119 and 120 are newer than 117: a drift of 3
// @browserbug chrome last-checked 117
```

Drift counts the browser's releases in browserslist data, not the difference
between version numbers. For Safari, `last-checked 17.2` with a lowest supported
version of `18.0` is a drift of 5 (17.3, 17.4, 17.5, 17.6, 18.0).

`versionDrift` only applies to `last-checked`. The other comparators
(`lower-than`, `equal`, `between`, ...) state a known version range, so they are
reported as soon as that range is unsupported. Unsupported browsers and
`web-feature` descriptors are not affected either.

ESLint cannot lower the severity of a single report, so a `last-checked`
declaration within the drift is not reported at all. (The Stylelint plugin
reports it as a warning instead.)

## When Not To Use It

Give a short description of when it would be appropriate to turn off this rule.

## Further Reading

If there are other links that describe the issue this rule addresses, please
include them here in a bulleted list.
