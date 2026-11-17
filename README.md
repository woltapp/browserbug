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

## Agent skill

The [`browserbug` agent skill](./skills/browserbug/SKILL.md) teaches coding
agents when and how to add `@browserbug` annotations, and how to resolve an
outdated one. It ships inside each lint plugin package, under
`skills/browserbug`.

With pnpm, the skill is linked into your agent's skills directory (such as
`.claude/skills`) once you approve it; see
[pnpm's agent skills docs](https://pnpm.io/agent-skills):

```sh
pnpm install
pnpm approve
```

## Keeping browser data stable

The rules compare your annotations against browser data that does not live in
this repository: your `browserslist` targets are resolved with `browserslist`
and `caniuse-lite`, and `web-feature` descriptors are looked up in
`web-features`. All three are released often, and a lockfile change that bumps
any of them, even transitively, can change what the rules see:

- A workaround that was "still needed" turns into an error, because the newly
  resolved data says all your targets now support the feature (or the bug's
  fixed-in version is now at or below your lowest target).
- A target such as `chrome lower-than 127` resolves differently when an older
  `caniuse-lite` does not know the newest browser versions yet, or a newer one
  knows more of them.
- `web-features` baseline status and browser support change as the dataset is
  corrected and updated.

The result is lint errors in unrelated PRs, "out of nowhere". Two things prevent
this: **pin the data**, so it only changes when you decide, and **update it
deliberately**, so the resulting errors arrive as planned cleanup.

### Pin the data

The relevant packages are `browserslist`, `caniuse-lite` (a dependency of
`browserslist`, and the one that actually holds the browser data) and
`web-features`. Pin them to exact versions for the whole dependency tree, so a
transitive copy cannot drift from the one you control. Check what you are
resolving with `pnpm why caniuse-lite` (or `npm ls caniuse-lite`,
`yarn why caniuse-lite`).

pnpm, with [catalogs](https://pnpm.io/catalogs) so the versions live in one
place (`pnpm-workspace.yaml`):

```yaml
catalog:
  browserslist: 4.28.1
  caniuse-lite: 1.0.30001700
  web-features: 3.45.0

overrides:
  browserslist: 'catalog:'
  caniuse-lite: 'catalog:'
  web-features: 'catalog:'
```

Without a workspace, pnpm `overrides` alone work too (`package.json`):

```json
{
  "pnpm": {
    "overrides": {
      "browserslist": "4.28.1",
      "caniuse-lite": "1.0.30001700",
      "web-features": "3.45.0"
    }
  }
}
```

npm (`package.json`):

```json
{
  "overrides": {
    "browserslist": "4.28.1",
    "caniuse-lite": "1.0.30001700",
    "web-features": "3.45.0"
  }
}
```

Yarn (`package.json`, both Classic and Berry):

```json
{
  "resolutions": {
    "browserslist": "4.28.1",
    "caniuse-lite": "1.0.30001700",
    "web-features": "3.45.0"
  }
}
```

The versions above are examples: use the ones you currently have installed. Also
list `browserslist` and `web-features` as exact versions in your own
`devDependencies` (they are peer dependencies of the plugins).

### Update deliberately

Pinned data goes stale, so bump it on purpose, in a PR of its own:

- **Renovate**: group the three packages into one PR, and keep that PR separate
  from other dependency updates:

  ```json5
  {
    packageRules: [
      {
        description: 'Browser data that browserbug lints against',
        matchPackageNames: ['browserslist', 'caniuse-lite', 'web-features'],
        groupName: 'browser data',
        // Optionally, batch the churn into a weekly PR.
        schedule: ['before 6am on monday'],
      },
    ],
  }
  ```

  Renovate supports pnpm catalogs and `overrides`; check its docs for your
  version, and if it does not touch your override, bump it by hand.

- **Scheduled script**: if you would rather not use Renovate, a weekly CI job
  can run `npx update-browserslist-db@latest` (which refreshes `caniuse-lite` in
  your lockfile), plus `npm i -D web-features@latest`, and open a PR.

Treat lint errors in that PR as the intended outcome: they are workarounds that
the data now says you can remove (or annotations whose version needs a fresh
look). Fix them in the same PR, or merge it only when the cleanup is done. The
PR is also the right place to see how your targets changed, via
`npx browserslist`.

## About the name

The name "browserbug" is tongue-in-cheek. It comes from "that's a browser bug"
being used as a catch-all phrase, which can mean anything from differing web API
support, occasional or long-standing browser quirks, manual workarounds, and
downright browser bugs. Since manual annotations fill a niche for many of these
cases, "browserbug" seemed like fun and visually distinct way to mark such code
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
- Refer to
  [@woltapp/oxlint-plugin-browserbug](./packages/oxlint-plugin-browserbug/) for
  the oxlint plugin. The rules are written for oxlint, and the ESLint plugin
  runs them on ESLint
- Refer to [@woltapp/browserbug-core](./packages/browserbug-core/) for the core
  logic behind the linter plugins.
- Refer to [Contributing](/CONTRIBUTING.md) for how to contribute to this
  project.
