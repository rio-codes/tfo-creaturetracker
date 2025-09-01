import type React from "react";
import type { Metadata } from "next";
import { Tektur } from "next/font/google";
import "./globals.css";
import ClientProviders from "./ClientProviders";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
    title: "TFO.creaturetracker",
    description: "A breeding tracker for The Final Outpost",
    metadataBase: new URL("https://tfo.creaturetracker.net"),
};

const tektur = Tektur({
    subsets: ["latin"],
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
                    href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>🧬</text></svg>"
                ></link>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Tektur:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className={`${tektur.className} flex flex-col min-h-screen`}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <ClientProviders>{children}</ClientProviders>
                </ThemeProvider>
            </body>
        </html>
    );
}
