---
'@woltapp/browserbug-core': minor
'@woltapp/eslint-plugin-browserbug': minor
'@woltapp/stylelint-plugin-browserbug': minor
---

Add `web-feature <id>` descriptors, resolved against the web-features dataset.
The no-outdated rules report them once every browserslist target supports the
feature.

Core: `BrowserbugDescriptor` is now `BrowserDescriptor | WebFeatureDescriptor`
(narrow with `isWebFeatureDescriptor`); `parseBrowserbug` takes an optional
`{ webFeatures }`; new `getWebFeatureSupportStatus` and `webFeatures` exports.
`web-features` (^3.0.0) is a new peer dependency of all three packages, like
`browserslist`. The CommonJS builds now need Node 20.19+ / 22.12+
(require(esm)), since web-features is ESM-only.
