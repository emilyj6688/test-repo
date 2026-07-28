import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CineRank - Media Tracking & Pairwise Ranking App',
  description: 'Search, track, rate, and contextually rank your favorite movies and TV shows through head-to-head pairwise comparisons.',
};

import { Providers } from './providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
