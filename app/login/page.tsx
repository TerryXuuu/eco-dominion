'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <main className="shell">
      <form className="form panel" action={action}>
        <h1>Log in</h1>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {state?.error && <p className="error">{state.error}</p>}
        <button disabled={pending} type="submit">{pending ? 'Checking…' : 'Log in'}</button>
        <p className="note"><Link href="/recover">Forgot password</Link> · <Link href="/register">Create an account</Link></p>
      </form>
    </main>
  );
}
