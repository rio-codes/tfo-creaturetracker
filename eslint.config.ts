import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    {
        // Global ignores for files that shouldn't be linted
        ignores: [
            '.next/',
            'node_modules/',
            'build/',
            'out/',
            'drizzle.config.ts',
            'postcss.config.mjs',
            'sentry.*.config.ts',
            'instrumentation.ts',
            'instrumentation-client.ts',
            'next-env.d.ts',
        ],
    },
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            '@next/next': nextPlugin,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@next/next/no-html-link-for-pages': 'off',
            '@next/next/no-img-element': 'off',
            '@next/next/no-page-custom-font': 'off',
            '@next/next/no-page-files': 'off',
            '@next/next/no-server-import-in-page': 'off',
            '@next/next/no-title-in-document-head': 'off',
            '@next/next/no-typos': 'off',
            '@next/next/no-duplicate-head': 'off',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
    prettierConfig
);
