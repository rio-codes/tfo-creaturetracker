const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [new URL('https://ineejclhhioqywk4.public.blob.vercel-storage.com/**')],
    },
    productionBrowserSourceMaps: true,
    serverExternalPackages: ['@hyperdx/node-opentelemetry', '@opentelemetry/instrumentation'],
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
