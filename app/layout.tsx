import type { Metadata } from 'next';
import { Tektur } from 'next/font/google';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
    metadataBase: new URL('https://tfo.creaturetracker.net'),
    manifest: '/site.webmanifest',
    icons: {
        icon: {
            rel: 'icon',
            url: '/images/icons/chrome-192x192.png',
        },
        apple: '/images/icons/apple-touch-icon.png',
        shortcut: '/images/icons/favicon.ico',
    },
    applicationName: 'TFO.creaturetracker',
    title: 'TFO.creaturetracker',
    description: 'A breeding project organizer for The Final Outpost.',
    keywords: ['TFO', 'TFOCT', 'The Final Outpost', 'genetics', 'adoptables'],
    creator: 'Rio S. (lyricism)',
    openGraph: {
        title: 'TFO.creaturetracker',
        description: 'A breeding project organizer for The Final Outpost.',
        url: 'https://tfo.creaturetracker.net',
        images: [
            {
                url: 'https://tfo.creaturetracker.net/images/icons/icon.svg',
                width: 60,
                height: 60,
                alt: 'TFO.creaturetracker Logo',
            },
        ],
    },
    themeColor: '#3C2D63',
    colorScheme: 'dark',
    twitter: {
        card: 'summary_large_image',
        title: 'TFO.creaturetracker',
        description: 'A breeding project organizer for The Final Outpost.',
        images: ['https://tfo.creaturetracker.net/images/icons/icon.svg'],
    },
};

const tektur = Tektur({
    subsets: ['latin'],
});

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/images/icons/favicon.ico" />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/images/icons/favicon-32x32.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/images/icons/favicon-16x16.png"
                />

                <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Tektur&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body
                className={`${tektur.className} flex flex-col min-h-screen bg-barely-lilac dark:bg-midnight-purple text-pompaca-purple dark:text-purple-300`}
            >
                <ClientProviders>{children}</ClientProviders>
                <Toaster />
            </body>
        </html>
    );
}
