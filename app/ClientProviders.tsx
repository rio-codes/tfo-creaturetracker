'use client'

import { usePathname } from 'next/navigation'
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

type ProvidersProps = {
    children: ReactNode;
};

export default function ClientProviders({ children }: ProvidersProps) {
    const pathname = usePathname()

    // Define the paths where the header should be hidden
    const hideHeaderOnPaths = ['/', '/login', '/register', '/terms', '/privacy']
    const showHeader = !hideHeaderOnPaths.includes(pathname)

    return (
        <>
        <SessionProvider>{showHeader && <Header />}</SessionProvider>
        <main className="flex-1">{children}</main>
        <Footer />
        </>
    )
}