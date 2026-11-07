'use client';

import { createContext, useContext } from 'react';
import { backgroundUrl, cardUrl, logoUrl, variantFor, type Theme } from '@/lib/artwork';
import type { Lang } from '@/lib/i18n';

type Art = {
  theme: Theme;
  lang: Lang;
  textFree: boolean;
  background: string;
  logo: string;
  card: (id: string) => string;
};

const ArtContext = createContext<Art>({
  theme: 'ecomon',
  lang: 'en',
  textFree: false,
  background: backgroundUrl('ecomon'),
  logo: logoUrl('ecomon', 'en'),
  card: (id) => cardUrl('ecomon', 'en', id),
});

export function ArtProvider({ theme, lang, textFree = false, children }: { theme: Theme; lang: Lang; textFree?: boolean; children: React.ReactNode }) {
  const printed = variantFor(lang);
  const value: Art = {
    theme,
    lang,
    textFree,
    background: backgroundUrl(theme),
    logo: logoUrl(theme, printed),
    card: (id) => cardUrl(theme, textFree ? 'txtfree' : printed, id),
  };
  return <ArtContext.Provider value={value}>{children}</ArtContext.Provider>;
}

export function useArt() {
  return useContext(ArtContext);
}
