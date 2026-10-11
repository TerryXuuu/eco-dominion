'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUp } from './actions';

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <main className="shell">
      <form className="form panel" action={action}>
        <h1>Register</h1>
        <label>Display name<input name="name" type="text" autoComplete="nickname" minLength={1} maxLength={40} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        {state?.error && <p className="error">{state.error}</p>}
        <button disabled={pending} type="submit">{pending ? 'Creating…' : 'Create account'}</button>
        <p className="note">Already registered? <Link href="/login">Log in</Link></p>
      </form>
    </main>
  );
}
