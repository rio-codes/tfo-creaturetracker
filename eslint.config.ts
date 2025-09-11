import next from 'eslint-config-next';
import prettier from 'eslint-plugin-prettier/recommended';
import ts from 'typescript-eslint';

/** @type {import('typescript-eslint').Config} */
export default ts.config(
    // Global ignores
    {
        ignores: ['.next/**', 'node_modules/**'],
    },

    // Base configs from typescript-eslint
    ...ts.configs.recommended,

    // Next.js config (includes core-web-vitals and React rules)
    next,

    // Prettier config (must be last to override other formatting rules)
    prettier
);
