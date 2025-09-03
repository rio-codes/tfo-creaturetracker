import type React from 'react';
import type { Metadata } from 'next';
import { Tektur } from 'next/font/google';
import './globals.css';
import ClientProviders from './ClientProviders';

export const metadata: Metadata = {
    title: 'TFO.creaturetracker',
    description: 'A breeding tracker for The Final Outpost',
    metadataBase: new URL('https://tfo.creaturetracker.net'),
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
                <link
                    rel="icon"
                    href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>🧬</text></svg>"
                />
            </head>
            <body className={`${tektur.className} flex flex-col min-h-screen`}>
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
