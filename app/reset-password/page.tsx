'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { resetPassword } from './actions';

function ResetForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
  const token = useSearchParams().get('token') ?? '';
  return (
    <form className="form panel" action={action}>
      <h1>Choose a new password</h1>
      <input name="token" type="hidden" value={token} />
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      {!token && <p className="error">This recovery link has no token.</p>}
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={pending || !token} type="submit">{pending ? 'Saving…' : 'Update password'}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="shell">
      <Suspense fallback={<p className="note">Loading recovery form…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
