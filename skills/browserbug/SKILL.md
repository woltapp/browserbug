---
name: browserbug
description:
  Annotate browser-specific workarounds with `@browserbug` comments, so the
  browserbug lint rules flag them once the project's browserslist targets no
  longer need them. Use when writing or reviewing code that works around a
  browser bug or quirk, feature-detects an API with a fallback, or progressively
  enhances for some browsers; and when a `browserbug/no-outdated` or
  `browserbug-comment-no-outdated` lint error asks for a workaround to be
  re-evaluated.
---

# Annotating browser workarounds with `@browserbug`

Workarounds for browser bugs, quirks and missing features pile up and become
code nobody dares to delete. A `@browserbug` comment records _which_ browsers a
forked codepath exists for. The lint rules compare it against the project's
browserslist config and report it once those browsers are no longer targeted, so
the workaround gets removed at the pace of the project's browser support. See
the [motivation](https://github.com/woltapp/browserbug#motivation) for the full
reasoning.

## When to annotate

Annotate code that exists only because of specific browsers:

- a fallback branch behind feature detection (`CSS.supports`, `'x' in obj`,
  `@supports`)
- a fix for a known engine bug or quirk (layout, focus, scroll, events, …)
- a progressive-enhancement fork, where the plain path is for older browsers

Do not annotate what tooling already handles from browserslist (syntax
transpiled by Babel/SWC/esbuild, prefixes added by Autoprefixer, polyfills
injected by core-js), or forks that are product decisions rather than browser
gaps.

## Syntax

```
@browserbug <descriptor>[, <descriptor>…] [-- <reason>]
```

A descriptor is either a web feature, or a browser and version range:

| Descriptor                                  | Reported once the lowest targeted version of that browser is… |
| :------------------------------------------ | :------------------------------------------------------------ |
| `web-feature <id>`                          | n/a: reported once every targeted browser supports `<id>`     |
| `<browser> lower-than <v>` / `lt`           | ≥ `<v>`                                                       |
| `<browser> lower-than-or-equal <v>` / `lte` | > `<v>`                                                       |
| `<browser> equal <v>`                       | > `<v>`                                                       |
| `<browser> last-checked <v>`                | > `<v>`                                                       |
| `<browser> between <v1> <v2>`               | > `<v2>`                                                      |

- `<browser>` is a browserslist name: `chrome`, `and_chr`, `edge`, `firefox`,
  `and_ff`, `safari`, `ios_saf`, `samsung`, …
- Versions are `major` or `major.minor` (`17`, `17.4`).
- A descriptor for a browser that is not in the targets at all is reported
  immediately.

Write it as a comment directly above the code it explains: `//` or `/** */` in
JS/TS, `/* */` in CSS.

```ts
// @browserbug web-feature scrollend -- Debounced scroll as a fallback
if (!('onscrollend' in window)) {
  /* fallback */
}
```

```css
/* @browserbug safari lower-than 17.4 -- https://bugs.webkit.org/show_bug.cgi?id=… */
.dialog {
  /* workaround */
}
```

## Choosing a descriptor

1. **Check the targets first**: run `npx browserslist` in the project. Only
   annotate browsers that appear there, and use their lowest targeted version as
   a sanity check.
2. **Missing feature → `web-feature`.** If the fork exists because a web
   platform feature is unsupported somewhere, prefer `web-feature <id>`: the
   versions come from the
   [web-features](https://github.com/web-platform-dx/web-features) dataset
   instead of being written out by hand. Find the id in the
   [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/),
   or search the installed data:

   ```sh
   node --input-type=module -e "import { features } from 'web-features'; for (const [id, f] of Object.entries(features)) if (f.kind === 'feature' && (id + f.name).toLowerCase().includes(process.argv[1])) console.log(id, '-', f.name)" scrollend
   ```

   This needs `web-features` installed (a peer dependency of the plugins). An
   unknown or moved id is a lint error that names the replacement.

3. **Bug fixed in a known version → `lower-than <fixed version>`.** Look the
   version up in the bug tracker or release notes; do not guess.
4. **Bug still open, or fix version unknown → `last-checked <current stable>`.**
   This records when the bug was last verified. When the lint rule fires,
   someone re-checks and either removes the workaround or bumps the version.
5. **Several browsers** → separate descriptors with commas:
   `@browserbug safari lower-than 17, firefox last-checked 133 -- …`

Always add a `-- reason`: what breaks without the workaround, and a link to the
bug report when there is one (crbug.com, bugzilla.mozilla.org, bugs.webkit.org).

## Verify

Run the project's linters (ESLint, Stylelint, etc.) on the changed files. If the
new annotation is reported as outdated straight away, the targets already
exclude the affected browsers: the workaround is probably removable, so say so
instead of adjusting the annotation to silence the rule.

## Resolving an outdated report

When `no-outdated` fires, re-evaluate the workaround:

- If no targeted browser needs it any more, delete the workaround branch and the
  comment, keeping the modern codepath.
- If it is still needed (the bug is still open), re-verify and bump the version
  (e.g. `last-checked` to the current stable).
