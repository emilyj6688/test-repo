import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Aperture - Cinematic Media Tracker & Ranking Engine',
  description: 'Search, track, rate, and rank your favorite movies and TV shows in an elegant vintage cinematic experience.',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@500;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="favicon.ico" sizes="any" />
        <link rel="icon" href="favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="favicon.ico" />
      </head>
      <body className="antialiased bg-[#071318] text-[#eef4f6] min-h-screen selection:bg-[#c88e58] selection:text-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
