'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { OwnerProfile } from '@/lib/profile-policy';
import { copy, type Lang } from '@/lib/i18n';
import { say } from '@/lib/locale-text';

export function ProfileForm({ profile, lang, title }: { profile: OwnerProfile; lang: Lang; title?: string }) {
  const text = copy(lang).profile;
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [avatar, setAvatar] = useState('/api/profile/avatar');
  const [hasAvatar, setHasAvatar] = useState(true);

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setPending(true);
    setError('');
    setMessage('');
    const preview = URL.createObjectURL(file);
    setAvatar(preview);
    setHasAvatar(true);
    const body = new FormData();
    body.set('avatar', file);
    const response = await fetch('/api/profile/avatar', { method: 'POST', body });
    const payload = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      URL.revokeObjectURL(preview);
      setError(typeof payload.error === 'string' ? payload.error : say(lang, 'Unable to upload avatar', '无法上传头像'));
      return;
    }
    setMessage(text.avatarSaved);
    location.reload();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: form.get('displayName'),
        handle: form.get('handle'),
        bio: form.get('bio'),
        visibility: form.get('visibility'),
        locale: form.get('locale'),
      }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof body.error === 'string' ? body.error : say(lang, 'Unable to save profile', '无法保存资料'));
      return;
    }
    setMessage(text.saved);
  }

  const initial = profile.displayName.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <form className="profile-layout panel" onSubmit={onSubmit}>
      <div className="profile-portrait">
        {hasAvatar
          ? <img className="avatar large" src={avatar} alt="" onError={() => setHasAvatar(false)} />
          : <span className="avatar-fallback large" aria-hidden="true">{initial}</span>}
        <label className="button secondary avatar-pick">
          {pending ? text.uploading : text.upload}
          <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={pending} onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)} />
        </label>
        {!title && <p className="note">{text.hint}</p>}
      </div>
      <div className="profile-fields">
        {title ? <h2>{title}</h2> : <h1>{text.title}</h1>}
        <p className="note wide">{profile.email} · {profile.roles.map((role) => copy(lang).role[`${role.slice(0, 1).toUpperCase()}${role.slice(1)}` as 'Admin' | 'Moderator' | 'Guest' | 'Player'] ?? role).join(', ') || copy(lang).role.Player} · {profile.status === 'suspended' ? say(lang, 'suspended', '已封禁') : profile.status === 'active' ? say(lang, 'active', '正常') : profile.status}</p>
        {!title && (profile.roles.some((role) => role === 'moderator' || role === 'admin') || profile.roles.includes('admin')) && (
          <p className="wide">
            {profile.roles.some((role) => role === 'moderator' || role === 'admin') && <Link href="/moderation">{text.moderation}</Link>}
            {profile.roles.includes('admin') && <> · <Link href="/admin">{text.admin}</Link></>}
          </p>
        )}
        {profile.status === 'suspended' && <p className="error wide">{text.suspended}</p>}
        <label>{text.display}<input name="displayName" defaultValue={profile.displayName} maxLength={40} required /></label>
        <label>{text.handle}<input name="handle" defaultValue={profile.handle} minLength={3} maxLength={24} required /></label>
        <label>{text.visibility}
          <select name="visibility" defaultValue={profile.visibility}>
            <option value="public">{copy(lang).community.public}</option>
            <option value="friends">{copy(lang).community.friends}</option>
            <option value="private">{copy(lang).community.private}</option>
          </select>
        </label>
        <label>{text.locale}<input name="locale" defaultValue={profile.locale} pattern="[a-z]{2}-[A-Z]{2}" required /></label>
        <label className="wide">{text.bio}<textarea name="bio" defaultValue={profile.bio} maxLength={280} /></label>
        {error && <p className="error wide">{error}</p>}
        {message && <p className="wide">{message}</p>}
        <button disabled={pending} type="submit">{pending ? text.saving : text.save}</button>
      </div>
    </form>
  );
}
