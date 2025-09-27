import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TFO.creaturetracker',
        short_name: 'TFO.CT',
        description: 'A breeding project organizer for The Final Outpost.',
        start_url: '/',
        display: 'standalone',
        background_color: '#D0BCFF',
        theme_color: '#3C2D63',
        lang: 'en-US',
        dir: 'ltr',
        orientation: 'portrait',
        scope: '/',
        icons: [
            {
                src: '/images/icons/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/images/icons/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/images/icons/favicon-32x32.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/images/icons/favicon-16x16.png',
                sizes: '16x16',
                type: 'image/png',
            },
            {
                src: '/images/icons/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    };
}
