import { CATALOG } from './cards';
import type { Lang } from './i18n';

export const THEMES = ['ecomon', 'ekoris', 'seiha'] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_COOKIE = 'eco-theme';

/** Folder under each theme's cards/ and logo/. `txtfree` is wired for the text-free set. */
export const ART_VARIANTS = ['cn', 'en', 'txtfree'] as const;
export type ArtVariant = (typeof ART_VARIANTS)[number];

export const THEME_LABEL: Record<Theme, string> = {
  ecomon: 'Ecomon',
  ekoris: 'Ekoris',
  seiha: 'Seiha',
};

export function parseTheme(value: string | undefined | null): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : 'ecomon';
}

export function variantFor(lang: Lang): ArtVariant {
  return lang === 'zh' ? 'cn' : 'en';
}

/** ED-01_草地啮鼠.png matches catalog order and the Chinese card name. */
export const CARD_FILE: Record<string, string> = Object.fromEntries(
  CATALOG.map((card, index) => [card.id, `ED-${String(index + 1).padStart(2, '0')}_${card.name}.png`]),
);

export function backgroundUrl(theme: Theme) {
  return `/art/${theme}/background`;
}

export function logoUrl(theme: Theme, variant: ArtVariant) {
  return `/art/${theme}/logo/${variant}`;
}

export function cardUrl(theme: Theme, variant: ArtVariant, id: string) {
  return `/art/${theme}/cards/${variant}/${id}`;
}
