// @ts-check
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

// eslint-doc-generator derives the rule prefix from `meta.name`, which gives
// `@woltapp/browserbug`. It does not read `meta.namespace` yet, so it would
// look for `@woltapp/browserbug/no-outdated` in our configs instead of
// `browserbug/no-outdated`, and miss that the rule is in `recommended`.
// The generator loads the plugin in this same process after loading this file,
// and gets the same cached module, so we can override the name it sees, only
// while generating docs.
// Requires a build first, like the generator itself.
const { default: plugin } = await import('./dist/index.js');
plugin.meta.name = `eslint-plugin-${plugin.meta.namespace}`;

const oxfmtBin = fileURLToPath(
  new URL('bin/oxfmt', import.meta.resolve('oxfmt/package.json')),
);

/** @type {import('eslint-doc-generator').GenerateOptions} */
export default {
  // Format the generated docs with oxfmt, so that `--check` agrees with
  // `lint:format`. oxfmt's `format()` API takes options but does not resolve
  // the config file (overrides, ignores), so pipe through the CLI instead,
  // which does.
  postprocess: (content, path) =>
    execFileSync(process.execPath, [oxfmtBin, `--stdin-filepath=${path}`], {
      input: content,
      encoding: 'utf8',
    }),
};
