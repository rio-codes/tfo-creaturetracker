import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextConfig from './next.config.mjs';
import '@next/eslint-plugin-next';

export default defineConfig([
    {
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
    },
    globalIgnores([
        '**/next.config.mjs',
        '**/.next/',
        '**/node_modules/',
        '**/build/',
        '**/out/',
        '**/*.config.ts',
        '**/*.config.mjs',
        '**/*.config.js',
        '**/instrumentation.ts',
        '**/next-env.d.ts',
        '**/tsconfig.json',
    ]),
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@next/next/no-css-tags': 'off',
            '@next/next/no-server-import-in-page': 'off',
            '@next/next/no-img-element': 'off',
            '@next/next/no-html-link-for-pages': 'off',
            'react-hooks/rules-of-hooks': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/purity': 'off',
        },
    },
    eslintConfigPrettier,
]);
