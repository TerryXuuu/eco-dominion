'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { OwnerProfile } from '@/lib/profile-policy';

export function ProfileForm({ profile }: { profile: OwnerProfile }) {
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
      setError(typeof payload.error === 'string' ? payload.error : 'Unable to upload avatar');
      return;
    }
    setMessage('Avatar updated.');
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
      setError(typeof body.error === 'string' ? body.error : 'Unable to save profile');
      return;
    }
    setMessage('Profile saved.');
  }

  const initial = profile.displayName.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <form className="profile-layout panel" onSubmit={onSubmit}>
      <div className="profile-portrait">
        {hasAvatar
          ? <img className="avatar large" src={avatar} alt="" onError={() => setHasAvatar(false)} />
          : <span className="avatar-fallback large" aria-hidden="true">{initial}</span>}
        <label className="button secondary avatar-pick">
          {pending ? 'Uploading…' : 'Upload avatar'}
          <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={pending} onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)} />
        </label>
        <p className="note">JPEG, PNG, WebP, or GIF. 1.5 MB max.</p>
      </div>
      <div className="profile-fields">
        <h1>Your profile</h1>
        <p className="note wide">{profile.email} · {profile.roles.join(', ') || 'player'} · {profile.status}</p>
        {(profile.roles.some((role) => role === 'moderator' || role === 'admin') || profile.roles.includes('admin')) && (
          <p className="wide">
            {profile.roles.some((role) => role === 'moderator' || role === 'admin') && <Link href="/moderation">Moderation queue</Link>}
            {profile.roles.includes('admin') && <> · <Link href="/admin">Admin console</Link></>}
          </p>
        )}
        {profile.status === 'suspended' && <p className="error wide">Your account is suspended; you can read but not make changes.</p>}
        <label>Display name<input name="displayName" defaultValue={profile.displayName} maxLength={40} required /></label>
        <label>Handle<input name="handle" defaultValue={profile.handle} minLength={3} maxLength={24} required /></label>
        <label>Visibility
          <select name="visibility" defaultValue={profile.visibility}>
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label>Locale<input name="locale" defaultValue={profile.locale} pattern="[a-z]{2}-[A-Z]{2}" required /></label>
        <label className="wide">Bio<textarea name="bio" defaultValue={profile.bio} maxLength={280} /></label>
        {error && <p className="error wide">{error}</p>}
        {message && <p className="wide">{message}</p>}
        <button disabled={pending} type="submit">{pending ? 'Saving…' : 'Save profile'}</button>
      </div>
    </form>
  );
}
