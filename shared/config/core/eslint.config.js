import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Regole permissive per iniziare (senza type information)
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
  prettier, // Deve essere l'ultimo per disabilitare regole ESLint che confliggono con Prettier
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '*.d.ts',
      '*.js',
      '.venv/',
      'DATABASE/',
      'archive/',
      'website/INTEL_SCRAPING/',
      'apps/**/docs/api/assets/',
      'chroma_data/',
      'logs/',
      'tmp/',
      'testing-screenshots/',
      '.chroma/',
      'oracle-system/',
    ],
  },
];
