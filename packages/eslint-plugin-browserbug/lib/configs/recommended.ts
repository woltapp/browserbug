import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';

const recommended = (plugin: FlatConfig.Plugin): FlatConfig.Config => ({
  name: 'browserbug/recommended',
  plugins: {
    browserbug: plugin,
  },
  rules: {
    'browserbug/no-outdated': 'error',
    'browserbug/unknown-version': 'warn',
  },
});

export default recommended;
