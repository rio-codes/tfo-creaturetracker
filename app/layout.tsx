import type React from 'react';
import type { Metadata } from 'next';
import { Tektur } from 'next/font/google';
import './globals.css';
import ClientProviders from './ClientProviders';
import { TutorialProvider } from '@/context/tutorial-context';
import { TutorialOverlay } from '@/context/tutorial/tutorial-overlay';

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
                    href="/icon.svg"
                    type="image/<generated>"
                    sizes="any"
                />
            </head>
            <body className={`${tektur.className} flex flex-col min-h-screen`}>
                <ClientProviders>
                    <TutorialProvider>
                        <TutorialOverlay />
                        {children}
                    </TutorialProvider>
                </ClientProviders>
            </body>
        </html>
    );
}
