import type { Metadata, Viewport } from 'next';
import { Fraunces, Noto_Serif_SC } from 'next/font/google';
import './globals.css';
import { ArtProvider } from './components/art-context';
import { SiteFooter } from './components/site-footer';
import { logoUrl, variantFor } from '@/lib/artwork';
import { getLang } from '@/lib/lang';
import { getTextFree } from '@/lib/card-face';
import { getTheme } from '@/lib/theme';

const latin = Fraunces({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-latin',
});

const chinese = Noto_Serif_SC({
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-sc',
  preload: false,
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  const [lang, theme] = await Promise.all([getLang(), getTheme()]);
  return {
    title: 'Eco Dominion',
    description: 'Community platform for two-player Eco Dominion matches.',
    icons: { icon: logoUrl(theme, variantFor(lang)) },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, theme, textFree] = await Promise.all([getLang(), getTheme(), getTextFree()]);
  return (
    <html lang={lang === 'zh' ? 'zh-CN' : 'en'} className={`${latin.variable} ${chinese.variable}`}>
      <body>
        <ArtProvider theme={theme} lang={lang} textFree={textFree}>
          {children}
          <SiteFooter />
        </ArtProvider>
      </body>
    </html>
  );
}
