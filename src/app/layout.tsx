import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CineRank - Media Tracking & Pairwise Ranking App',
  description: 'Search, track, rate, and contextually rank your favorite movies and TV shows through head-to-head pairwise comparisons.',
  icons: {
    icon: [
      { url: 'favicon.ico' },
      { url: 'favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: 'favicon.ico',
    apple: 'favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="favicon.ico" sizes="any" />
        <link rel="icon" href="favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="favicon.ico" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
