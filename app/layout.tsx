import type { Metadata } from 'next';
import { Tektur } from 'next/font/google';
import './globals.css';
import ClientProviders from './ClientProviders';

export const metadata: Metadata = {
    metadataBase: new URL('https://tfo.creaturetracker.net'),
    title: {
        default: 'TFO.creaturetracker',
        template: '%s | TFO.creaturetracker',
    },
    description:
        'A tool to organize your collection, predict breeding results, and reach your research goals for the game The Final Outpost.',
    openGraph: {
        title: 'TFO.creaturetracker',
        description:
            'A tool to organize your collection, predict breeding results, and reach your research goals for the game The Final Outpost.',
        url: 'https://tfo.creaturetracker.net',
        siteName: 'TFO.creaturetracker',
        images: [
            {
                url: 'https://github.com/user-attachments/assets/ef9b624e-8c48-4721-980e-4531b21563f0',
                width: 750,
                height: 750,
                alt: 'TFO.creaturetracker Logo',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'TFO.creaturetracker',
        description:
            'A tool to organize your collection, predict breeding results, and reach your research goals for the game The Final Outpost.',
        images: ['https://github.com/user-attachments/assets/ef9b624e-8c48-4721-980e-4531b21563f0'],
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
            <body className={`${tektur.className} flex flex-col min-h-screen`}>
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
