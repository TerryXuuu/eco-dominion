'use client';

import { useState } from 'react';
import { callApi } from '../../components/call-api';
import { say } from '@/lib/locale-text';
import type { Lang } from '@/lib/i18n';

type State = { following: boolean; followedBy: boolean; blocking: boolean; friend: string };

export function PlayerActions({ handle, initial, suspended, lang }: { handle: string; initial: State; suspended: boolean; lang: Lang }) {
  const [state, setState] = useState(initial);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  async function act(action: string) {
    const { ok, data } = await callApi<State & { error?: string }>(`/api/players/${handle}/relationship`, { method: 'POST', body: { action } });
    if (ok) {
      setState(data);
      setMessage('');
    } else setMessage(data.error ?? say(lang, 'Could not update', '无法更新'));
  }

  async function report(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await callApi<{ error?: string }>('/api/reports', { method: 'POST', body: { subjectType: 'user', handle, reason } });
    setMessage(ok ? say(lang, 'Report sent to moderators.', '已交给版主。') : data.error ?? say(lang, 'Could not report', '无法举报'));
  }

  if (suspended) return <p className="note">{say(lang, 'Your account is suspended; you cannot change relationships.', '账号已封禁，不能更改关系。')}</p>;

  return (
    <div className="stack">
      <div className="row">
        <button type="button" onClick={() => act(state.following ? 'unfollow' : 'follow')}>{state.following ? say(lang, 'Unfollow', '取消关注') : say(lang, 'Follow', '关注')}</button>
        {state.friend === 'none' && <button className="secondary" type="button" onClick={() => act('friend')}>{say(lang, 'Add friend', '加好友')}</button>}
        {state.friend === 'outgoing' && <span className="note">{say(lang, 'Friend request sent', '好友请求已发送')}</span>}
        {state.friend === 'incoming' && (
          <>
            <button type="button" onClick={() => act('accept')}>{say(lang, 'Accept friend', '接受好友')}</button>
            <button className="secondary" type="button" onClick={() => act('decline')}>{say(lang, 'Decline', '拒绝')}</button>
          </>
        )}
        {state.friend === 'friends' && <button className="secondary" type="button" onClick={() => act('unfriend')}>{say(lang, 'Unfriend', '解除好友')}</button>}
        <button className="secondary" type="button" onClick={() => act(state.blocking ? 'unblock' : 'block')}>{state.blocking ? say(lang, 'Unblock', '取消屏蔽') : say(lang, 'Block', '屏蔽')}</button>
      </div>
      <form className="stack" onSubmit={report}>
        <label>
          {say(lang, 'Report this player', '举报这名玩家')}
          <input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} required />
        </label>
        <button className="secondary" type="submit">{say(lang, 'Send report', '发送举报')}</button>
      </form>
      {message && <p className="note" role="status">{message}</p>}
    </div>
  );
}
