'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { OwnerProfile } from '@/lib/profile-policy';

export function ProfileForm({ profile }: { profile: OwnerProfile }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

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

  return (
    <form className="form panel" onSubmit={onSubmit}>
      <h1>Your profile</h1>
      <p className="note">{profile.email} · {profile.roles.join(', ') || 'player'} · {profile.status}</p>
      {profile.roles.some((role) => role === 'moderator' || role === 'admin') && <p><Link href="/moderation">Moderation queue</Link></p>}
      {profile.status === 'suspended' && <p className="error">Your account is suspended; you can read but not make changes.</p>}
      <label>Handle<input name="handle" defaultValue={profile.handle} minLength={3} maxLength={24} required /></label>
      <label>Display name<input name="displayName" defaultValue={profile.displayName} maxLength={40} required /></label>
      <label>Bio<textarea name="bio" defaultValue={profile.bio} maxLength={280} /></label>
      <label>Visibility
        <select name="visibility" defaultValue={profile.visibility}>
          <option value="public">Public</option>
          <option value="friends">Friends</option>
          <option value="private">Private</option>
        </select>
      </label>
      <label>Locale<input name="locale" defaultValue={profile.locale} pattern="[a-z]{2}-[A-Z]{2}" required /></label>
      {error && <p className="error">{error}</p>}
      {message && <p>{message}</p>}
      <button disabled={pending} type="submit">{pending ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}
