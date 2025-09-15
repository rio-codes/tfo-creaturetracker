'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import Header from '@/components/custom-layout-elements/header';
import { Footer } from '@/components/custom-layout-elements/footer';
import { ThemeSyncer } from '@/components/misc-custom-components/theme-syncer';
import { Analytics } from '@vercel/analytics/next';

// Define the paths where the header should be hidden
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

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const showHeader =
        !hideHeaderOnPaths.includes(pathname) &&
        !hideHeaderOnPrefixes.some((prefix) => pathname.startsWith(prefix));

    return (
        <ThemeProvider defaultTheme="system">
            <SessionProvider>
                <ThemeSyncer />
                {showHeader && <Header />}
                <main className="flex flex-col flex-1">{children}</main>
                <Analytics />
                <Footer />
            </SessionProvider>
        </ThemeProvider>
    );
}
