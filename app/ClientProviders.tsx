'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/custom-layout-elements/header';
import { Footer } from '@/components/custom-layout-elements/footer';
import { ThemeSyncer } from '@/components/misc-custom-components/theme-syncer';
import { Analytics } from '@vercel/analytics/next';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    const [queryClient] = useState(() => new QueryClient());
    return (
        <ThemeProvider defaultTheme="dark">
            <QueryClientProvider client={queryClient}>
                <SessionProvider>
                    <ThemeSyncer />
                    <AppContent>{children}</AppContent>
                </SessionProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
