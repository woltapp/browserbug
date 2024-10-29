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
/*  @browserbug chrome under 117 -- Work around bug */
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
/* @browserbug chrome under 117 -- Work around bug */
/* @browserbug chrome between 117 120 -- Work around bug */
/* @browserbug firefox under 80 -- Work around bug */
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

## When Not To Use It

Give a short description of when it would be appropriate to turn off this rule.

## Further Reading

If there are other links that describe the issue this rule addresses, please
include them here in a bulleted list.
