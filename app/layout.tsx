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
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'TFO.creaturetracker',
        description:
            'A tool to organize your collection, predict breeding results, and reach your research goals for the game The Final Outpost.',
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
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
