import next from 'eslint-config-next';
import prettier from 'eslint-plugin-prettier/recommended';
import drizzle from 'eslint-plugin-drizzle';
import ts from 'typescript-eslint';
import js from '@eslint/js';

const { defineConfig } = require('eslint/config');

/**
 * ESLint Flat Configuration
 * @see https://eslint.org/docs/latest/use/configure/configuration-files-new
 */
module.exports = defineConfig([
    {
        files: ['**/*.ts', '**/*.tsx'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
            project: './tsconfig.json',
        },
    },
    {
        ignores: ['.next/**', 'node_modules/**'],
    },
    // Custom rule overrides
    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        configs: {
            ts,
            js,
            next,
            drizzle,
            prettier,
        },
    },
]);
