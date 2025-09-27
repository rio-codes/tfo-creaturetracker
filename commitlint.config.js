module.exports = {
    extends: ['@commitlint/config-conventional', 'commitlint-plugin-gitmoji'],
    rules: {
        'scope-enum': [
            2, // Level: Error
            'always',
            [
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
