import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [new URL('https://ineejclhhioqywk4.public.blob.vercel-storage.com/**')],
    },
    productionBrowserSourceMaps: true,
    serverExternalPackages: ['@hyperdx/node-opentelemetry', '@opentelemetry/instrumentation'],
    ignoreWarnings: { module: /opentelemetry/ },
    turbopack: {
        root: __dirname,
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
