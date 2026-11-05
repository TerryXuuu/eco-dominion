'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestReset } from './actions';
import { say, shownNotice } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

export function RecoverForm({ lang }: { lang: Lang }) {
  const [state, action, pending] = useActionState(requestReset, null);
  return (
    <main className="shell">
      <form className="form panel" action={action}>
        <h1>{say(lang, 'Recover account', '找回账号')}</h1>
        <p className="note">{say(lang, 'Neon Auth sends the recovery message. This app never stores the password.', '找回邮件由 Neon Auth 发送。本应用不保存密码。')}</p>
        <label>{say(lang, 'Email', '邮箱')}<input name="email" type="email" autoComplete="email" required /></label>
        {state?.error && <p className="error">{shownNotice(lang, state.error)}</p>}
        {state?.message && <p>{shownNotice(lang, state.message)}</p>}
        <button disabled={pending} type="submit">{pending ? say(lang, 'Requesting…', '发送中…') : say(lang, 'Send recovery link', '发送找回链接')}</button>
        <p className="note"><Link href="/login">{say(lang, 'Back to log in', '返回登录')}</Link></p>
      </form>
    </main>
  );
}
