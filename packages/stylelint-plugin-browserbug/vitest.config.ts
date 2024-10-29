import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    /** Globals are required for the stylelint rule tester */
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
