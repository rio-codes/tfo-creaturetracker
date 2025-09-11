import '@rushstack/eslint-patch/modern-module-resolution';
import next from 'eslint-config-next';
import prettier from 'eslint-plugin-prettier/recommended';
import drizzle from 'eslint-plugin-drizzle';
import ts from 'typescript-eslint';
import js from '@eslint/js';

/**
 * ESLint Flat Configuration
 * @see https://eslint.org/docs/latest/use/configure/configuration-files-new
 */
export default ts.config(
	// Global ignores
	{
		ignores: ['.next/**', 'node_modules/**'],
	},

	// Base configs
	js.configs.recommended,
	...ts.configs.recommended,

	// Next.js config (includes core-web-vitals and React rules)
	next,

	// Drizzle ORM rules
	drizzle.configs['recommended'],

	// Prettier config (must be the last one to override other formatting rules)
	prettier,

	// Custom rule overrides
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'off',
		},
	}
);