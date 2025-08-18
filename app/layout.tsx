import type React from "react"
import type { Metadata } from "next"
import { Tektur } from 'next/font/google';
import "./globals.css"
import ClientProviders from "./ClientProviders"

export const metadata: Metadata = {
  title: "TFO.creaturetracker",
  description: "This is a utility site for the web game The Final Outpost to manage your collection, research goals, and breeding pairs",
    metadataBase: new URL('https://tfo.creaturetracker.net'),
}

const tektur = Tektur({
  subsets: ['latin'],
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>🧬</text></svg>">
        </link>
      </head>
      <body className="{tektur.className} min-h-screen flex flex-col">      
          <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
