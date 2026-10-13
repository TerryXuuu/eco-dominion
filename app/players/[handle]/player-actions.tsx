'use client';

import { useState } from 'react';
import { callApi } from '../../components/call-api';

type State = { following: boolean; followedBy: boolean; blocking: boolean; friend: string };

export function PlayerActions({ handle, initial, suspended }: { handle: string; initial: State; suspended: boolean }) {
  const [state, setState] = useState(initial);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  async function act(action: string) {
    const { ok, data } = await callApi<State & { error?: string }>(`/api/players/${handle}/relationship`, { method: 'POST', body: { action } });
    if (ok) {
      setState(data);
      setMessage('');
    } else setMessage(data.error ?? 'Could not update');
  }

  async function report(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await callApi<{ error?: string }>('/api/reports', { method: 'POST', body: { subjectType: 'user', handle, reason } });
    setMessage(ok ? 'Report sent to moderators.' : data.error ?? 'Could not report');
  }

  if (suspended) return <p className="note">Your account is suspended; you cannot change relationships.</p>;

  return (
    <div className="stack">
      <div className="row">
        <button type="button" onClick={() => act(state.following ? 'unfollow' : 'follow')}>{state.following ? 'Unfollow' : 'Follow'}</button>
        {state.friend === 'none' && <button className="secondary" type="button" onClick={() => act('friend')}>Add friend</button>}
        {state.friend === 'outgoing' && <span className="note">Friend request sent</span>}
        {state.friend === 'incoming' && (
          <>
            <button type="button" onClick={() => act('accept')}>Accept friend</button>
            <button className="secondary" type="button" onClick={() => act('decline')}>Decline</button>
          </>
        )}
        {state.friend === 'friends' && <button className="secondary" type="button" onClick={() => act('unfriend')}>Unfriend</button>}
        <button className="secondary" type="button" onClick={() => act(state.blocking ? 'unblock' : 'block')}>{state.blocking ? 'Unblock' : 'Block'}</button>
      </div>
      <form className="stack" onSubmit={report}>
        <label>
          Report this player
          <input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={500} required />
        </label>
        <button className="secondary" type="submit">Send report</button>
      </form>
      {message && <p className="note" role="status">{message}</p>}
    </div>
  );
}
