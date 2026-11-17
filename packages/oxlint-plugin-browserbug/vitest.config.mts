import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    // Each test spawns the real oxlint binary
    testTimeout: 30_000,
  },
});
