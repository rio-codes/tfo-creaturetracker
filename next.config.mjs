const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [new URL('https://ineejclhhioqywk4.public.blob.vercel-storage.com/**')],
    },
    productionBrowserSourceMaps: true,
    serverExternalPackages: ['@hyperdx/node-opentelemetry', '@opentelemetry/instrumentation'],
    turbopack: (config, { isServer }) => {
        if (isServer) {
            config.ignoreWarnings = [{ module: /opentelemetry/ }];
            config.root = '/';
        }
        return config;
    },
    async headers() {
        return [
            {
                source: '/',
                headers: [
                    {
                        key: 'X-Clacks-Overhead',
                        value: 'GNU Terry Pratchett, David Bowie, Audre Lorde, Alexander Shulgin',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
