import type { ESLint, Linter } from 'eslint';

const recommended = (plugin: ESLint.Plugin): Linter.Config => ({
  name: 'browserbug/recommended',
  plugins: {
    browserbug: plugin,
  },
  rules: {
    'browserbug/no-outdated': 'error',
  },
});

export default recommended;
