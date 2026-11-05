'use client';

import { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from './actions';
import { say, shownNotice } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

function ResetFields({ lang }: { lang: Lang }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  const token = useSearchParams().get('token') ?? '';
  return (
    <form className="form panel" action={action}>
      <h1>{say(lang, 'Choose a new password', '设置新密码')}</h1>
      <input name="token" type="hidden" value={token} />
      <label>{say(lang, 'New password', '新密码')}<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      {!token && <p className="error">{say(lang, 'This recovery link has no token.', '这个找回链接没有令牌。')}</p>}
      {state?.error && <p className="error">{shownNotice(lang, state.error)}</p>}
      <button disabled={pending || !token} type="submit">{pending ? say(lang, 'Saving…', '保存中…') : say(lang, 'Update password', '更新密码')}</button>
    </form>
  );
}

export function ResetForm({ lang }: { lang: Lang }) {
  return (
    <main className="shell">
      <Suspense fallback={<p className="note">{say(lang, 'Loading recovery form…', '正在加载找回表单…')}</p>}>
        <ResetFields lang={lang} />
      </Suspense>
    </main>
  );
}
