# @woltapp/browserbug-comment-last-checked-updated

Reports `last-checked` browserbug comments, if browserslist targets a newer
version of that browser than the one checked.

`last-checked <version>` documents a bug that is still present, as of the
browser version you last verified it against. When a newer version of that
browser shows up in your browserslist targets, the bug might have been fixed.
This rule reports the comment, prompting you to check again.

Assuming a
[browserslist config](https://github.com/browserslist/browserslist#browserslist-)
like this:

```browserslist
chrome 122
chrome 121
safari 17.2
```

```css
/*  @browserbug chrome last-checked 121 -- Work around bug */
/** ↑
 * Comments checked against an older version than the newest target, like this */
```

- If the bug is still there, bump the `last-checked` version.
- If the bug was fixed, switch the descriptor to `lower-than <fixed version>`
  (or another comparator), so that
  [`browserbug-comment-no-outdated`](./browserbug-comment-no-outdated.md) can
  tell you when the workaround can go.

Other comparators, `web-feature` descriptors, and browsers that are not in your
targets are ignored. Parse errors are left to `browserbug-comment-no-outdated`.

New browser versions only show up once your browserslist data (`caniuse-lite`)
is updated, for example with `npx update-browserslist-db@latest`, so how often
this rule fires depends on how often you update it.

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
chrome 122
chrome 121
firefox 123
safari 17.2
```

The following patterns are considered problems:

```css
/* @browserbug chrome last-checked 121 -- Work around bug */
/* @browserbug firefox last-checked 120, safari last-checked 17.2 -- Work around bug */
```

The following patterns are _not_ considered problems:

```css
/* @browserbug chrome last-checked 122 -- Work around bug */
/* @browserbug firefox last-checked 123, safari last-checked 17.2 -- Work around bug */
/* @browserbug chrome lower-than 121 -- Other comparators are ignored */
```

## Optional secondary options

### `browserslistQuery`

Allows specifying an inline browserslist query, that will take precedence over
the global one (if any).

### `versionDrift`

Type: non-negative integer. Default: `0`.

How many browser releases the newest targeted version may be ahead of a
`last-checked` version before it is reported at the rule's severity. Within that
drift, it is reported as a **warning** instead. Since this rule compares against
the newest targeted version, it fires on every new browser release;
`versionDrift` lets you re-check in batches instead.

```json
{
  "rules": {
    "@woltapp/browserbug-comment-last-checked-updated": [
      true,
      { "versionDrift": 2 }
    ]
  }
}
```

See
[`browserbug-comment-no-outdated`'s `versionDrift`](./browserbug-comment-no-outdated.md#versiondrift)
for how drift is counted.

## When Not To Use It

This rule reports every `last-checked` comment each time a browser releases a
new version, which is noisy by nature. Turn it off if you would rather re-check
bugs on your own schedule, or enable it with `severity: "warning"` and run it
periodically, for example in a scheduled CI job.

## Further Reading

- [`browserbug-comment-no-outdated`](./browserbug-comment-no-outdated.md)
- [browserslist](https://github.com/browserslist/browserslist)
