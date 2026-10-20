'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestReset } from './actions';

export function RecoverForm() {
  const [state, action, pending] = useActionState(requestReset, null);
  return (
    <main className="shell">
      <form className="form panel" action={action}>
        <h1>Recover account</h1>
        <p className="note">Neon Auth sends the recovery message. This app never stores the password.</p>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        {state?.error && <p className="error">{state.error}</p>}
        {state?.message && <p>{state.message}</p>}
        <button disabled={pending} type="submit">{pending ? 'Requesting…' : 'Send recovery link'}</button>
        <p className="note"><Link href="/login">Back to log in</Link></p>
      </form>
    </main>
  );
}
