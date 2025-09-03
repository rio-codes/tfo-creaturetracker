'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import Header from '@/components/custom-layout-elements/header';
import { Footer } from '@/components/custom-layout-elements/footer';
import { Alert } from '@/components/ui/alert';
import { ThemeSyncer } from '@/components/misc-custom-components/theme-syncer';
import { Analytics } from '@vercel/analytics/next';

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

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
    const showHeader = !hideHeaderOnPaths.includes(pathname);

    return (
        <ThemeProvider enableSystem={true} defaultTheme="system">
            <SessionProvider>
                <ThemeSyncer />
                {showHeader && <Header />}
                <main className="flex flex-col flex-1 isolation-auto">
                    <div className="z-50 object-center">
                        <Alert />
                    </div>
                    {children}
                </main>
                <Analytics />
                <Footer />
            </SessionProvider>
        </ThemeProvider>
    );
}
