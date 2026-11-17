// tsc does not copy the generated ohm grammar bundle (plain JS plus a
// hand-off .d.ts) into dist, so copy it next to the compiled parser.
import { cpSync } from 'node:fs';

for (const ext of ['js', 'd.ts']) {
  cpSync(
    `src/parser/grammar/browserbug.ohm-bundle.${ext}`,
    `dist/parser/grammar/browserbug.ohm-bundle.${ext}`,
  );
}
