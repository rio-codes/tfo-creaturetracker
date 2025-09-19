'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import Header from '@/components/custom-layout-elements/header';
import { Footer } from '@/components/custom-layout-elements/footer';
import { ThemeSyncer } from '@/components/misc-custom-components/theme-syncer';
import { Analytics } from '@vercel/analytics/next';
import HyperDX from '@hyperdx/browser';

// Define the paths where the header should be hidden even for logged-in users
const hideHeaderOnPaths = [
    '/',
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
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';

    const canShowHeaderOnPath =
        !hideHeaderOnPaths.includes(pathname) &&
        !hideHeaderOnPrefixes.some((prefix) => pathname.startsWith(prefix));

    const showHeader = isAuthenticated && canShowHeaderOnPath;
    const apiKey = process.env.HYPERDX_API_KEY;
    const serviceName = process.env.OTEL_SERVICE_NAME;

    if (!apiKey || !serviceName) {
        console.warn(
            'HyperDX API Key or Service Name is not defined. HyperDX will not be initialized.'
        );
    } else {
        HyperDX.init({
            apiKey: apiKey,
            service: serviceName,
            tracePropagationTargets: ['localhost', 'tfo.creaturetracker.net'],
            consoleCapture: true,
            advancedNetworkCapture: true,
        });
    }

    const { data: session } = useSession();
    const user = session?.user;

    if (user) {
        HyperDX.setGlobalAttributes({
            userId: user.id,
            username: user.username,
            userEmail: user.email!,
        });
    }

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
        <ThemeProvider defaultTheme="system">
            <SessionProvider>
                <ThemeSyncer />
                <AppContent>{children}</AppContent>
            </SessionProvider>
        </ThemeProvider>
    );
}
