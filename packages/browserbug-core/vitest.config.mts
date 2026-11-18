import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    benchmark: {
      // The benchmarks call core functions across module boundaries, which
      // Vitest's module runner wraps in export getters. Measured against the
      // built dist/ in plain Node, the results are the same within noise, so
      // the warning only adds clutter.
      suppressExportGetterWarnings: true,
    },
  },
});
