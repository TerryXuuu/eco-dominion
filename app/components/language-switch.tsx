'use client';

import { useRouter } from 'next/navigation';
import { LANG_COOKIE, type Lang } from '@/lib/i18n';

export function LanguageSwitch({ lang }: { lang: Lang }) {
  const router = useRouter();

  function choose(next: Lang) {
    if (next === lang) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LANG_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    router.refresh();
  }

  return (
    <span className="pill-switch" role="group" aria-label={lang === 'zh' ? '语言' : 'Language'}>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => choose('en')}>EN</button>
      <button type="button" aria-pressed={lang === 'zh'} onClick={() => choose('zh')}>中文</button>
    </span>
  );
}
