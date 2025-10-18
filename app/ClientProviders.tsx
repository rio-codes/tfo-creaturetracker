'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/custom-layout-elements/header';
import { Footer } from '@/components/custom-layout-elements/footer';
import { ThemeSyncer } from '@/components/misc-custom-components/theme-syncer';
import { Analytics } from '@vercel/analytics/next';
import HyperDX from '@hyperdx/browser';
import React from 'react';

if (typeof window !== 'undefined') {
    const apiKey = process.env.NEXT_PUBLIC_HYPERDX_API_KEY;
    const serviceName = process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME;

    if (!apiKey || !serviceName) {
        console.warn(
            'HyperDX API Key or Service Name is not defined. HyperDX will not be initialized.'
        );
    } else {
        try {
            HyperDX.init({
                apiKey: apiKey,
                service: serviceName,
                tracePropagationTargets: [/localhost/, /tfo\.creaturetracker\.net/],
                consoleCapture: true,
                advancedNetworkCapture: true,
            });
        } catch (error) {
            console.error('Error initializing HyperDX:', error);
        }
    }
}

// Define the paths where the header should be hidden even for logged-in users
const hideHeaderOnPaths = [
    '/login',
    '/register',
    '/terms',
    '/privacy',
    '/forgot-password',
    '/password-reset',
];

// Paths that should hide the header based on a prefix
const hideHeaderOnPrefixes = ['/share/'];

function AppContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const showHeader =
        !hideHeaderOnPaths.includes(pathname) &&
        !hideHeaderOnPrefixes.some((prefix) => pathname.startsWith(prefix));

    // Use useEffect to set global attributes when the session changes.
    useEffect(() => {
        const user = session?.user;
        if (user) {
            try {
                HyperDX.setGlobalAttributes({
                    userId: user.id,
                    username: user.username,
                    userEmail: user.email!,
                });
            } catch (error) {
                console.error('Error setting global attributes:', error);
            }
        }
    }, [session]); // Dependency array ensures this runs only when session changes

    return (
        <>
            {showHeader && <Header />}
            <main className="flex flex-col flex-1">{children}</main>
            <Analytics />
            <Footer />
        </>
    );
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider defaultTheme="hallowsnight">
            <SessionProvider>
                <ThemeSyncer />
                <AppContent>{children}</AppContent>
            </SessionProvider>
        </ThemeProvider>
    );
}
