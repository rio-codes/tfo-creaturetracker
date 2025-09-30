import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextConfig from 'eslint-config-next-flat';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */

export default tseslint.config(
    {
        ignores: [
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
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    nextConfig,
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
        },
    },
    eslintConfigPrettier
);
