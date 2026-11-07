'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { callApi } from '../components/call-api';
import { copy, type Lang } from '@/lib/i18n';

type Queue = { status: string; matchId: string | null; mode?: string | null };
type Room = { code: string; status: string; matchId: string | null };
type Person = { handle: string; displayName: string };
type Invite = { code: string; handle: string; displayName: string };

export function PlayLobby({ activeMatchId, lang }: { activeMatchId: string | null; lang: Lang }) {
  const text = copy(lang).play;
  const router = useRouter();
  const [queue, setQueue] = useState<Queue>({ status: 'idle', matchId: null });
  const [room, setRoom] = useState<Room | null>(null);
  const [friends, setFriends] = useState<Person[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (matchId: string) => router.push(`/matches/${matchId}`);

  useEffect(() => {
    callApi<Queue>('/api/queue').then(({ ok, data }) => ok && setQueue(data));
    callApi<{ friends: Person[] }>('/api/relationships').then(({ ok, data }) => ok && setFriends(data.friends));
  }, []);

  useEffect(() => {
    if (activeMatchId) return;
    let stopped = false;
    const pull = async () => {
      const { ok, data } = await callApi<{ invites: Invite[] }>('/api/rooms/invites');
      if (!stopped && ok) setInvites(data.invites);
    };
    void pull();
    const timer = setInterval(pull, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [activeMatchId]);

  useEffect(() => {
    if (queue.status !== 'waiting') return;
    const timer = setInterval(async () => {
      const { ok, data } = await callApi<Queue>('/api/queue');
      if (!ok) return;
      if (data.status === 'matched' && data.matchId) {
        go(data.matchId);
        return;
      }
      setQueue(data);
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.status]);

  useEffect(() => {
    if (room?.status === 'started' && room.matchId) go(room.matchId);
    if (!room || room.status !== 'open') return;
    const timer = setInterval(async () => {
      const { ok, data } = await callApi<Room>(`/api/rooms/${room.code}`);
      if (ok) setRoom(data);
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.code]);

  async function run<T>(path: string, method: string, body: unknown, onOk: (data: T) => void) {
    setBusy(true);
    setError('');
    const { ok, data } = await callApi<T & { error?: string; matchId?: string }>(path, { method, body });
    setBusy(false);
    if (ok) onOk(data);
    else if (data.matchId) go(data.matchId);
    else setError(data.error ?? text.failed);
  }

  if (activeMatchId) {
    return (
      <section className="panel stack">
        <h2>{text.inProgress}</h2>
        <p className="note">{text.finishFirst}</p>
        <div className="row"><Link className="button" href={`/matches/${activeMatchId}`}>{text.return}</Link></div>
      </section>
    );
  }

  const waiting = queue.status === 'waiting';
  const waitingRanked = waiting && queue.mode === 'ranked';
  const waitingCasual = waiting && queue.mode !== 'ranked';
  const find = (mode: 'ranked' | 'casual') => run<Queue>('/api/queue', 'POST', { mode }, (data) => {
    if (data.status === 'matched' && data.matchId) go(data.matchId);
    else setQueue(data);
  });

  return (
    <div className="modes">
      <section className="panel mode-card">
        <h2>{text.ranked}</h2>
        <p className="note mode-lead">{text.rankedNote}</p>
        {waitingRanked ? (
          <div className="mode-actions">
            <p className="note" role="status">{text.waiting}</p>
            <button className="secondary" disabled={busy} onClick={() => run<Queue>('/api/queue', 'DELETE', undefined, setQueue)}>{text.leave}</button>
          </div>
        ) : (
          <button className="mode-go" disabled={busy || waitingCasual} onClick={() => find('ranked')}>{text.findRanked}</button>
        )}
      </section>
      <section className="panel mode-card">
        <h2>{text.casual}</h2>
        <p className="note mode-lead">{text.casualNote}</p>
        {waitingCasual ? (
          <div className="mode-actions">
            <p className="note" role="status">{text.waiting}</p>
            <button className="secondary" disabled={busy} onClick={() => run<Queue>('/api/queue', 'DELETE', undefined, setQueue)}>{text.leave}</button>
          </div>
        ) : (
          <button className="mode-go" disabled={busy || waitingRanked} onClick={() => find('casual')}>{text.find}</button>
        )}
      </section>
      <section className="panel mode-card">
        <h2>{text.practice}</h2>
        <p className="note mode-lead">{text.practiceNote}</p>
        <button className="mode-go" disabled={busy} onClick={() => run<{ matchId: string }>('/api/practice', 'POST', undefined, (data) => data.matchId && go(data.matchId))}>{text.playGrove}</button>
      </section>
      <section className="panel mode-card">
        <h2>{text.room}</h2>
        <p className="note mode-lead">{text.roomNote}</p>
        {invites.length > 0 && (
          <div className="stack">
            <p className="note">{text.incoming}</p>
            {invites.map((invite) => (
              <button key={invite.code} className="secondary" disabled={busy} type="button" onClick={() => run<Room>('/api/rooms/join', 'POST', { code: invite.code }, (data) => data.matchId && go(data.matchId))}>
                {invite.displayName} · {text.joinFriend}
              </button>
            ))}
          </div>
        )}
        {room?.status === 'open' ? (
          <>
            <p className="note" role="status">{text.waitingFriend}</p>
            <p className="note">{text.pickFriend}</p>
            {friends.length === 0 && <p className="note">{text.noFriends}</p>}
            <div className="row">
              {friends.map((person) => (
                <button
                  key={person.handle}
                  className="secondary"
                  disabled={busy}
                  type="button"
                  onClick={() => run('/api/rooms/invite', 'POST', { code: room.code, handle: person.handle }, () => setNote(`${text.invited} ${person.displayName}`))}
                >
                  {person.displayName}
                </button>
              ))}
            </div>
            {note && <p className="note">{note}</p>}
            <button className="secondary" disabled={busy} onClick={() => run<Room>(`/api/rooms/${room.code}`, 'DELETE', undefined, () => { setRoom(null); setNote(''); })}>{text.cancel}</button>
          </>
        ) : (
          <button className="mode-go" disabled={busy} onClick={() => run<Room>('/api/rooms', 'POST', undefined, setRoom)}>{text.create}</button>
        )}
      </section>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
