module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [
            2, // Level: Error
            'always', // Applicability
            [
                // List of allowed scopes
                // Core Features
                'collection',
                'pairs',
                'goals',
                'profile',
                'auth',
                'settings',
                'activity-log',
                // Cross-Cutting Concerns
                'admin',
                'ui',
                'api',
                'db',
                'lib',
                // Project & Tooling
                'config',
                'deps',
                'vercel',
                'hyperdx',
                'docs',
                'release',
            ],
        ],
    },
};
