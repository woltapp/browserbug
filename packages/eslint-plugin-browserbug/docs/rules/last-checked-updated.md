# browserbug/last-checked-updated

📝 Reports `last-checked` browser workarounds, if browserslist targets a newer
version of that browser than the one checked.

<!-- end auto-generated rule header -->

`last-checked <version>` documents a bug that is still present, as of the
browser version you last verified it against. When a newer version of that
browser shows up in your browserslist targets, the bug might have been fixed.
This rule reports the declaration, prompting you to check again.

## Rule Details

For each `last-checked` descriptor, the rule looks at the newest version of that
browser in your browserslist targets. If that version is newer than the checked
version, the declaration is reported.

- If the bug is still there, bump the `last-checked` version.
- If the bug was fixed, switch the descriptor to `lower-than <fixed version>`
  (or another comparator), so that [`no-outdated`](./no-outdated.md) can tell
  you when the workaround can go.

Other comparators, `web-feature` descriptors, and browsers that are not in your
targets are ignored. Parse errors are left to `no-outdated`.

New browser versions only show up once your browserslist data (`caniuse-lite`)
is updated, for example with `npx update-browserslist-db@latest`, so how often
this rule fires depends on how often you update it.

Assuming a
[browserslist config](https://github.com/browserslist/browserslist#browserslist-)
like this:

```text
chrome 122
chrome 121
firefox 123
safari 17.2
```

Examples of **incorrect** code for this rule:

```js
// @browserbug chrome last-checked 121 -- Work around bug
// @browserbug firefox last-checked 120, safari last-checked 17.2 -- Work around bug
```

Examples of **correct** code for this rule:

```js
// @browserbug chrome last-checked 122 -- Work around bug
// @browserbug firefox last-checked 123, safari last-checked 17.2 -- Work around bug
// @browserbug chrome lower-than 121 -- Other comparators are ignored
```

## Options

### `versionDrift`

Type: non-negative integer. Default: `0`.

How many browser releases the newest targeted version may be ahead of a
`last-checked` version before this rule reports it. Since this rule compares
against the newest targeted version, it fires on every new browser release;
`versionDrift` lets you re-check in batches instead.

```js
export default [
  {
    rules: {
      '@woltapp/browserbug/last-checked-updated': ['warn', { versionDrift: 2 }],
    },
  },
];
```

ESLint takes severity from the config, so declarations within the drift are not
reported at all. The Stylelint rule reports them as warnings instead. See
[`no-outdated`'s `versionDrift`](./no-outdated.md#versiondrift) for how drift is
counted.

## When Not To Use It

This rule reports every `last-checked` declaration each time a browser releases
a new version, which is noisy by nature, so it is not part of the `recommended`
config. Turn it off if you would rather re-check bugs on your own schedule, or
enable it as a warning and run it periodically, for example in a scheduled CI
job.

## Further Reading

- [`no-outdated`](./no-outdated.md)
- [browserslist](https://github.com/browserslist/browserslist)
