'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import Header from '@/components/custom-layout-elements/header';
import { Footer } from '@/components/custom-layout-elements/footer';
import { ThemeSyncer } from '@/components/misc-custom-components/theme-syncer';
import { Analytics } from '@vercel/analytics/next';

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
