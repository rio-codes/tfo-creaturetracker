import './globals.css';

import { GeistSans } from 'geist/font/sans';

let title = 'TFO.creaturetracker';
let description =
  'This is a utility site for the web game TFO to manage your collection, research goals, and breeding pairs';

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
      <body className={GeistSans.variable}>{children}</body>
    </html>
  );
}
