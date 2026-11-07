'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CARD_TEXT_COOKIE } from '@/lib/artwork';
import { copy, type Lang } from '@/lib/i18n';
import { say } from '@/lib/locale-text';
import type { OwnerProfile } from '@/lib/profile-policy';

export function GameSettings({ lang, textFree }: { lang: Lang; textFree: boolean }) {
  const text = copy(lang).settings;
  const router = useRouter();

  function choose(plain: boolean) {
    if (plain === textFree) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CARD_TEXT_COOKIE}=${plain ? 'plain' : 'printed'}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    router.refresh();
  }

  return (
    <section className="panel stack">
      <h2>{text.game}</h2>
      <div className="settings-line">
        <span>{text.textFree}</span>
        <span className="pill-switch" role="group" aria-label={text.textFree}>
          <button type="button" aria-pressed={textFree} onClick={() => choose(true)}>{text.on}</button>
          <button type="button" aria-pressed={!textFree} onClick={() => choose(false)}>{text.off}</button>
        </span>
      </div>
    </section>
  );
}

export function PrivacySettings({ lang, profile }: { lang: Lang; profile: OwnerProfile }) {
  const text = copy(lang).settings;
  const home = copy(lang).home;
  const [hideRecord, setHideRecord] = useState(profile.hideRecord);
  const [hideAchievements, setHideAchievements] = useState(profile.hideAchievements);
  const [hideHotspot, setHideHotspot] = useState(profile.hideHotspot);
  const [hideActivity, setHideActivity] = useState(profile.hideActivity);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: profile.displayName,
        handle: profile.handle,
        bio: profile.bio,
        visibility: profile.visibility,
        locale: profile.locale,
        hideRecord,
        hideAchievements,
        hideHotspot,
        hideActivity,
      }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof body.error === 'string' ? body.error : say(lang, 'Unable to save', '无法保存'));
      return;
    }
    setMessage(text.saved);
  }

  return (
    <form className="panel stack" onSubmit={save}>
      <h2>{text.privacy}</h2>
      <div className="privacy-options">
        <label className="check-row"><span>{home.record}</span><input type="checkbox" checked={hideRecord} onChange={(event) => setHideRecord(event.target.checked)} /></label>
        <label className="check-row"><span>{home.achievements}</span><input type="checkbox" checked={hideAchievements} onChange={(event) => setHideAchievements(event.target.checked)} /></label>
        <label className="check-row"><span>{home.hotspot}</span><input type="checkbox" checked={hideHotspot} onChange={(event) => setHideHotspot(event.target.checked)} /></label>
        <label className="check-row"><span>{home.activity}</span><input type="checkbox" checked={hideActivity} onChange={(event) => setHideActivity(event.target.checked)} /></label>
      </div>
      {error && <p className="error">{error}</p>}
      {message && <p className="note">{message}</p>}
      <button className="settings-save" disabled={pending} type="submit">{pending ? copy(lang).profile.saving : copy(lang).profile.save}</button>
    </form>
  );
}
