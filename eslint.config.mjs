// @ts-check

import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPlugin from 'eslint-plugin-eslint-plugin';

export default tseslint.config(
  { ignores: ['**/*.ohm-bundle.d.ts', '**/dist/*'] },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  // @ts-expect-error -- the types do not line up
  eslintPlugin.configs['flat/recommended'],
);
