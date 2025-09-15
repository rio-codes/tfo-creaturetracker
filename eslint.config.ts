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
            'next.config.mjs',
        ],
    },
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            '@next/next': nextPlugin,
        },
        rules: {
            ...(nextPlugin.configs.recommended.rules as any),
            ...(nextPlugin.configs['core-web-vitals'].rules as any),
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
            '@next/next/no-img-element': 'off',
            '@next/next/no-page-custom-font': 'off',
        } as any,
    },
    prettierConfig
);
