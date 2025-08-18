'use client'

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation'
import Header from "@/components/header"
import { Footer } from "@/components/footer"

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Define the paths where the header should be hidden
    const hideHeaderOnPaths = ['/', '/login', '/register', '/terms', '/privacy', '/forgot-password', '/password-reset']
    const showHeader = !hideHeaderOnPaths.includes(pathname)

    return (
        <SessionProvider>
            {showHeader && <Header />}
            <main className="flex-1">{children}</main>
            <Footer />
        </SessionProvider>
    )
}