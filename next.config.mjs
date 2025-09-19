const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [new URL('https://ineejclhhioqywk4.public.blob.vercel-storage.com/**')],
    },
    experimental: {
        instrumentationHook: true,
    },
    serverExternalPackages: ['@hyperdx/node-opentelemetry', '@opentelemetry/instrumentation'],
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.ignoreWarnings = [{ module: /opentelemetry/ }];
        }
        return config;
    },
    outputFileTracingRoot: '/',
};

export default nextConfig;
