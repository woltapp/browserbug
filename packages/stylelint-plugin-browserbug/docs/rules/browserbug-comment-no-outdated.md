# @woltapp/browserbug-comment-no-outdated

Ensures that no browser workarounds exist, if browserslist support for that
browser is outside the specified range.

Assuming a
[browserslist config](https://github.com/browserslist/browserslist#browserslist-)
like this:

```browserslist
chrome 120
firefox 119
safari 16.4
```

```css
/*  @browserbug chrome lower-than 117 -- Work around bug */
/** ↑
 * Comments for unsupported browsers, like this */
```

> [!WARNING] Comments within _selector and value lists_ are currently ignored.

The
[`message` secondary option](https://stylelint.io/user-guide/configure/#message)
can accept the arguments of this rule.

## Options

### `true`

Assuming a
[browserslist config](https://github.com/browserslist/browserslist#browserslist-)
like this:

```browserslist
chrome 120
firefox 119
safari 16.4
```

The following patterns are considered problems:

```css
/* @browserbug chrome lower-than 117 -- Work around bug */
/* @browserbug chrome between 117 120 -- Work around bug */
/* @browserbug firefox lower-than 80 -- Work around bug */
/* @browserbug unknown 123 -- Work around bug */
```

Invalid `@browserbug` declarations are also considered problems:

```css
/* @browserbug notAKnownBrowser equal 14 -- Work around bug */
/* @browserbug chrome equal 5000 -- Work around bug */
/* @browserbug Invalid syntax */
```

The following patterns are _not_ considered problems:

```css
/* @browserbug chrome last-checked 122 */
/* @browserbug firefox last-checked 122 */
/* @browserbug safari between 15.4 17.2 */
```

## Optional secondary options

This section is a work in progress.

### `browserslistQuery`

Allows specifying an inline browserslist query, that will take precedence over
the global one (if any).

### `versionDrift`

Type: non-negative integer. Default: `0`.

How many browser releases a `last-checked` version may fall behind the lowest
supported version before it is reported at the rule's severity. Within that
drift, it is reported as a **warning** instead. Use it for workarounds you know
will take a while to fix upstream: they stay visible, without failing the lint
run on every support-target bump.

```json
{
  "rules": {
    "@woltapp/browserbug-comment-no-outdated": [true, { "versionDrift": 2 }]
  }
}
```

With the browserslist config above (`chrome 120`), `versionDrift: 2` reports
this as a warning:

```css
/* 119 and 120 are newer than 118: a drift of 2 */
/* @browserbug chrome last-checked 118 */
```

and this at the rule's severity (an error by default):

```css
/* 118, 119 and 120 are newer than 117: a drift of 3 */
/* @browserbug chrome last-checked 117 */
```

Drift counts the browser's releases in browserslist data, not the difference
between version numbers. For Safari, `last-checked 17.2` with a lowest supported
version of `18.0` is a drift of 5 (17.3, 17.4, 17.5, 17.6, 18.0).

`versionDrift` only applies to `last-checked`. The other comparators
(`lower-than`, `equal`, `between`, ...) state a known version range, so they are
reported at the rule's severity as soon as that range is unsupported.
Unsupported browsers and `web-feature` descriptors are not affected either.

To fail CI on warnings too, run Stylelint with `--max-warnings 0`.

## When Not To Use It

Give a short description of when it would be appropriate to turn off this rule.

## Further Reading

If there are other links that describe the issue this rule addresses, please
include them here in a bulleted list.
