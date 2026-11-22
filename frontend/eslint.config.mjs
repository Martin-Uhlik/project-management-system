import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,
    // full accessibility rule set
    jsxA11y.flatConfigs.strict,
    // turns off ESLint rules that would fight with Prettier
    prettier,
    {
        files: ['**/*.{ts,tsx,mjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        // an explicit version: the plugin's 'detect' doesn't work with ESLint 10 yet
        settings: { react: { version: '19.3' } },
        rules: {
            // the props are checked by TypeScript
            'react/prop-types': 'off',
            // _ marks a value that is deliberately unused
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
            // New React Compiler rules from eslint-plugin-react-hooks v7.
            // Kept as warnings until the flagged components are refactored.
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/refs': 'warn',
        },
    },
    {
        files: ['**/*.test.{ts,tsx}', 'src/setupTests.ts'],
        languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
    },
    {
        files: ['vite.config.ts', 'eslint.config.mjs'],
        languageOptions: { globals: globals.node },
    },
    globalIgnores(['build/**', 'coverage/**', 'public/**']),
]);

export default eslintConfig;
