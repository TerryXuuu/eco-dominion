import type { Metadata } from 'next';
import './globals.css';
import { SiteFooter } from './components/site-footer';

export const metadata: Metadata = {
  title: 'Eco Dominion',
  description: 'Community platform for two-player Eco Dominion matches.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
