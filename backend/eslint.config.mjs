import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    // turns off ESLint rules that would fight with Prettier
    prettier,
    {
        languageOptions: {
            globals: globals.node,
        },
    },
    globalIgnores(['dist/**', 'src/generated/**', 'data/**']),
]);

export default eslintConfig;
