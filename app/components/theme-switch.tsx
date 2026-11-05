'use client';

import { useRouter } from 'next/navigation';
import { THEME_COOKIE, THEME_LABEL, THEMES, type Theme } from '@/lib/artwork';

export function ThemeSwitch({ theme }: { theme: Theme }) {
  const router = useRouter();

  function choose(next: Theme) {
    if (next === theme) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    router.refresh();
  }

  return (
    <span className="pill-switch" role="group" aria-label="Artwork">
      {THEMES.map((item) => (
        <button key={item} type="button" aria-pressed={theme === item} onClick={() => choose(item)}>
          {THEME_LABEL[item]}
        </button>
      ))}
    </span>
  );
}
