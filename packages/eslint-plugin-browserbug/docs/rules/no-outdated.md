# Ensures that no browser workarounds exist, if browserslist support for that browser is outside the specified range (`@woltapp/browserbug/no-outdated`)

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
// @browserbug chrome under 117 -- Work around bug
// @browserbug chrome between 117 120 -- Work around bug
// @browserbug firefox under 80 -- Work around bug
// @browserbug unknown 123 -- Work around bug
```

Examples of **correct** code for this rule:

```js
// Outdated comments are removed, and only valid ones exist
// @browserbug chrome last-checked 122
// @browserbug firefox last-checked 122
// @browserbug safari between 15.4 17.2
```

## When Not To Use It

Give a short description of when it would be appropriate to turn off this rule.

## Further Reading

If there are other links that describe the issue this rule addresses, please
include them here in a bulleted list.
