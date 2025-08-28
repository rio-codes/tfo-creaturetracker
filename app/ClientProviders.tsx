"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import Header from "@/components/custom-layout-elements/header";
import { Footer } from "@/components/custom-layout-elements/footer";
import { Alert } from "@/components/ui/alert";

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Define the paths where the header should be hidden
    const hideHeaderOnPaths = [
        "/",
        "/login",
        "/register",
        "/terms",
        "/privacy",
        "/forgot-password",
        "/password-reset",
    ];
    const showHeader = !hideHeaderOnPaths.includes(pathname);

    return (
        <SessionProvider>
            {showHeader && <Header />}
            <main className="flex-1 isolation-auto">
                <div className="z-50 object-center"><Alert /></div>
                {children}
            </main>
            <Footer />
        </SessionProvider>
    );
}
