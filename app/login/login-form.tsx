'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn } from './actions';
import { copy, type Lang } from '@/lib/i18n';
import { shownNotice } from '@/lib/locale-text';

export function LoginForm({ lang }: { lang: Lang }) {
  const text = copy(lang).login;
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <main className="shell">
      <form className="form panel" action={action}>
        <h1>{text.title}</h1>
        <label>{text.email}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{text.password}<input name="password" type="password" autoComplete="current-password" required /></label>
        {state?.error && <p className="error">{shownNotice(lang, state.error)}</p>}
        <button disabled={pending} type="submit">{pending ? text.checking : text.submit}</button>
        <p className="note"><Link href="/recover">{text.forgot}</Link> · <Link href="/register">{text.create}</Link></p>
      </form>
    </main>
  );
}
