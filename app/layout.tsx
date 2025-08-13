import './globals.css';

import { Tektur } from 'next/font/google';

let title = 'TFO.creaturetracker';
let description =
  'This is a utility site for the web game TFO to manage your collection, research goals, and breeding pairs';

const tektur = Tektur({
    subsets: ['latin'],
})

export const metadata = {
  title,
  description,
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  metadataBase: new URL('https://tfo.creaturetracker.net'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={tektur.className}>{children}</body>
    </html>
  );
}
