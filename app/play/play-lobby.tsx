'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { callApi } from '../components/call-api';

type Queue = { status: string; matchId: string | null };
type Room = { code: string; status: string; matchId: string | null };

export function PlayLobby({ activeMatchId }: { activeMatchId: string | null }) {
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
    if (queue.status === 'matched' && queue.matchId) go(queue.matchId);
    if (queue.status !== 'waiting') return;
    const timer = setInterval(async () => {
      const { ok, data } = await callApi<Queue>('/api/queue');
      if (ok) setQueue(data);
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.status, queue.matchId]);

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
    else setError(data.error ?? 'Something went wrong; try again');
  }

  if (activeMatchId) {
    return (
      <section className="panel stack">
        <h2>You have a match in progress</h2>
        <p className="note">Finish or concede it before starting another.</p>
        <div className="row"><Link className="button" href={`/matches/${activeMatchId}`}>Return to your match</Link></div>
      </section>
    );
  }

  return (
    <div className="grid">
      <section className="panel stack">
        <h2>Casual queue</h2>
        {queue.status === 'waiting' ? (
          <>
            <p className="note" role="status">Waiting for another player…</p>
            <button className="secondary" disabled={busy} onClick={() => run<Queue>('/api/queue', 'DELETE', undefined, setQueue)}>Leave queue</button>
          </>
        ) : (
          <button disabled={busy} onClick={() => run<Queue>('/api/queue', 'POST', undefined, setQueue)}>Find a casual match</button>
        )}
      </section>
      <section className="panel stack">
        <h2>Practice</h2>
        <p className="note">Grove takes the other seat immediately. Practice is unrated, so your casual rating stays where it is.</p>
        <button disabled={busy} onClick={() => run<{ matchId: string }>('/api/practice', 'POST', undefined, (data) => data.matchId && go(data.matchId))}>Play Grove</button>
      </section>
      <section className="panel stack">
        <h2>Private room</h2>
        {room?.status === 'open' ? (
          <>
            <p>Share this code: <strong className="code" aria-label="Room code">{room.code}</strong></p>
            <p className="note" role="status">Waiting for your guest to join…</p>
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                const handle = (event.currentTarget.elements.namedItem('invite') as HTMLInputElement).value;
                run('/api/rooms/invite', 'POST', { code: room.code, handle }, () => undefined);
              }}
            >
              <label>Invite a friend<input name="invite" placeholder="handle" minLength={3} maxLength={24} required /></label>
              <button className="secondary" disabled={busy} type="submit">Send invite</button>
            </form>
            <button className="secondary" disabled={busy} onClick={() => run<Room>(`/api/rooms/${room.code}`, 'DELETE', undefined, () => setRoom(null))}>Cancel room</button>
          </>
        ) : (
          <button disabled={busy} onClick={() => run<Room>('/api/rooms', 'POST', undefined, setRoom)}>Create a private room</button>
        )}
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            run<Room>('/api/rooms/join', 'POST', { code }, (data) => data.matchId && go(data.matchId));
          }}
        >
          <label>Join with a code<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC234" /></label>
          <button className="secondary" disabled={busy || code.trim().length !== 6} type="submit">Join room</button>
        </form>
      </section>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
