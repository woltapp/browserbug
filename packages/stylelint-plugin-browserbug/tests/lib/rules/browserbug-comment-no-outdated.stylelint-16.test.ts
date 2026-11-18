/**
 * Runs the rule's test suite again on the oldest supported Stylelint major.
 *
 * The `stylelint-16` devDependency is an alias for `stylelint@16`. The mocks
 * below point both the rule (via `stylelint`) and the rule tester (via
 * `loadLint`) at it, then import the regular suite so its cases register here.
 */
import { expect, test, vi } from 'vitest';

vi.mock('stylelint', () => import('stylelint-16'));

vi.mock('jest-preset-stylelint', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('jest-preset-stylelint')>();

  return {
    ...original,
    getTestRule: (options: Parameters<typeof original.getTestRule>[0]) =>
      original.getTestRule({
        ...options,
        loadLint: () =>
          import('stylelint-16').then(
            (stylelint) =>
              // The 16 and 18 `lint` types differ slightly, but the tester
              // only uses the options they share.
              stylelint.default
                .lint as unknown as typeof import('stylelint').default.lint,
          ),
      }),
  };
});

test('the rule under test resolves `stylelint` to Stylelint 16', async () => {
  const [{ default: mocked }, { default: v16 }] = await Promise.all([
    import('stylelint'),
    import('stylelint-16'),
  ]);
  expect(mocked).toBe(v16);
});

await import('./browserbug-comment-no-outdated.test.js');
