import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eco Dominion',
  description: 'Community platform for two-player Eco Dominion matches.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
