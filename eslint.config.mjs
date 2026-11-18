// @ts-check

import { defineConfig, globalIgnores } from 'eslint/config';
import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPlugin from 'eslint-plugin-eslint-plugin';

export default defineConfig(
  globalIgnores([
    '**/*.ohm-bundle.d.ts',
    '**/dist/*',
    // Inputs for oxlint, which use oxlint-only rules
    'packages/oxlint-plugin-browserbug/tests/fixtures/',
  ]),
  eslintJs.configs.recommended,
  tseslint.configs.recommended,
  eslintPlugin.configs.recommended,
  {
    rules: {
      // Always brace control statements, even single-line ones
      curly: ['error', 'all'],
    },
  },
);
