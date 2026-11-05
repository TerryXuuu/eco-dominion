'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUp } from './actions';
import { say, shownNotice } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

export function RegisterForm({ lang }: { lang: Lang }) {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <main className="shell">
      <form className="form panel" action={action}>
        <h1>{say(lang, 'Register', '注册')}</h1>
        <label>{say(lang, 'Display name', '显示名')}<input name="name" type="text" autoComplete="nickname" minLength={1} maxLength={40} required /></label>
        <label>{say(lang, 'Email', '邮箱')}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{say(lang, 'Password', '密码')}<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        {state?.error && <p className="error">{shownNotice(lang, state.error)}</p>}
        <button disabled={pending} type="submit">{pending ? say(lang, 'Creating…', '创建中…') : say(lang, 'Create account', '创建账号')}</button>
        <p className="note">{say(lang, 'Already registered?', '已经注册？')} <Link href="/login">{say(lang, 'Log in', '登录')}</Link></p>
      </form>
    </main>
  );
}
