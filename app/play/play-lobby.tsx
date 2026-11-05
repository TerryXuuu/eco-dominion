'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { callApi } from '../components/call-api';
import { copy, type Lang } from '@/lib/i18n';

type Queue = { status: string; matchId: string | null; mode?: string | null };
type Room = { code: string; status: string; matchId: string | null };

export function PlayLobby({ activeMatchId, lang }: { activeMatchId: string | null; lang: Lang }) {
  const text = copy(lang).play;
  const router = useRouter();
  const [queue, setQueue] = useState<Queue>({ status: 'idle', matchId: null });
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (matchId: string) => router.push(`/matches/${matchId}`);

  useEffect(() => {
    callApi<Queue>('/api/queue').then(({ ok, data }) => ok && setQueue(data));
  }, []);

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
        {room?.status === 'open' ? (
          <>
            <p>{text.share} <strong className="code" aria-label="Room code">{room.code}</strong></p>
            <p className="note" role="status">{text.guest}</p>
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                const handle = (event.currentTarget.elements.namedItem('invite') as HTMLInputElement).value;
                run('/api/rooms/invite', 'POST', { code: room.code, handle }, () => undefined);
              }}
            >
              <label>{text.invite}<input name="invite" placeholder="handle" minLength={3} maxLength={24} required /></label>
              <button className="secondary" disabled={busy} type="submit">{text.send}</button>
            </form>
            <button className="secondary" disabled={busy} onClick={() => run<Room>(`/api/rooms/${room.code}`, 'DELETE', undefined, () => setRoom(null))}>{text.cancel}</button>
          </>
        ) : (
          <button disabled={busy} onClick={() => run<Room>('/api/rooms', 'POST', undefined, setRoom)}>{text.create}</button>
        )}
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            run<Room>('/api/rooms/join', 'POST', { code }, (data) => data.matchId && go(data.matchId));
          }}
        >
          <label>{text.joinLabel}<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC234" /></label>
          <button className="secondary" disabled={busy || code.trim().length !== 6} type="submit">{text.join}</button>
        </form>
      </section>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
